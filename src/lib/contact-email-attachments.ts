import "server-only";

import { Buffer } from "node:buffer";
import { validateContactAttachmentSelection } from "./contact-attachments";

export type ContactEmailAttachment = { filename: string; content: string; content_type: string };

function imageType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { mime: "image/png", extension: "png" };
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

export async function prepareContactAttachments(entries: FormDataEntryValue[]): Promise<
  { attachments: ContactEmailAttachment[]; error?: never } | { error: string; attachments?: never }
> {
  if (entries.some((entry) => typeof entry === "string")) return { error: "Velg gyldige bildefiler som vedlegg." };
  // Browsers include an empty, unnamed File when no attachment is selected.
  const files = (entries as File[]).filter((file) => file.name || file.size);
  const error = validateContactAttachmentSelection(files);
  if (error) return { error };

  const attachments: ContactEmailAttachment[] = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = imageType(bytes);
    if (!type || type.mime !== file.type) return { error: "Et av vedleggene er ikke et gyldig JPG-, PNG- eller WebP-bilde." };
    const basename = (file.name.split(/[\\/]/u).pop() || "bilde").replace(/\.[^.]*$/u, "")
      .replace(/[^\p{L}\p{N} ._-]/gu, "_").slice(0, 100).trim() || "bilde";
    attachments.push({ filename: `${basename}.${type.extension}`, content: bytes.toString("base64"), content_type: type.mime });
  }
  return { attachments };
}
