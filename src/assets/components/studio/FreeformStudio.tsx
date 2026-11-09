"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Cross-root navigation starts a new document. */

import { useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { Check, Download, Move } from "lucide-react";
import styles from "./studio.module.css";

type CardThemeId = "vargnatt" | "maritime" | "cloud";

const CARD_THEMES: Record<
  CardThemeId,
  { label: string; surfaceClass: string; badgeClass: string }
> = {
  vargnatt: {
    label: "Vargnatt",
    surfaceClass: "bg-vargnatt-100 text-foreground border-(--studio-border)",
    badgeClass: "bg-vargnatt-300 text-foreground border-(--studio-border)",
  },
  maritime: {
    label: "Maritime Blue",
    surfaceClass: "bg-maritime-blue-500 text-foreground border-(--studio-border)",
    badgeClass: "bg-maritime-blue-100 text-foreground border-(--studio-border)",
  },
  cloud: {
    label: "Cloud Dancer (Lys)",
    surfaceClass: "bg-cloud-dancer text-ink border-ink/40",
    badgeClass: "bg-ink text-cloud-dancer border-ink",
  },
};

export function FreeformStudio() {
  const cardRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<CardThemeId>("vargnatt");
  const [pos, setPos] = useState({ x: 16, y: 24 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const constrainPosition = (element: HTMLDivElement, x: number, y: number) => ({
    x: Math.max(0, Math.min(x, (cardRef.current?.clientWidth ?? 0) - element.offsetWidth)),
    y: Math.max(0, Math.min(y, (cardRef.current?.clientHeight ?? 0) - element.offsetHeight)),
  });

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
    if (!e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragOffset) return;
    setPos(constrainPosition(e.currentTarget, e.clientX - dragOffset.x, e.clientY - dragOffset.y));
  };

  const handlePointerUp = () => setDragOffset(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
    const step = e.shiftKey ? 16 : 4;
    const next: Record<string, { x: number; y: number }> = {
      ArrowUp: { x: pos.x, y: pos.y - step },
      ArrowDown: { x: pos.x, y: pos.y + step },
      ArrowLeft: { x: pos.x - step, y: pos.y },
      ArrowRight: { x: pos.x + step, y: pos.y },
    };
    if (next[e.key]) {
      e.preventDefault();
      setPos(constrainPosition(e.currentTarget, next[e.key].x, next[e.key].y));
    }
  };

  const handleExport = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const { domToBlob } = await import("modern-screenshot");
      await document.fonts.ready;
      const blob = await domToBlob(cardRef.current, { scale: 3 });
      if (!blob) throw new Error("PNG export returned no image.");
      const file = new File([blob], "utekos-kort.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Utekos Design" });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Card export failed", error);
        setExportError("Kortet kunne ikke eksporteres. Prøv igjen.");
      }
    } finally {
      setExporting(false);
    }
  };

  const activeTheme = CARD_THEMES[theme];

  return (
    <main data-freeform-studio className={styles.workspace}>
        {/* Topp-verktøylinje */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--studio-border) bg-vargnatt-100/95 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-lg border border-(--studio-border) px-3 text-sm font-semibold hover:bg-vargnatt-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--studio-focus)"
            >
              ← Tilbake
            </a>
            <h1 className="text-base font-extrabold tracking-tight">
              Kort- og designstudio
            </h1>
          </div>

          {/* Farge-/temavelger med eksplisitt sjekk-ikon (WCAG 1.4.1) */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Velg korttema">
            {(Object.keys(CARD_THEMES) as CardThemeId[]).map((key) => {
              const isSelected = theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setTheme(key)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                    isSelected
                      ? "border-foreground bg-foreground text-ink"
                      : "border-(--studio-border) bg-vargnatt-300 text-foreground hover:bg-vargnatt-500"
                  } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--studio-focus)`}
                >
                  {isSelected && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
                  <span>{CARD_THEMES[key].label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--studio-focus) disabled:opacity-60"
          >
            <Download className="size-4 shrink-0" aria-hidden="true" />
            <span>{exporting ? "Lagrer…" : "Eksporter kort"}</span>
          </button>
        </header>

      {exportError && <p role="alert">{exportError}</p>}
      <div className={styles.freeformCanvas} role="region" aria-label="Freeform arbeidsflate">

        {/* Selve kortet som eksporteres */}
        <article
          ref={cardRef}
          aria-label="Forhåndsvisning av kort"
          className={`relative aspect-4/3 w-full max-w-xl shrink-0 overflow-hidden rounded-2xl border-2 p-8 shadow-2xl ${activeTheme.surfaceClass}`}
        >
          {/* Flyttbar og redigerbar tekstblokk */}
          <div
            role="group"
            tabIndex={0}
            aria-label="Flyttbar tekstboks. Dra med musen eller bruk piltaster."
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
            onKeyDown={handleKeyDown}
            style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
            className="absolute top-0 left-0 max-w-[calc(100%-32px)] cursor-grab touch-none rounded-xl border border-dashed border-current/60 p-3 select-none active:cursor-grabbing focus-visible:border-solid focus-visible:outline-2 focus-visible:outline-(--studio-focus) sm:p-4"
          >
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium opacity-80">
              <Move className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Dra her eller bruk piltaster</span>
            </div>

            <span
              contentEditable="plaintext-only"
              tabIndex={0}
              suppressContentEditableWarning
              aria-label="Rediger merkelapp"
              className={`mb-2 inline-block cursor-text rounded-full border px-3 py-0.5 text-xs font-bold ${activeTheme.badgeClass}`}
            >
              Gavekort · Utekos®
            </span>

            <h2
              contentEditable="plaintext-only"
              tabIndex={0}
              suppressContentEditableWarning
              aria-label="Rediger hovedoverskrift"
              className="mt-1 cursor-text rounded px-1 text-2xl font-extrabold tracking-tight focus:outline-2 focus:outline-(--studio-focus) sm:text-3xl"
            >
              Skreddersy varmen.
            </h2>

            <p
              contentEditable="plaintext-only"
              tabIndex={0}
              suppressContentEditableWarning
              aria-label="Rediger korttekst"
              className="mt-2 max-w-sm cursor-text rounded px-1 text-sm font-medium leading-relaxed focus:outline-2 focus:outline-(--studio-focus) sm:text-base"
            >
              Klikk rett på teksten for å skrive din egen hilsen, og dra boksen dit du vil ha den.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
