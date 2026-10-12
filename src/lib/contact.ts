import "server-only";

import { z } from "zod";
import type { ContactEmailAttachment } from "./contact-email-attachments";
import { sendContactMessage } from "./contact-delivery";

export { getContactEmailConfig, sendContactMessage } from "./contact-delivery";

export const singleLine = (max: number) => z.string().trim().max(max, {
  error: `Bruk maksimalt ${max} tegn.`,
}).refine((value) => !/[\r\n\u0000]/u.test(value), { error: "Bruk én linje i dette feltet." });

export const contactSchema = z.object({
  name: singleLine(100).min(2, { error: "Skriv navnet ditt, minst 2 tegn." }),
  email: singleLine(254).pipe(z.email({ error: "Skriv en gyldig e-postadresse." })),
  phone: singleLine(40).min(1, { error: "Skriv telefonnummeret ditt." }),
  orderNumber: singleLine(80),
  message: z.string().trim().min(10, { error: "Skriv minst 10 tegn om hva du trenger hjelp med." })
    .max(5000, { error: "Meldingen kan være maksimalt 5000 tegn." }),
  privacy: z.boolean().refine(Boolean, { error: "Bekreft at du har lest personvernerklæringen." }),
});

export async function sendContactEmail(submission: z.infer<typeof contactSchema>, attachments: ContactEmailAttachment[] = []) {
  return sendContactMessage({
    replyTo: submission.email,
    subject: `Ny henvendelse fra ${submission.name}`,
    text: [
      `Navn: ${submission.name}`,
      `E-post: ${submission.email}`,
      `Telefon: ${submission.phone}`,
      `Ordrenummer: ${submission.orderNumber || "Ikke oppgitt"}`,
      "Personvernerklæring: bekreftet lest",
      "",
      submission.message,
    ].join("\n"),
    attachments,
  });
}
