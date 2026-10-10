"use server";

import { z } from "zod";
import { dealerInquirySchema, sendDealerInquiry } from "@/lib/retailers/dealer-inquiry";
import { recordAcceptedDealerInquiry } from "@/lib/tracking/server-forms";
import { initialDealerInquiryState, type DealerInquiryState, type DealerInquiryValues } from "./form-state";

export async function submitDealerInquiry(previous: DealerInquiryState, formData: FormData): Promise<DealerInquiryState> {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const values: DealerInquiryValues = {
    storeName: text("storeName"), location: text("location"), name: text("name"), email: text("email"),
    phone: text("phone"), message: text("message"), privacy: text("privacy") === "on",
  };
  const failed: DealerInquiryState = {
    status: "error", values, attempt: previous.attempt + 1,
    message: "Vi kunne ikke bekrefte at meldingen ble sendt. Prøv igjen, eller kontakt oss på erling@utekos.no.",
  };
  if (text("website")) return failed;
  const parsed = dealerInquirySchema.safeParse(values);
  if (!parsed.success) {
    return { ...failed, message: "Se over feltene nedenfor og prøv igjen.", errors: z.flattenError(parsed.error).fieldErrors };
  }
  const receipt = await sendDealerInquiry(parsed.data);
  if (!receipt) return failed;
  const { email, phone, name, storeName, location } = parsed.data;
  const leadEvent = await recordAcceptedDealerInquiry(formData, { receiptId: receipt.receiptId, email, phone, name, storeName, location });
  return {
    ...initialDealerInquiryState, status: "success", attempt: previous.attempt + 1,
    ...(leadEvent ? { leadEvent } : {}),
    message: "Takk! Henvendelsen din om forhandlersamarbeid er sendt til Utekos. Vi svarer på e-postadressen du oppga.",
  };
}
