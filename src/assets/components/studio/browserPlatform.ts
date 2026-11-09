import type { StudioFileDelivery, StudioPersistence } from "@/lib/studio/platform";
import type { StudioAsset } from "@/lib/studio/document";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("utekos-design-studio", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("designs");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Lukk andre studiofaner og prøv igjen."));
  });
}

export const browserPersistence: StudioPersistence = {
  async load() {
    const db = await database();
    try {
      return await new Promise<string | null>((resolve, reject) => {
        const transaction = db.transaction("designs", "readonly");
        const request = transaction.objectStore("designs").get("draft");
        transaction.oncomplete = () => {
          if (request.result === undefined || typeof request.result === "string") resolve(request.result ?? null);
          else reject(new Error("Det lagrede utkastet har ukjent format."));
        };
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally { db.close(); }
  },
  async save(serializedDocument) {
    const db = await database();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("designs", "readwrite");
        transaction.objectStore("designs").put(serializedDocument, "draft");
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally { db.close(); }
  },
};

export const browserFileDelivery: StudioFileDelivery = {
  async saveFile(bytes, mime, filename) {
    const blob = new Blob([new Uint8Array(bytes)], { type: mime });
    const file = new File([blob], filename, { type: mime });
    if (mime === "image/png" && navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Utekos Design" }); }
      catch (cause) {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) throw cause;
      }
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  },
};

export async function readImage(file: File): Promise<StudioAsset> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Velg et PNG-, JPEG- eller WebP-bilde.");
  if (file.size > 4 * 1024 * 1024) throw new Error("Bildet må være mindre enn 4 MB.");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Bildet kunne ikke leses."));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = source;
  await image.decode();
  if (image.naturalWidth * image.naturalHeight > 24_000_000 || Math.max(image.naturalWidth, image.naturalHeight) > 12000) {
    throw new Error("Bildet må ha maksimalt 24 megapiksler og 12 000 piksler per side.");
  }
  const mime = file.type;
  if (mime !== "image/png" && mime !== "image/jpeg" && mime !== "image/webp") throw new Error("Ukjent bildeformat.");
  return { mime, base64: source.slice(source.indexOf(",") + 1), width: image.naturalWidth, height: image.naturalHeight };
}
