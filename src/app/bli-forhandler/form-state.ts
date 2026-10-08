import type { GenerateLeadDataLayerEvent } from "@/lib/analytics/generateLeadEvent";

export type DealerInquiryValues = {
  storeName: string;
  location: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  privacy: boolean;
};

export type DealerInquiryState = {
  status: "idle" | "error" | "success";
  message: string;
  values: DealerInquiryValues;
  errors?: Partial<Record<keyof DealerInquiryValues, string[]>>;
  attempt: number;
  leadEvent?: GenerateLeadDataLayerEvent;
};

export const initialDealerInquiryState: DealerInquiryState = {
  status: "idle", message: "", attempt: 0,
  values: { storeName: "", location: "", name: "", email: "", phone: "", message: "", privacy: false },
};
