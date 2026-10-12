import "server-only";

import { createHash } from "node:crypto";
import * as z from "@/lib/validation/zodMini";
import type { ContactEmailAttachment } from "./contact-email-attachments";

const emailConfigSchema = z.object({
  apiKey: z.string().check(z.trim(), z.minLength(1)),
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

// Shared delivery contract. Callers validate their own form before constructing
// the message; recipients are chosen by server code, never by submitted fields.
export async function sendContactMessage({ replyTo, subject, text, attachments = [], idempotencyPrefix = "contact-form", recipient }: {
  replyTo: string;
  subject: string;
  text: string;
  attachments?: ContactEmailAttachment[];
  idempotencyPrefix?: "contact-form" | "dealer-inquiry" | "dun-reservation";
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
    const receipt = z.object({ id: z.string().check(z.minLength(1)) }).safeParse(body);
    return receipt.success ? { receiptId: receipt.data.id } : false;
  } catch {
    // Do not return provider errors or log customers' messages/contact details.
    return false;
  }
}
