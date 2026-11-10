"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import Konva from "konva";
import { Image as CanvasImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type { KonvaNodeEvents } from "react-konva";
import { normalizeElement, type StudioDocument, type StudioElement } from "@/lib/studio/document";
import styles from "./studio.module.css";
import { styleTransformerHandle } from "./transformerHandles";

export interface StudioCanvasHandle {
  exportPng(): Promise<Uint8Array>;
  fitText(id: string): { width: number; height: number };
}
type Props = {
  document: StudioDocument;
  selectedId: string | null;
  onSelect(id: string | null): void;
  onChange(element: StudioElement): void;
  onReady(ready: boolean): void;
  canvasRef: Ref<StudioCanvasHandle>;
};

function ImageNode({ element, image, register, events }: {
  element: Extract<StudioElement, { kind: "image" }>;
  image: HTMLImageElement;
  register(node: Konva.Node | null): void;
  events: KonvaNodeEvents;
}) {
  const ref = useRef<Konva.Image>(null);
  useEffect(() => {
    ref.current?.cache({ pixelRatio: 2 });
    ref.current?.getLayer()?.batchDraw();
  }, [image, element.width, element.height]);
  return <CanvasImage {...events} ref={node => { ref.current = node; register(node); }}
    id={element.id} x={element.x} y={element.y} width={element.width} height={element.height}
    rotation={element.rotation} draggable image={image}
    filters={[Konva.Filters.Brightness]} brightness={1 + element.brightness} />;
}

export default function StudioCanvas({ document: design, selectedId, onSelect, onChange, onReady, canvasRef }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const content = useRef<Konva.Layer>(null);
  const transformer = useRef<Konva.Transformer>(null);
  const nodes = useRef(new Map<string, Konva.Node>());
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const { width, height } = viewport;
  const [font, setFont] = useState<string | null>(null);
  const [loadedText, setLoadedText] = useState<string | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ assets: StudioDocument["assets"] | null; images: Record<string, HTMLImageElement> }>({ assets: null, images: {} });
  const images = loadedImages.images;
  const [imageError, setImageError] = useState<string | null>(null);
  const margin = width < 500 ? 40 : 80;
  const scale = Math.max(0.01, Math.min((width - margin * 2) / design.width, (height - margin * 2) / design.height));
  const cardWidth = design.width * scale;
  const cardHeight = design.height * scale;
  const cardX = (width - cardWidth) / 2;
  const cardY = (height - cardHeight) / 2;
  const text = design.elements.flatMap(element => element.kind === "text" ? [element.text] : []).join(" ");

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setViewport({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const family = getComputedStyle(window.document.body).fontFamily;
    Promise.all([window.document.fonts.load(`800 72px ${family}`, text || "Utekos"),
      window.document.fonts.load(`500 36px ${family}`, text || "Utekos")])
      .then(() => window.document.fonts.ready)
      .then(() => { if (active) { setFont(family); setLoadedText(text); setFontError(null); content.current?.batchDraw(); } })
      .catch(error => { console.error("Studio font loading failed", error); if (active) setFontError("Skriften kunne ikke lastes. Last siden på nytt."); });
    return () => { active = false; };
  }, [text]);

  useEffect(() => {
    let active = true;
    Promise.all(Object.entries(design.assets).map(async ([id, asset]) => {
      const image = new window.Image();
      image.src = `data:${asset.mime};base64,${asset.base64}`;
      await image.decode();
      if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) throw new Error("Image dimensions do not match the document");
      return [id, image] as const;
    })).then(entries => {
      if (active) { setLoadedImages({ assets: design.assets, images: Object.fromEntries(entries) }); setImageError(null); }
    }).catch(error => {
      console.error("Studio image loading failed", error);
      if (active) setImageError("Et bilde kunne ikke åpnes. Fjern bildet eller åpne en annen designfil.");
    });
    return () => { active = false; };
  }, [design.assets]);

  const ready = !!width && !!height && !!font && loadedText === text && !fontError && !imageError && loadedImages.assets === design.assets;
  useEffect(() => { onReady(ready); }, [onReady, ready]);

  useEffect(() => {
    const node = selectedId ? nodes.current.get(selectedId) : undefined;
    transformer.current?.nodes(node ? [node] : []);
    transformer.current?.getLayer()?.batchDraw();
  }, [selectedId, design, images, font, width, height]);

  useImperativeHandle(canvasRef, () => ({
    fitText(id) {
      const node = nodes.current.get(id);
      if (!ready || !(node instanceof Konva.Text)) throw new Error("Vent til teksten er ferdig lastet.");
      const measurement = node.clone({ width: "auto", height: "auto", scaleX: 1, scaleY: 1, rotation: 0 });
      try {
        const width = Math.max(24, Math.min(4096, Math.ceil(measurement.width())));
        measurement.width(width);
        return { width, height: Math.max(24, Math.min(4096, Math.ceil(measurement.height()))) };
      } finally { measurement.destroy(); }
    },
    async exportPng() {
      if (!ready || !content.current || !scale) {
        throw new Error("Vent til skrift og bilder er ferdig lastet før du eksporterer.");
      }
      await window.document.fonts.ready;
      // Render at document coordinates, independent of viewport scaling. The
      // detached stage contains only content, never selection handles.
      const stage = new Konva.Stage({ container: window.document.createElement("div"), width: design.width, height: design.height });
      try {
        const layer = content.current.clone({ listening: false, x: 0, y: 0 });
        stage.add(layer);
        layer.find("Image").forEach(node => node.cache({ pixelRatio: 2 }));
        const canvas = layer.toCanvas({ x: 0, y: 0, width: design.width, height: design.height, pixelRatio: 2 });
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG kunne ikke opprettes.")), "image/png"));
        return new Uint8Array(await blob.arrayBuffer());
      } finally { stage.destroy(); }
    },
  }));

  function finish(element: StudioElement, node: Konva.Node) {
    const next = normalizeElement({ ...element, x: node.x(), y: node.y(),
      width: node.width() * node.scaleX(), height: node.height() * (element.kind === "image" ? node.scaleX() : node.scaleY()), rotation: node.rotation() });
    node.scale({ x: 1, y: 1 });
    node.position({ x: next.x, y: next.y });
    onChange(next);
  }

  function editText(element: StudioElement) {
    onSelect(element.id);
    if (element.kind === "text") window.requestAnimationFrame(() => window.document.getElementById("studio-text")?.focus());
  }

  const selected = design.elements.find(element => element.id === selectedId);
  return <div ref={host} className={styles.canvasHost}>
    {fontError && <p role="alert">{fontError}</p>}
    {imageError && <p role="alert">{imageError}</p>}
    {(!width || !font) && <p role="status">Laster tegneflaten…</p>}
    {!!width && !!height && !!font && <><div data-studio-card aria-hidden="true" style={{
      position: "absolute", pointerEvents: "none", left: cardX, top: cardY,
      width: cardWidth, height: cardHeight,
    }} /><Stage width={width} height={height} scaleX={scale} scaleY={scale}
      onMouseDown={event => { if (event.target === event.target.getStage()) onSelect(null); }}
      onTouchStart={event => { if (event.target === event.target.getStage()) onSelect(null); }}>
      <Layer ref={content} x={cardX / scale} y={cardY / scale}>
        <Rect width={design.width} height={design.height} fill={design.background}
          onMouseDown={() => onSelect(null)} onTouchStart={() => onSelect(null)} />
        {design.elements.map(element => {
          const register = (node: Konva.Node | null) => { if (node) nodes.current.set(element.id, node); else nodes.current.delete(element.id); };
          const events: KonvaNodeEvents = {
            onClick: () => onSelect(element.id), onTap: () => onSelect(element.id),
            onDragStart: () => onSelect(element.id),
            onDblClick: () => editText(element),
            onDblTap: () => editText(element),
            onDragEnd: event => finish(element, event.target),
            onTransform: element.kind === "text" ? event => {
              const node = event.target;
              // Resize the text frame on every pointer move. Glyphs never scale.
              node.setAttrs({ width: Math.max(24, node.width() * node.scaleX()),
                height: Math.max(element.fontSize * 1.35, node.height() * node.scaleY()), scaleX: 1, scaleY: 1 });
            } : undefined,
            onTransformEnd: event => finish(element, event.target),
          };
          const props = { id: element.id, x: element.x, y: element.y, width: element.width, height: element.height,
            rotation: element.rotation, draggable: true, ref: register, ...events };
          if (element.kind === "text") return <Text key={element.id} {...props} text={element.text}
            fill={element.fill} fontFamily={font} fontStyle={String(element.weight)} fontSize={element.fontSize}
            lineHeight={1.35} padding={0} align={element.align} verticalAlign={element.verticalAlign} wrap="word" />;
          if (element.kind === "rect") return <Rect key={element.id} {...props} fill={element.fill} cornerRadius={element.cornerRadius} />;
          const image = images[element.assetId];
          return image ? <ImageNode key={element.id} element={element} image={image} register={register} events={events} /> : null;
        })}
      </Layer>
      <Layer>
        <Rect x={cardX / scale} y={cardY / scale} width={design.width} height={design.height}
          stroke="#758581" strokeWidth={1 / scale} listening={false} />
        <Transformer ref={transformer} flipEnabled={false} rotateEnabled
          keepRatio={selected?.kind === "image"} enabledAnchors={selected?.kind === "image"
            ? ["top-left", "top-right", "bottom-left", "bottom-right"] : undefined}
          anchorSize={12} rotateAnchorOffset={36} borderStroke="#f0eee9"
          anchorStyleFunc={styleTransformerHandle}
          boundBoxFunc={(oldBox, newBox) => Math.abs(newBox.width) < 24 * scale || Math.abs(newBox.height) < 24 * scale ? oldBox : newBox} />
      </Layer>
    </Stage></>}
  </div>;
}
