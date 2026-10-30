import { z } from "zod";

export const interestOptions = [
  { value: "camping", label: "Camping" },
  { value: "bobil", label: "Bobil" },
  { value: "hytte", label: "Hytte" },
  { value: "terrasse", label: "Terrasse" },
  { value: "glamping", label: "Glamping" },
  { value: "annet", label: "Annet" },
] as const;
const interest = z.enum([
  "camping",
  "bobil",
  "hytte",
  "terrasse",
  "glamping",
  "annet",
]);
export const preferenceSchema = z.strictObject({
  emailMarketing: z.boolean(),
  cartReminders: z.boolean(),
  adMatching: z.boolean(),
  comfyrobeSize: z.enum(["XS", "XL"]).nullable(),
  favoriteColor: z
    .enum(["Vargnatt", "Fjellblå", "Havdyp", "Fjellnatt"])
    .nullable(),
  interests: z.array(interest).max(6),
});
export type Preferences = z.infer<typeof preferenceSchema>;
const storedInterests = z
  .array(z.union([interest, z.literal("camping-og-bobil")]))
  .max(7);
export const preferenceWriteSchema = preferenceSchema.extend({
  interests: storedInterests,
});
export type PreferenceWrite = z.infer<typeof preferenceWriteSchema>;
// Preserve the original record until an explicit save. A former combined
// category does not establish which of the two separate interests was intended.
export const storedPreferenceSchema = preferenceSchema.extend({
  interests: storedInterests.transform((values) =>
    values.filter((value) => value !== "camping-og-bobil"),
  ),
});
export const emptyPreferences: Preferences = {
  emailMarketing: false,
  cartReminders: false,
  adMatching: false,
  comfyrobeSize: null,
  favoriteColor: null,
  interests: [],
};
export const sizeOptions = [
  { value: "", label: "Ikke valgt" },
  { value: "XS", label: "S/XS" },
  { value: "XL", label: "L/XXL" },
];
export const colorOptions = [
  { value: "", label: "Ikke valgt" },
  ...["Vargnatt", "Fjellblå", "Havdyp", "Fjellnatt"].map((value) => ({
    value,
    label: value,
  })),
];
export const consentOptions = [
  {
    value: "emailMarketing",
    label: "Send meg tilbud og produktnyheter på e-post.",
  },
  {
    value: "cartReminders",
    label: "Send meg påminnelse på e-post hvis jeg forlater handlekurven.",
  },
  {
    value: "adMatching",
    label:
      "Utekos kan bruke mine Klarna-opplysninger til å vise personlig tilpasset innhold.",
  },
] as const;
