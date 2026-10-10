import 'server-only';

/** Verbatim policy overview, shared by the policy page and shopping dialogs. */
export function ShippingReturnsSummary({ className }: { className?: string }) {
  return <dl className={className} aria-label="Kort om frakt og retur">
    <div><dt>Frakt og levering i Norge</dt><dd><strong>99 kr · gratis fra 999 kr</strong><span>Normalt 2–5 virkedager fra PostNord henter pakken.</span></dd></div>
    <div><dt>Angrerett</dt><dd><strong>14 kalenderdager</strong><span>Du ordner og betaler vanlig returfrakt.</span></dd></div>
    <div><dt>Gratis størrelsesbytte</dt><dd><strong>Samme modell og farge</strong><span>Kontakt oss innen 14 dager fra mottak.</span></dd></div>
  </dl>;
}
