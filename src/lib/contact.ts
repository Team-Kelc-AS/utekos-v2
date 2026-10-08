import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import type { ContactEmailAttachment } from "./contact-email-attachments";

export const singleLine = (max: number) => z.string().trim().max(max, {
  error: `Bruk maksimalt ${max} tegn.`,
}).refine((value) => !/[\r\n\u0000]/u.test(value), { error: "Bruk én linje i dette feltet." });

export const contactSchema = z.object({
  name: singleLine(100).min(2, { error: "Skriv navnet ditt, minst 2 tegn." }),
  email: singleLine(254).pipe(z.email({ error: "Skriv en gyldig e-postadresse." })),
  phone: singleLine(40),
  orderNumber: singleLine(80),
  message: z.string().trim().min(10, { error: "Skriv minst 10 tegn om hva du trenger hjelp med." })
    .max(5000, { error: "Meldingen kan være maksimalt 5000 tegn." }),
  privacy: z.boolean().refine(Boolean, { error: "Bekreft at du har lest personvernerklæringen." }),
});

const emailConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  from: z.email(),
  to: z.email(),
});

export function getContactEmailConfig(recipient?: string) {
  const result = emailConfigSchema.safeParse({
    apiKey: process.env.RESEND_HEADLESS_API_KEY_RESEND_API_KEY || process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL || "kundeservice@utekos.no",
    to: recipient ?? process.env.CONTACT_FORM_SEND_TO_EMAIL,
  });
  return result.success ? result.data : null;
}

export async function sendContactEmail(submission: z.infer<typeof contactSchema>, attachments: ContactEmailAttachment[] = []) {
  return sendContactMessage({
    replyTo: submission.email,
    subject: `Ny henvendelse fra ${submission.name}`,
    text: [
      `Navn: ${submission.name}`,
      `E-post: ${submission.email}`,
      `Telefon: ${submission.phone || "Ikke oppgitt"}`,
      `Ordrenummer: ${submission.orderNumber || "Ikke oppgitt"}`,
      "Personvernerklæring: bekreftet lest",
      "",
      submission.message,
    ].join("\n"),
    attachments,
  });
}

// Shared delivery contract. Callers validate their own form before constructing
// the message; recipients are chosen by server code, never by submitted fields.
export async function sendContactMessage({ replyTo, subject, text, attachments = [], idempotencyPrefix = "contact-form", recipient }: {
  replyTo: string;
  subject: string;
  text: string;
  attachments?: ContactEmailAttachment[];
  idempotencyPrefix?: "contact-form" | "dealer-inquiry";
  recipient?: string;
}) {
  const config = getContactEmailConfig(recipient);
  if (!config) return false;

  const payload = {
    from: `Utekos Kontaktskjema <${config.from}>`,
    to: [config.to],
    reply_to: replyTo,
    subject,
    // Plain text keeps customer input out of HTML and preserves line breaks.
    text,
    ...(attachments.length ? { attachments } : {}),
  };
  // Resend deduplicates identical submissions for 24 hours, including retries without
  // JavaScript or after a lost response. Changed content gets its own key.
  const key = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${idempotencyPrefix}/${key}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    const receipt = z.object({ id: z.string().min(1) }).safeParse(body);
    return receipt.success ? { receiptId: receipt.data.id } : false;
  } catch {
    // Do not return provider errors or log customers' messages/contact details.
    return false;
  }
}
