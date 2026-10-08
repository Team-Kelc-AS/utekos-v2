"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { submitDealerInquiry } from "../actions";
import { initialDealerInquiryState, type DealerInquiryValues } from "../form-state";
import { emitStorefrontAction } from "@/lib/tracking/browser-events";
import styles from "./pdf.module.css";

type FieldName = keyof DealerInquiryValues;
type PdfField = { name: FieldName; label: string; rect: number[]; maxLength?: number };
const fieldNames: FieldName[] = ["storeName", "location", "name", "email", "phone", "message", "privacy"];
const filename = "/images/kunnskap/forhandler-utfyllbar.pdf";

export default function DealerPdfForm() {
  const [state, action, pending] = useActionState(submitDealerInquiry, initialDealerInquiryState);
  const [values, setValues] = useState(initialDealerInquiryState.values);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(7);
  const [scale, setScale] = useState(1.25);
  const [fields, setFields] = useState<PdfField[]>([]);
  const [pageText, setPageText] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: 744.375, height: 1052.8125 });
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stopped = false;
    let task: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
    void import("pdfjs-dist").then(async (pdfjs) => {
      if (stopped) return;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      task = pdfjs.getDocument({ url: filename });
      const loaded = await task.promise;
      if (!stopped) setDocument(loaded);
    }).catch(() => { if (!stopped) setLoadError(true); });
    return () => { stopped = true; void task?.destroy(); };
  }, []);

  useEffect(() => {
    if (!document || !canvas.current) return;
    let stopped = false;
    let render: RenderTask | undefined;
    const target = canvas.current;
    void (async () => {
      const page = await document.getPage(pageNumber);
      if (stopped) return;
      const viewport = page.getViewport({ scale });
      const [annotations, content] = await Promise.all([page.getAnnotations(), page.getTextContent()]);
      if (stopped) return;
      const controls: PdfField[] = annotations.filter((a) => a.subtype === "Widget" && fieldNames.includes(a.fieldName)).map((a) => ({
        name: a.fieldName as FieldName, label: a.alternativeText || a.fieldName,
        rect: [...viewport.convertToViewportPoint(a.rect[0], a.rect[1]), ...viewport.convertToViewportPoint(a.rect[2], a.rect[3])], maxLength: a.maxLen || undefined,
      }));
      const ratio = window.devicePixelRatio || 1;
      target.width = Math.ceil(viewport.width * ratio);
      target.height = Math.ceil(viewport.height * ratio);
      render = page.render({ canvas: target, viewport, transform: [ratio, 0, 0, ratio, 0, 0], annotationMode: 0 });
      await render.promise;
      if (!stopped) {
        setDimensions({ width: viewport.width, height: viewport.height });
        setFields(controls);
        setPageText(content.items.flatMap((item) => "str" in item ? [item.str] : []));
        setReady(true);
      }
    })().catch(() => { if (!stopped) setLoadError(true); });
    return () => { stopped = true; render?.cancel(); };
  }, [document, pageNumber, scale]);

  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success" && state.leadEvent) emitStorefrontAction("utekos:accepted-lead", state.leadEvent);
    if (state.status === "error") emitStorefrontAction("utekos:form-error", { formId: "dealer_inquiry", attemptId: crypto.randomUUID(), category: state.errors ? "validation" : "submission_failed" });
    (form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? status.current)?.focus();
  }, [state]);

  function navigate(page: number) { setReady(false); setFields([]); setPageNumber(page); }
  function zoom(value: number) { setReady(false); setFields([]); setScale(value); }

  return <>
    <div ref={status} role="status" tabIndex={-1} className={styles.status}>
      {state.message}
      {state.errors && <ul>{Object.entries(state.errors).map(([name, errors]) => <li key={name}><a href={`#pdf-${name}`}>{errors?.[0]}</a></li>)}</ul>}
    </div>
    {state.status === "success" ? <p><a href="/bli-forhandler">Tilbake til forhandlersiden</a></p> : <>
      <div className={styles.toolbar} aria-label="PDF-visning">
        <button type="button" disabled={!document || pending || pageNumber === 1} onClick={() => navigate(pageNumber - 1)}>Forrige side</button>
        <span>Side {pageNumber} av {document?.numPages ?? 8}</span>
        <button type="button" disabled={!document || pending || pageNumber === (document?.numPages ?? 8)} onClick={() => navigate(pageNumber + 1)}>Neste side</button>
        <button type="button" disabled={!document || pending || pageNumber === 7} onClick={() => navigate(7)}>Til skjemaet</button>
        <label>Zoom <select value={scale} disabled={pending} onChange={(e) => zoom(Number(e.target.value))}>
          <option value={0.75}>75 %</option><option value={1}>100 %</option><option value={1.25}>125 %</option><option value={1.5}>150 %</option>
        </select></label>
        <a href={filename} data-tracking-cta="dealer_pdf_download" download="Utekos-forhandler.pdf">Last ned PDF-mal</a>
      </div>
      <p className={styles.help}>Alle felt er påkrevd. Du kan zoome eller bla i dokumentet uten å miste det du har skrevet. <a href="/bli-forhandler#forhandlerskjema">Bruk vanlig skjema</a>.</p>
      {loadError ? <p role="alert">PDF-visningen kunne ikke lastes. <a href="/bli-forhandler#forhandlerskjema">Bruk det vanlige skjemaet</a> for automatisk innsending.</p> : <form ref={form} action={action} noValidate data-tracking-form="dealer_inquiry" data-tracking-form-name="Forhandlersamarbeid PDF" aria-busy={pending}>
        <div className={styles.honeypot} aria-hidden="true"><label htmlFor="pdf-website">La dette feltet stå tomt</label><input id="pdf-website" name="website" tabIndex={-1} autoComplete="off" /></div>
        {!ready && <p role="status">Laster PDF …</p>}
        <div className={styles.viewport} tabIndex={0} aria-label={`PDF side ${pageNumber}. Bruk rullefeltet for å se hele siden.`}>
          <div className={styles.sheet} style={{ width: dimensions.width, height: dimensions.height }}>
            <canvas ref={canvas} aria-hidden="true" style={{ width: dimensions.width, height: dimensions.height }} />
            <fieldset disabled={pending || !ready} className={styles.fields}>
              <legend className="sr-only">Forhandlerhenvendelse</legend>
              {fields.map(({ name, label, rect, maxLength }) => {
                const left = Math.min(rect[0], rect[2]), top = Math.min(rect[1], rect[3]);
                const style = { left, top, width: Math.abs(rect[2] - rect[0]), height: Math.abs(rect[3] - rect[1]), fontSize: 11 * scale };
                const common = { id: `pdf-${name}`, name, "aria-label": label, required: true, "aria-invalid": Boolean(state.errors?.[name]?.length), style, className: styles.input };
                if (name === "privacy") return <input {...common} key={name} type="checkbox" checked={values.privacy} onChange={(e) => setValues({ ...values, privacy: e.target.checked })} />;
                if (name === "message") return <textarea {...common} key={name} value={values.message} minLength={10} maxLength={maxLength} onChange={(e) => setValues({ ...values, message: e.target.value })} />;
                return <input {...common} key={name} type={name === "email" ? "email" : name === "phone" ? "tel" : "text"} value={values[name]} maxLength={maxLength} autoComplete={({storeName:"organization",location:"address-level2",name:"name",email:"email",phone:"tel"})[name]} onChange={(e) => setValues({ ...values, [name]: e.target.value })} />;
              })}
            </fieldset>
          </div>
        </div>
        {ready && <details className={styles.textVersion}>
          <summary>Les teksten på side {pageNumber}</summary>
          <div>{pageText.map((line, index) => <p key={index}>{line}</p>)}</div>
        </details>}
        <p className={styles.help}>Ved innsending bekrefter du at du har lest <a href="/personvern" target="_blank" rel="noopener">personvernerklæringen</a>. Opplysningene brukes til å behandle henvendelsen.</p>
        {pageNumber === 7 && <button className={styles.submit} type="submit" data-tracking-cta="dealer_pdf_submit" disabled={pending || !ready || fields.length !== 7}>{pending ? "Sender henvendelsen …" : "Send henvendelsen"}</button>}
      </form>}
    </>}
  </>;
}
