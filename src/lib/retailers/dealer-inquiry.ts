import "server-only";

import { z } from "zod";
import { contactSchema, sendContactMessage, singleLine } from "@/lib/contact";
import { createDealerPdfAttachment } from "./dealer-pdf";

export const dealerInquirySchema = contactSchema.pick({ name: true, email: true, phone: true, message: true, privacy: true }).extend({
  storeName: singleLine(150).min(2, { error: "Skriv butikknavnet, minst 2 tegn." }),
  location: singleLine(150).min(2, { error: "Skriv hvor butikken ligger, minst 2 tegn." }),
  phone: singleLine(40).min(1, { error: "Skriv telefonnummeret ditt." }),
});

export async function sendDealerInquiry(submission: z.infer<typeof dealerInquirySchema>) {
  try {
    const attachment = await createDealerPdfAttachment(submission);
    return await sendContactMessage({
      recipient: "erling@utekos.no",
      attachments: [attachment],
      replyTo: submission.email,
      subject: `Forhandlerhenvendelse: ${submission.storeName}`,
      idempotencyPrefix: "dealer-inquiry",
      text: [
        "Forhandlersamarbeid med Utekos",
        "",
        `Butikknavn: ${submission.storeName}`,
        `Sted: ${submission.location}`,
        `Kontaktperson: ${submission.name}`,
        `E-post: ${submission.email}`,
        `Telefon: ${submission.phone}`,
        "Personvernerklæring: bekreftet lest",
        "",
        submission.message,
      ].join("\n"),
    });
  } catch {
    return false;
  }
}
