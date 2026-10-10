import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Buffer } from "node:buffer";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { DealerInquiryValues } from "@/app/(storefront)/bli-forhandler/form-state";
import type { ContactEmailAttachment } from "@/lib/contact-email-attachments";

const fields = [
  ["storeName", "Butikknavn"],
  ["location", "Sted"],
  ["name", "Kontaktperson"],
  ["email", "E-post"],
  ["phone", "Telefonnummer"],
  ["message", "Melding"],
] as const;
const fontSize = 11;

// Keep each shaping operation bounded. pdf-lib's default multiline wrapper
// repeatedly shapes the whole remaining paragraph, which is costly at 5,000 chars.
function wrapText(text: string, font: PDFFont, maxWidth: number): string[] {
  const widths = new Map<string, number>();
  const widthOf = (character: string) => {
    let width = widths.get(character);
    if (width === undefined) {
      width = font.widthOfTextAtSize(character, fontSize);
      widths.set(character, width);
    }
    return width;
  };
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/gu, "\n").split("\n")) {
    let line: string[] = [],
      width = 0;
    for (const character of Array.from(paragraph)) {
      const nextWidth = widthOf(character);
      // The character limit also bounds shaping of zero-width Unicode sequences.
      if (
        line.length &&
        (width + nextWidth > maxWidth - 4 || line.length >= 100)
      ) {
        const space = line.findLastIndex((value) => /\s/u.test(value));
        const split = space > 0 ? space + 1 : line.length;
        lines.push(line.slice(0, split).join("").trimEnd());
        line = line.slice(split);
        width = line.reduce((sum, value) => sum + widthOf(value), 0);
      }
      line.push(character);
      width += nextWidth;
    }
    lines.push(line.join(""));
  }
  return lines;
}

/** Build from our trusted template and validated values, never an uploaded PDF. */
export async function createDealerPdfAttachment(
  values: DealerInquiryValues,
): Promise<ContactEmailAttachment> {
  const [template, fontBytes] = await Promise.all([
    readFile(
      join(process.cwd(), "public/images/kunnskap/forhandler-utfyllbar.pdf"),
    ),
    readFile(
      join(process.cwd(), "src/assets/fonts/GoogleSansFlex120pt-Medium.ttf"),
    ),
  ]);
  const pdf = await PDFDocument.load(template, { updateMetadata: false });
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const form = pdf.getForm();
  const overflow: { label: string; value: string }[] = [];
  const continuationPage = pdf.getPageCount(); // Insert before the original back cover.
  for (const [name, label] of fields) {
    const field = form.getTextField(name);
    const { width, height } = field.acroField.getWidgets()[0].getRectangle();
    const lines = wrapText(values[name], font, width - 4);
    const capacity =
      name === "message"
        ? Math.floor((height - 4) / (font.heightAtSize(fontSize) * 1.2))
        : 1;
    const overflows = lines.length > capacity;
    if (overflows) overflow.push({ label, value: values[name] });
    field.setText(
      overflows ? `Se vedlegg på side ${continuationPage}.` : lines.join("\n"),
    );
    field.updateAppearances(font);
    // Preserve the exact submitted value for copying/editing. Saving below must
    // retain our bounded, print-safe appearance instead of regenerating it.
    field.setText(values[name]);
  }
  if (values.privacy) form.getCheckBox("privacy").check();
  form.getCheckBox("privacy").updateAppearances();

  if (overflow.length) {
    const { width, height } = pdf.getPage(6).getSize();
    const ink = rgb(1 / 255, 11 / 255, 10 / 255);
    const paper = rgb(240 / 255, 238 / 255, 233 / 255);
    const accent = rgb(180 / 255, 71 / 255, 1 / 255);
    let page = pdf.insertPage(pdf.getPageCount() - 1, [width, height]);
    let y = height - 100;
    const preparePage = () => {
      page.drawRectangle({ x: 0, y: 0, width, height, color: paper });
      page.drawText("Forhandlerhenvendelse – fortsettelse", {
        x: 40,
        y: height - 54,
        font,
        size: 18,
        color: ink,
      });
      page.drawText(`Side ${pdf.getPageCount() - 1}`, {
        x: 40,
        y: 28,
        font,
        size: 10,
        color: ink,
      });
      y = height - 100;
    };
    preparePage();
    for (const { label, value } of overflow) {
      if (y < 90) {
        page = pdf.insertPage(pdf.getPageCount() - 1, [width, height]);
        preparePage();
      }
      page.drawText(label, { x: 40, y, font, size: 12, color: accent });
      y -= 24;
      for (const line of wrapText(value, font, width - 80)) {
        if (y < 54) {
          page = pdf.insertPage(pdf.getPageCount() - 1, [width, height]);
          preparePage();
        }
        page.drawText(line, { x: 40, y, font, size: fontSize, color: ink });
        y -= 16;
      }
      y -= 20;
    }
  }
  const bytes = await pdf.save({ updateFieldAppearances: false });
  return {
    filename: "Utekos-forhandlerhenvendelse.pdf",
    content: Buffer.from(bytes).toString("base64"),
    content_type: "application/pdf",
  };
}
