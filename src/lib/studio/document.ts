import { z } from "zod";

export const STUDIO_FORMAT = "utekos-design";
export const MAX_DOCUMENT_BYTES = 24 * 1024 * 1024;
export const MAX_ELEMENTS = 40;
export const PALETTE = ["#001a18", "#012622", "#010b0a", "#b44701", "#f0eee9"] as const;
const color = z.string().regex(/^#[\da-f]{6}$/i);
const dimension = z.number().finite().min(24).max(4096);
const geometry = {
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(100),
  x: z.number().finite().min(-8192).max(8192),
  y: z.number().finite().min(-8192).max(8192),
  width: z.number().finite().min(0.01).max(4096),
  height: z.number().finite().min(0.01).max(4096),
  rotation: z.number().finite().min(-180).max(180),
};
const textSchema = z.strictObject({
  ...geometry, kind: z.literal("text"), text: z.string().max(2000),
  font: z.literal("utekos-sans"), weight: z.union([z.literal(500), z.literal(800)]),
  fontSize: z.number().finite().min(12).max(240), fill: color,
  align: z.enum(["left", "center", "right"]),
  verticalAlign: z.enum(["top", "middle", "bottom"]),
});
const rectSchema = z.strictObject({
  ...geometry, kind: z.literal("rect"), fill: color,
  cornerRadius: z.number().finite().min(0).max(512),
});
const imageSchema = z.strictObject({
  ...geometry, kind: z.literal("image"), assetId: z.string().min(1).max(80),
  brightness: z.number().finite().min(-1).max(1),
});
export const elementSchema = z.discriminatedUnion("kind", [textSchema, rectSchema, imageSchema]);
export type StudioElement = z.infer<typeof elementSchema>;
export type StudioImage = Extract<StudioElement, { kind: "image" }>;
const assetSchema = z.strictObject({
  mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
  base64: z.string().min(4).max(6 * 1024 * 1024).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  width: z.number().int().min(1).max(12000),
  height: z.number().int().min(1).max(12000),
});
export type StudioAsset = z.infer<typeof assetSchema>;
const documentSchema = z.strictObject({
  format: z.literal(STUDIO_FORMAT), version: z.literal(2),
  width: dimension, height: dimension, background: color,
  elements: z.array(elementSchema).max(MAX_ELEMENTS),
  assets: z.record(z.string().min(1).max(80), assetSchema),
});
export type StudioDocument = z.infer<typeof documentSchema>;
const legacyDocumentSchema = documentSchema.extend({
  version: z.literal(1),
  elements: z.array(z.discriminatedUnion("kind", [textSchema.omit({ align: true, verticalAlign: true }), rectSchema, imageSchema])).max(MAX_ELEMENTS),
});

export function createDocument(): StudioDocument {
  return {
    format: STUDIO_FORMAT, version: 2, width: 1200, height: 900,
    background: "#001a18", assets: {},
    elements: [
      { id: "label", kind: "text", name: "Merkelapp", x: 80, y: 90, width: 247, height: 38, rotation: 0,
        text: "Gavekort · Utekos®", font: "utekos-sans", weight: 800, fontSize: 28, fill: "#f0eee9", align: "left", verticalAlign: "top" },
      { id: "heading", kind: "text", name: "Hovedoverskrift", x: 80, y: 180, width: 682, height: 98, rotation: 0,
        text: "Skreddersy varmen.", font: "utekos-sans", weight: 800, fontSize: 72, fill: "#f0eee9", align: "left", verticalAlign: "top" },
      { id: "message", kind: "text", name: "Korttekst", x: 80, y: 380, width: 940, height: 98, rotation: 0,
        text: "Klikk rett på teksten for å skrive din egen hilsen, og dra boksen dit du vil ha den.",
        font: "utekos-sans", weight: 500, fontSize: 36, fill: "#f0eee9", align: "left", verticalAlign: "top" },
    ],
  };
}

export function rotatedBounds(element: StudioElement) {
  const radians = element.rotation * Math.PI / 180;
  const cosine = Math.cos(radians), sine = Math.sin(radians);
  const corners = [[0, 0], [element.width, 0], [0, element.height], [element.width, element.height]];
  const xs = corners.map(([x, y]) => x * cosine - y * sine);
  const ys = corners.map(([x, y]) => x * sine + y * cosine);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

export function normalizeElement(element: StudioElement): StudioElement {
  const rotation = ((element.rotation + 180) % 360 + 360) % 360 - 180;
  const candidate = { ...element, rotation, width: Math.max(0.01, element.width), height: Math.max(0.01, element.height) };
  const factor = Math.min(1, 4096 / candidate.width, 4096 / candidate.height);
  candidate.width *= factor;
  candidate.height *= factor;
  return { ...candidate,
    x: Math.max(-8192, Math.min(element.x, 8192)),
    y: Math.max(-8192, Math.min(element.y, 8192)),
  };
}

export function replaceElement(doc: StudioDocument, element: StudioElement): StudioDocument {
  return { ...doc, elements: doc.elements.map(item => item.id === element.id ? normalizeElement(element) : item) };
}

export function parseDocument(serialized: string): StudioDocument {
  let bytes = 0;
  for (const character of serialized) {
    const code = character.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    if (bytes > MAX_DOCUMENT_BYTES) throw new Error("Designfilen er for stor.");
  }
  const input: unknown = JSON.parse(serialized);
  const legacy = typeof input === "object" && input !== null && "version" in input && input.version === 1
    ? legacyDocumentSchema.parse(input) : null;
  const doc = documentSchema.parse(legacy ? { ...legacy, version: 2,
    elements: legacy.elements.map(element => element.kind === "text" ? { ...element, align: "left", verticalAlign: "top" } : element),
  } : input);
  if (doc.width * doc.height > 16_000_000 || Object.keys(doc.assets).length > MAX_ELEMENTS) throw new Error("Designet er for stort.");
  const ids = new Set<string>();
  for (const asset of Object.values(doc.assets)) {
    if (asset.width * asset.height > 24_000_000) throw new Error("Et bilde har for høy oppløsning.");
  }
  for (const element of doc.elements) {
    if (ids.has(element.id)) throw new Error("Flere elementer har samme ID.");
    ids.add(element.id);
    if (element.kind === "image") {
      const asset = doc.assets[element.assetId];
      if (!asset || Math.abs(element.width / element.height - asset.width / asset.height) > 0.001) {
        throw new Error("Bildet mangler eller har feil proporsjoner.");
      }
    }
  }
  return doc;
}

export function serializeDocument(doc: StudioDocument): string {
  const serialized = JSON.stringify(doc);
  parseDocument(serialized);
  return serialized;
}

export type StudioHistory = { past: StudioDocument[]; present: StudioDocument; future: StudioDocument[] };
export type StudioAction = { type: "commit" | "restore"; document: StudioDocument }
  | { type: "edit"; update(document: StudioDocument): StudioDocument } | { type: "undo" | "redo" };
export function createHistory(document = createDocument()): StudioHistory {
  return { past: [], present: document, future: [] };
}
export function studioReducer(state: StudioHistory, action: StudioAction): StudioHistory {
  if (action.type === "edit") return studioReducer(state, { type: "commit", document: action.update(state.present) });
  if (action.type === "restore") return createHistory(action.document);
  if (action.type === "commit") {
    if (state.present === action.document || (state.present.assets === action.document.assets &&
      state.present.width === action.document.width && state.present.height === action.document.height &&
      state.present.background === action.document.background &&
      JSON.stringify(state.present.elements) === JSON.stringify(action.document.elements))) return state;
    return { past: [...state.past.slice(-39), state.present], present: action.document, future: [] };
  }
  if (action.type === "undo" && state.past.length) {
    return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] };
  }
  if (action.type === "redo" && state.future.length) {
    return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
  }
  return state;
}
