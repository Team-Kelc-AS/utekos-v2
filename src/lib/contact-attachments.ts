export const CONTACT_ATTACHMENT_LIMIT = 3;
export const CONTACT_ATTACHMENT_MAX_BYTES = 4_000_000;
export const CONTACT_ATTACHMENT_ACCEPT = "image/jpeg,image/png,image/webp";
export const CONTACT_ATTACHMENT_HINT = "JPG, PNG eller WebP. Maks 3 bilder og 4 MB til sammen.";

export function validateContactAttachmentSelection(files: readonly Pick<File, "name" | "size" | "type">[]) {
  if (files.length > CONTACT_ATTACHMENT_LIMIT) return "Du kan legge ved maksimalt 3 bilder.";
  if (files.some((file) => !file.size)) return "Et av bildene er tomt. Velg bildet på nytt.";
  if (files.some((file) => !CONTACT_ATTACHMENT_ACCEPT.split(",").includes(file.type))) {
    return "Velg bilder i JPG-, PNG- eller WebP-format.";
  }
  if (files.reduce((total, file) => total + file.size, 0) > CONTACT_ATTACHMENT_MAX_BYTES) {
    return "Bildene kan være maksimalt 4 MB til sammen. Velg færre eller mindre bilder.";
  }
  return null;
}
