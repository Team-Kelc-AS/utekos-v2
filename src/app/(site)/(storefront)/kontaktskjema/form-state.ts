export type ContactValues = {
  name: string;
  email: string;
  phone: string;
  orderNumber: string;
  message: string;
  privacy: boolean;
};

export type ContactState = {
  status: "idle" | "error" | "success";
  message: string;
  values: ContactValues;
  errors?: Partial<Record<keyof ContactValues | "attachments", string[]>>;
  attempt: number;
};

export const initialContactState: ContactState = {
  status: "idle",
  message: "",
  values: { name: "", email: "", phone: "", orderNumber: "", message: "", privacy: false },
  attempt: 0,
};
