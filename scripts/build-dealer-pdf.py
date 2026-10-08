# /// script
# requires-python = ">=3.11"
# dependencies = ["pymupdf==1.28.2", "fonttools[woff]==4.62.1"]
# ///
"""Add an editable AcroForm page without changing the source brochure.

Run after a Next build: uv run scripts/build-dealer-pdf.py
The Google Sans Flex font is reused from next/font's local build output.
"""

from io import BytesIO
from pathlib import Path

import pymupdf as pdf
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/kunnskap/forhandler.pdf"
OUTPUT = ROOT / "public/images/kunnskap/forhandler-utfyllbar.pdf"
FORM_PAGE = 6  # After the contact page, before the original back cover.
PAPER = (595.5, 842.25)
BG = (0 / 255, 26 / 255, 24 / 255)
FG = (240 / 255, 238 / 255, 233 / 255)
INK = (1 / 255, 11 / 255, 10 / 255)
ORANGE = (180 / 255, 71 / 255, 1 / 255)


def brand_font(weight):
    # The source PDF identifies the face as GoogleSansFlex120pt-Medium /
    # ExtraBold. The bundled variable font exposes opsz 6–144 and wght 1–1000.
    for path in sorted((ROOT / ".next/static/media").glob("*.woff2")):
        font = TTFont(path)
        if font["name"].getDebugName(1) != "Google Sans Flex":
            continue
        if not all(ord(c) in font.getBestCmap() for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÆØÅæøå"):
            continue
        font = instantiateVariableFont(font, {"opsz": 120, "wght": weight, "GRAD": 0}, inplace=True)
        font.flavor = None
        buffer = BytesIO()
        font.save(buffer)
        return buffer.getvalue()
    raise RuntimeError("Google Sans Flex with Norwegian characters is missing. Run pnpm build first.")


def build():
    doc = pdf.open(SOURCE)
    if len(doc) != 7 or doc.is_form_pdf:
        raise RuntimeError("The source brochure changed. Review its pages and fields before regenerating.")
    page = doc.new_page(pno=FORM_PAGE, width=PAPER[0], height=PAPER[1])
    page.draw_rect(page.rect, color=BG, fill=BG)
    medium_bytes = brand_font(500)
    font_path = ROOT / "src/assets/fonts/GoogleSansFlex120pt-Medium.ttf"
    font_path.parent.mkdir(parents=True, exist_ok=True)
    font_path.write_bytes(medium_bytes)
    medium = page.insert_font(fontname="GSFM", fontbuffer=medium_bytes, set_simple=True)
    page.insert_font(fontname="GSFB", fontbuffer=brand_font(800), set_simple=True)
    # Widgets accept a fixed set of resource names. Map Helv to the embedded
    # Google Sans Flex font; the resource name does not determine the face.
    doc.xref_set_key(doc.pdf_catalog(), "AcroForm", f"<< /Fields [] /DR << /Font << /Helv {medium} 0 R >> >> /NeedAppearances false >>")
    doc.xref_set_key(page.xref, "Tabs", "/R")

    # Use the original wordmark at its original aspect ratio.
    # MuPDF's SVG importer ignores this asset's CSS class, so make its existing
    # white fill explicit while retaining every original path and proportion.
    logo_svg = (ROOT / "public/WordmarkWhite.svg").read_text().replace('class="cls-1"', 'class="cls-1" fill="#fff"')
    with pdf.open(stream=logo_svg.encode(), filetype="svg") as svg:
        with pdf.open("pdf", svg.convert_to_pdf()) as logo:
            page.show_pdf_page(pdf.Rect(40, 38, 135, 38 + 95 * 311.16 / 1280), logo, 0)

    def text(x, y, value, size=11, bold=False, color=FG):
        page.insert_text((x, y), value, fontname="GSFB" if bold else "GSFM", fontsize=size, color=color)

    text(395, 53, "Forhandlersamarbeid", 10)
    text(40, 112, "Fortell oss om butikken din", 27, bold=True)
    text(40, 145, "Fyll inn feltene og trykk Send henvendelsen under PDF-visningen.")
    text(40, 166, "Alle felt er påkrevd. Henvendelsen er uforpliktende.")

    def field(name, label, rect, maxlen, multiline=False):
        widget = pdf.Widget()
        widget.field_name = name
        widget.field_label = label
        widget.field_type = pdf.PDF_WIDGET_TYPE_TEXT
        widget.field_flags = pdf.PDF_FIELD_IS_REQUIRED | (pdf.PDF_TX_FIELD_IS_MULTILINE if multiline else 0)
        widget.rect = pdf.Rect(rect)
        widget.field_value = ""
        widget.text_font = "Helv"
        widget.text_fontsize = 11
        widget.text_color = INK
        widget.text_maxlen = maxlen
        widget.fill_color = FG
        widget.border_color = FG
        widget.border_width = 1
        annotation = page.add_widget(widget)
        # Use the embedded brand face both for editing and for the widget's
        # appearance. MuPDF otherwise inserts its own Base14 font here.
        doc.xref_set_key(annotation.xref, "DR", f"<< /Font << /Helv {medium} 0 R >> >>")
        appearance = int(doc.xref_get_key(annotation.xref, "AP/N")[1].split()[0])
        doc.xref_set_key(appearance, "Resources/Font/Helv", f"{medium} 0 R")

    text(40, 204, "Butikknavn")
    field("storeName", "Butikknavn", (40, 214, 555, 249), 150)
    text(40, 277, "Sted")
    field("location", "Sted", (40, 287, 555, 322), 150)
    text(40, 350, "Kontaktperson")
    field("name", "Kontaktperson", (40, 360, 555, 395), 100)
    text(40, 423, "E-post")
    field("email", "E-post", (40, 433, 326, 468), 254)
    text(344, 423, "Telefonnummer")
    field("phone", "Telefonnummer", (344, 433, 555, 468), 40)
    text(40, 496, "Melding (10–5000 tegn)")
    text(40, 516, "Fortell litt om butikken din og hva dere ønsker å vite om et samarbeid.", 10)
    field("message", "Melding – fortell om butikken og samarbeidet dere ønsker", (40, 526, 555, 655), 5000, multiline=True)

    checkbox = pdf.Widget()
    checkbox.field_name = "privacy"
    checkbox.field_label = "Jeg har lest personvernerklæringen"
    checkbox.field_type = pdf.PDF_WIDGET_TYPE_CHECKBOX
    checkbox.field_flags = pdf.PDF_FIELD_IS_REQUIRED
    checkbox.rect = pdf.Rect(40, 675, 55, 690)
    checkbox.text_font = "ZaDb"
    checkbox.text_fontsize = 0
    checkbox.text_color = INK
    checkbox.fill_color = FG
    checkbox.border_color = FG
    checkbox.border_width = 1
    page.add_widget(checkbox)
    text(65, 687, "Jeg har lest personvernerklæringen på utekos.no/personvern.", 10)
    text(65, 705, "Opplysningene brukes til å behandle henvendelsen.", 10)
    page.insert_link({"kind": pdf.LINK_URI, "from": pdf.Rect(65, 674, 555, 693), "uri": "https://www.utekos.no/personvern"})

    page.draw_line((40, 730), (555, 730), color=ORANGE, width=2)
    text(40, 757, "Åpne og send skjemaet på utekos.no/bli-forhandler/pdf", 11, bold=True)
    text(40, 778, "Henvendelsen og PDF-en sendes automatisk til Erling Holthe.", 11)
    page.insert_link({"kind": pdf.LINK_URI, "from": pdf.Rect(40, 742, 555, 763), "uri": "https://www.utekos.no/bli-forhandler/pdf"})
    text(40, 814, "Utekos · KELC AS", 9)
    text(548, 814, "7", 9)
    doc.set_toc([[1, "Forhandlerinformasjon", 1], [1, "Utfyllbart forhandlerskjema", 7]])
    doc.set_metadata({**doc.metadata, "title": "Utekos – forhandlerinformasjon og utfyllbart skjema"})
    doc.need_appearances(False)
    doc.save(OUTPUT, garbage=4, deflate=True)
    doc.close()
    print(f"Created {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
