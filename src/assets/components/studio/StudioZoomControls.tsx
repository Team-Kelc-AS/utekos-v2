import { useState } from "react";
import { Hand, Minus, Plus } from "lucide-react";
import { MAX_ZOOM, MIN_ZOOM } from "@/lib/studio/viewport";
import styles from "./studio.module.css";

export function StudioZoomControls({ scale, disabled, pan, onPan, onZoom, onFit }: {
  scale: number; disabled: boolean; pan: boolean; onPan(): void; onZoom(scale: number): void; onFit(): void;
}) {
  const [input, setInput] = useState<string | null>(null);
  const percentage = Math.round(scale * 100);
  function applyInput() {
    const value = Number(input);
    if (input !== null && input.trim() && Number.isFinite(value)) onZoom(value / 100);
    setInput(null);
  }
  return <div className={styles.canvasFooter} role="group" aria-label="Visning og zoom">
    <button type="button" className={`${styles.button} ${styles.iconButton}`} aria-label="Flytt visning"
      title="Flytt visning (hold mellomrom og dra)" aria-pressed={pan} disabled={disabled} onClick={onPan}><Hand aria-hidden="true" size={18} /></button>
    <div className={styles.zoomControls}>
      <button type="button" className={`${styles.button} ${styles.iconButton}`} aria-label="Zoom ut"
        disabled={disabled || scale <= MIN_ZOOM} onClick={() => onZoom(scale - 0.1)}><Minus aria-hidden="true" size={18} /></button>
      <input className={styles.zoomRange} type="range" aria-label="Zoom" aria-valuetext={`${percentage} prosent`}
        min={MIN_ZOOM * 100} max={MAX_ZOOM * 100} step={1} value={percentage} disabled={disabled}
        onChange={event => { setInput(null); onZoom(event.target.valueAsNumber / 100); }} />
      <button type="button" className={`${styles.button} ${styles.iconButton}`} aria-label="Zoom inn"
        disabled={disabled || scale >= MAX_ZOOM} onClick={() => onZoom(scale + 0.1)}><Plus aria-hidden="true" size={18} /></button>
      <label className={styles.zoomValue}><input type="number" aria-label="Zoom i prosent" min={MIN_ZOOM * 100} max={MAX_ZOOM * 100}
        step={1} value={input ?? percentage} disabled={disabled} onChange={event => setInput(event.target.value)} onBlur={applyInput}
        onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
          if (event.key === "Escape") { setInput(null); event.preventDefault(); }
        }} /><span aria-hidden="true">%</span></label>
      <button type="button" className={styles.button} disabled={disabled} onClick={() => { setInput(null); onFit(); }}>Tilpass</button>
    </div>
  </div>;
}
