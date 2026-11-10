"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Cross-root navigation starts a new document. */

import dynamic from "next/dynamic";
import { useEffect, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Download, ImagePlus, Redo2, Square, Type, Undo2 } from "lucide-react";
import {
  normalizeElement, createHistory, MAX_DOCUMENT_BYTES, MAX_ELEMENTS, PALETTE, parseDocument, replaceElement,
  serializeDocument, studioReducer, type StudioDocument, type StudioElement,
} from "@/lib/studio/document";
import type { StudioFileDelivery, StudioPersistence } from "@/lib/studio/platform";
import { browserFileDelivery, browserPersistence, readImage } from "./browserPlatform";
import type { StudioCanvasHandle } from "./StudioCanvas";
import styles from "./studio.module.css";

const StudioCanvas = dynamic(() => import("./StudioCanvas"), {
  ssr: false, loading: () => <p role="status">Laster tegneflaten…</p>,
});

export function FreeformStudio({ persistence = browserPersistence, fileDelivery = browserFileDelivery }: {
  persistence?: StudioPersistence; fileDelivery?: StudioFileDelivery;
} = {}) {
  const [history, dispatch] = useReducer(studioReducer, undefined, () => createHistory());
  const design = history.present;
  const [selectedId, setSelectedId] = useState<string | null>("heading");
  const selected = design.elements.find(element => element.id === selectedId);
  const [ready, setReady] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [saved, setSaved] = useState<{ document: StudioDocument | null; error: boolean }>({ document: null, error: false });
  const queue = useRef(Promise.resolve());
  const canvas = useRef<StudioCanvasHandle>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const designInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    persistence.load().then(serialized => {
      const document = serialized ? parseDocument(serialized) : null;
      if (active) {
        if (document) dispatch({ type: "restore", document });
        setReady(true); setLoadError(false);
      }
    }).catch(cause => {
      console.error("Studio draft could not be restored", cause);
      if (active) setLoadError(true);
    });
    return () => { active = false; };
  }, [persistence, loadAttempt]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    queue.current = queue.current.then(async () => {
      await persistence.save(serializeDocument(design));
    }).then(() => {
      if (active) setSaved({ document: design, error: false });
    }, cause => {
      console.error("Studio draft could not be saved", cause);
      if (active) setSaved({ document: design, error: true });
    });
    return () => { active = false; };
  }, [design, ready, persistence]);

  function commit(update: (document: StudioDocument) => StudioDocument) { dispatch({ type: "edit", update }); }
  function change(element: StudioElement) { commit(document => replaceElement(document, element)); }

  function insert(kind: "text" | "rect") {
    const id = crypto.randomUUID();
    const base = { id, x: 100, y: 100, width: 400, height: 180, rotation: 0 };
    const element: StudioElement = kind === "text"
      ? { ...base, kind, name: "Tekst", text: "Din tekst", font: "utekos-sans", weight: 500, fontSize: 36,
        width: 135, height: 49, align: "left", verticalAlign: "top",
        fill: design.background === "#f0eee9" ? "#010b0a" : "#f0eee9" }
      : { ...base, kind, name: "Figur", fill: "#b44701", cornerRadius: 24 };
    commit(document => ({ ...document, elements: [...document.elements, normalizeElement(element)] }));
    setSelectedId(id);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setError(null); setBusy(true);
    try {
      const asset = await readImage(file);
      const id = crypto.randomUUID();
      commit(document => {
        const factor = Math.min(document.width * 0.5 / asset.width, document.height * 0.5 / asset.height);
        return { ...document, assets: { ...document.assets, [id]: asset }, elements: [...document.elements,
          { id, kind: "image", name: "Bilde", assetId: id, brightness: 0, x: document.width * 0.1, y: document.height * 0.1,
            width: asset.width * factor, height: asset.height * factor, rotation: 0 }] };
      });
      setSelectedId(id);
    } catch (cause) {
      console.error("Studio image upload failed", cause);
      setError(cause instanceof Error ? cause.message : "Bildet kunne ikke åpnes.");
    } finally { setBusy(false); }
  }

  async function openDesign(file?: File) {
    if (!file) return;
    setError(null); setBusy(true);
    try {
      if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Designfilen er for stor.");
      const document = parseDocument(await file.text());
      dispatch({ type: "commit", document });
      setSelectedId(document.elements[0]?.id ?? null);
    } catch (cause) {
      console.error("Studio design import failed", cause);
      setError("Designfilen kunne ikke åpnes. Velg en gyldig Utekos-designfil i versjon 1 eller 2.");
    } finally { setBusy(false); }
  }

  async function exportFile(kind: "png" | "design") {
    setError(null); setBusy(true);
    try {
      if (kind === "design") {
        await fileDelivery.saveFile(new TextEncoder().encode(serializeDocument(design)), "application/json", "utekos-design.json");
      } else {
        if (!canvas.current) throw new Error("Tegneflaten lastes. Prøv igjen om litt.");
        await fileDelivery.saveFile(await canvas.current.exportPng(), "image/png", "utekos-kort.png");
      }
    } catch (cause) {
      console.error("Studio export failed", cause);
      setError(cause instanceof Error ? cause.message : "Filen kunne ikke eksporteres. Prøv igjen.");
    } finally { setBusy(false); }
  }

  function remove() {
    commit(document => {
      const elements = document.elements.filter(element => element.id !== selectedId);
      const assetIds = new Set(elements.flatMap(element => element.kind === "image" ? [element.assetId] : []));
      return { ...document, elements, assets: Object.fromEntries(Object.entries(document.assets).filter(([id]) => assetIds.has(id))) };
    });
    setSelectedId(null);
  }
  function fitText() {
    if (selected?.kind !== "text" || !canvas.current) return;
    try { change({ ...selected, ...canvas.current.fitText(selected.id) }); }
    catch (cause) {
      console.error("Studio text measurement failed", cause);
      setError(cause instanceof Error ? cause.message : "Tekstboksen kunne ikke tilpasses.");
    }
  }
  function move(dx: number, dy: number) { if (selected) change({ ...selected, x: selected.x + dx, y: selected.y + dy }); }
  function reorder(direction: number) {
    commit(document => {
      const elements = [...document.elements];
      const index = elements.findIndex(element => element.id === selectedId);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= elements.length) return document;
      [elements[index], elements[next]] = [elements[next], elements[index]];
      return { ...document, elements };
    });
  }
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && (target.closest("input, textarea, select, button, a") || target.isContentEditable)) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault(); dispatch({ type: event.shiftKey ? "redo" : "undo" }); return;
    }
    if (!selected) return;
    const step = event.shiftKey ? 16 : 4;
    const movement: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (movement[event.key]) { event.preventDefault(); move(...movement[event.key]); }
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); remove(); }
  }
  const canAdd = design.elements.length < MAX_ELEMENTS && !busy;

  return <main data-freeform-studio className={styles.workspace}>
    <header className={styles.toolbar}>
      <a href="/" className={styles.button}>← Tilbake</a>
      <h1>Kort- og designstudio</h1>
      <div className={styles.actions}>
        <button type="button" className={styles.button} disabled={!ready || !history.past.length || busy}
          onClick={() => dispatch({ type: "undo" })}><Undo2 aria-hidden="true" size={18} />Angre</button>
        <button type="button" className={styles.button} disabled={!ready || !history.future.length || busy}
          onClick={() => dispatch({ type: "redo" })}><Redo2 aria-hidden="true" size={18} />Gjør om</button>
        <button type="button" className={styles.button} disabled={!ready || busy} onClick={() => designInput.current?.click()}>Åpne design</button>
        <button type="button" className={styles.button} disabled={!ready || busy} onClick={() => void exportFile("design")}>Last ned designfil</button>
        <button type="button" className={`${styles.button} ${styles.primary}`} disabled={!ready || busy || !canvasReady} onClick={() => void exportFile("png")}>
          <Download aria-hidden="true" size={18} />{busy ? "Arbeider…" : "Eksporter kort"}</button>
      </div>
    </header>
    <input hidden ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
      void uploadImage(event.target.files?.[0]); event.target.value = "";
    }} />
    <input hidden ref={designInput} type="file" accept="application/json,.json" onChange={event => {
      void openDesign(event.target.files?.[0]); event.target.value = "";
    }} />
    {error && <p role="alert" className={styles.notice}>{error}</p>}
    {!ready ? <div className={styles.notice}>
      {loadError ? <><p role="alert">Det lagrede utkastet kunne ikke åpnes. Det blir ikke overskrevet.</p>
        <button type="button" className={styles.button} onClick={() => setLoadAttempt(value => value + 1)}>Prøv igjen</button></>
        : <p role="status">Åpner utkast…</p>}
    </div> : <div className={styles.editor}>
      <div className={styles.board}>
        <div className={styles.insert} role="group" aria-label="Legg til element">
          <button type="button" className={styles.button} disabled={!canAdd} onClick={() => insert("text")}><Type aria-hidden="true" size={18} />Tekst</button>
          <button type="button" className={styles.button} disabled={!canAdd} onClick={() => insert("rect")}><Square aria-hidden="true" size={18} />Figur</button>
          <button type="button" className={styles.button} disabled={!canAdd} onClick={() => imageInput.current?.click()}><ImagePlus aria-hidden="true" size={18} />Bilde</button>
        </div>
        <div className={styles.freeformCanvas} role="group" aria-label="Forhåndsvisning av kort" tabIndex={0}
          aria-describedby="studio-canvas-help" onKeyDown={keys}>
          <StudioCanvas document={design} selectedId={selected?.id ?? null} onSelect={setSelectedId} onChange={change} onReady={setCanvasReady} canvasRef={canvas} />
        </div>
        <p id="studio-canvas-help" className={styles.help}>Flytt elementer på hele arbeidsflaten. Bare innholdet innenfor kortets kant blir med i PNG-eksporten. Bruk piltaster eller feltene for nøyaktig plassering.</p>
        <p className={styles.help} role="status">{saved.error ? "Utkastet kunne ikke lagres på denne enheten. Last ned designfilen for å ta vare på arbeidet."
          : saved.document === design ? "Utkast lagret på denne enheten." : "Lagrer utkast…"}</p>
      </div>
      <aside className={styles.inspector} aria-label="Designverktøy">
        <label className={styles.field}>Bakgrunn
          <input type="color" value={design.background} onChange={event => { const background = event.target.value; commit(document => ({ ...document, background })); }} />
        </label>
        <div className={styles.swatches} role="group" aria-label="Utekos-farger">
          {PALETTE.map(fill => <button type="button" key={fill} aria-label={`Bakgrunn ${fill}`} aria-pressed={design.background === fill}
            className={styles.swatch} style={{ background: fill }} onClick={() => commit(document => ({ ...document, background: fill }))} />)}
        </div>
        <h2>Elementer</h2>
        <ol className={styles.elementList}>
          {design.elements.map(element => <li key={element.id}><button type="button" className={styles.button} aria-pressed={selectedId === element.id}
            onClick={() => setSelectedId(element.id)}>{element.name}</button></li>)}
        </ol>
        {!selected ? <p>Velg et element for å redigere det.</p> : <fieldset className={styles.properties}>
          <legend>{selected.name}</legend>
          {selected.kind === "text" && <>
            <label className={styles.field}>Tekst<textarea id="studio-text" aria-label="Tekst" value={selected.text} maxLength={2000} rows={4}
              onChange={event => change({ ...selected, text: event.target.value })} /></label>
            <NumberField label="Skriftstørrelse" value={selected.fontSize} min={12} max={240} onChange={fontSize => change({ ...selected, fontSize,
              height: Math.max(selected.height, fontSize * 1.35) })} />
            <label className={styles.field}>Skriftvekt<select value={selected.weight} onChange={event => change({ ...selected, weight: event.target.value === "800" ? 800 : 500 })}>
              <option value="500">Medium</option><option value="800">ExtraBold</option>
            </select></label>
            <label className={styles.field}>Tekstjustering<select aria-label="Tekstjustering" value={selected.align} onChange={event => {
              const align = event.target.value;
              if (align === "left" || align === "center" || align === "right") change({ ...selected, align });
            }}>
              <option value="left">Venstre</option><option value="center">Midtstilt</option><option value="right">Høyre</option>
            </select></label>
            <label className={styles.field}>Vertikal tekstjustering<select aria-label="Vertikal tekstjustering" value={selected.verticalAlign} onChange={event => {
              const verticalAlign = event.target.value;
              if (verticalAlign === "top" || verticalAlign === "middle" || verticalAlign === "bottom") change({ ...selected, verticalAlign });
            }}>
              <option value="top">Øverst</option><option value="middle">Midten</option><option value="bottom">Nederst</option>
            </select></label>
            <button type="button" className={styles.button} disabled={!canvasReady} onClick={fitText}>Tilpass boksen til teksten</button>
          </>}
          {selected.kind !== "image" && <label className={styles.field}>Farge<input type="color" value={selected.fill}
            onChange={event => change({ ...selected, fill: event.target.value })} /></label>}
          <div className={styles.coordinates}>
            <NumberField label="X-posisjon" value={selected.x} min={-8192} max={8192} onChange={x => change({ ...selected, x })} />
            <NumberField label="Y-posisjon" value={selected.y} min={-8192} max={8192} onChange={y => change({ ...selected, y })} />
            <NumberField label="Bredde" value={selected.width} min={24} max={4096} onChange={width => change({ ...selected, width,
              height: selected.kind === "image" ? selected.height * width / selected.width : selected.height })} />
            {selected.kind !== "image" && <NumberField label="Høyde" value={selected.height} min={selected.kind === "text" ? selected.fontSize * 1.35 : 24} max={4096} onChange={height => change({ ...selected, height })} />}
            <NumberField label="Rotasjon" value={selected.rotation} min={-180} max={180} onChange={rotation => change({ ...selected, rotation })} />
          </div>
          {selected.kind === "rect" && <NumberField label="Hjørneavrunding" value={selected.cornerRadius} min={0} max={512} onChange={cornerRadius => change({ ...selected, cornerRadius })} />}
          {selected.kind === "image" && <label className={styles.field}>Lysstyrke<input type="range" min={-1} max={1} step={0.05} value={selected.brightness}
            onChange={event => change({ ...selected, brightness: event.target.valueAsNumber })} /></label>}
          <div className={styles.moveButtons} role="group" aria-label="Flytt valgt element">
            <button type="button" className={styles.button} aria-label="Flytt opp" onClick={() => move(0, -4)}>↑</button>
            <button type="button" className={styles.button} aria-label="Flytt ned" onClick={() => move(0, 4)}>↓</button>
            <button type="button" className={styles.button} aria-label="Flytt til venstre" onClick={() => move(-4, 0)}>←</button>
            <button type="button" className={styles.button} aria-label="Flytt til høyre" onClick={() => move(4, 0)}>→</button>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={() => reorder(1)} disabled={design.elements.at(-1)?.id === selectedId}><ArrowUp aria-hidden="true" size={16} />Fremover</button>
            <button type="button" className={styles.button} onClick={() => reorder(-1)} disabled={design.elements[0]?.id === selectedId}><ArrowDown aria-hidden="true" size={16} />Bakover</button>
            <button type="button" className={styles.button} onClick={remove}>Slett element</button>
          </div>
        </fieldset>}
      </aside>
    </div>}
  </main>;
}

function NumberField({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange(value: number): void;
}) {
  return <label className={styles.field}>{label}<input type="number" value={Math.round(value * 100) / 100} min={min} max={max} step="any"
    onChange={event => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) onChange(Math.max(min, Math.min(max, value))); }} /></label>;
}
