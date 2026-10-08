"use server";

import { recordAcceptedForm, submissionIdFromReceipt } from "@/lib/tracking/server-forms";
import { z } from "zod";
import { contactSchema, sendContactEmail } from "@/lib/contact";
import { prepareContactAttachments } from "@/lib/contact-email-attachments";
import { initialContactState, type ContactState, type ContactValues } from "./form-state";

export async function submitContactForm(previous: ContactState, formData: FormData): Promise<ContactState> {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const values: ContactValues = {
    name: text("name"), email: text("email"), phone: text("phone"),
    orderNumber: text("orderNumber"), message: text("message"), privacy: text("privacy") === "on",
  };
  const failed: ContactState = {
    status: "error", values, attempt: previous.attempt + 1,
    message: "Vi kunne ikke bekrefte at meldingen ble sendt. Prøv igjen, eller kontakt oss på kundeservice@utekos.no.",
  };

  if (text("website")) return failed;

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { ...failed, message: "Se over feltene nedenfor og prøv igjen.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const attachments = await prepareContactAttachments(formData.getAll("attachments"));
  if (attachments.error) {
    return { ...failed, message: "Se over bildene nedenfor og prøv igjen.", errors: { attachments: [attachments.error] } };
  }

  const receipt = await sendContactEmail(parsed.data, attachments.attachments);
  if (!receipt) return failed;

  await recordAcceptedForm(formData, "contact", submissionIdFromReceipt(receipt.receiptId));
  return {
    ...initialContactState, status: "success", attempt: previous.attempt + 1,
    message: "Takk! Meldingen din er sendt til Utekos. Vi svarer på e-postadressen du oppga.",
  };
}
