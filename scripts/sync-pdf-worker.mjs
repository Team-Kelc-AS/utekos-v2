import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Keep the self-hosted worker on the exact same version as the PDF.js client.
const directory = new URL("../public/pdfjs/", import.meta.url);
await mkdir(directory, { recursive: true });
await copyFile(
  fileURLToPath(import.meta.resolve("pdfjs-dist/build/pdf.worker.min.mjs")),
  new URL("pdf.worker.min.mjs", directory),
);
await copyFile(
  fileURLToPath(import.meta.resolve("pdfjs-dist/LICENSE")),
  new URL("LICENSE", directory),
);
