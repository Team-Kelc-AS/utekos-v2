import { MAX_ELEMENTS, normalizeElement, replaceElement, rotatedBounds, type StudioDocument } from "./document";

export type StudioLayerAction = "forward" | "backward" | "front" | "back";

export function duplicateElement(document: StudioDocument, id: string, nextId: string): StudioDocument {
  const index = document.elements.findIndex(element => element.id === id);
  if (index < 0 || document.elements.length >= MAX_ELEMENTS || document.elements.some(element => element.id === nextId)) return document;
  const source = document.elements[index];
  const copy = normalizeElement({ ...source, id: nextId, name: `${source.name.slice(0, 93)} (kopi)`,
    x: source.x + (source.x + 24 <= 8192 ? 24 : -24), y: source.y + (source.y + 24 <= 8192 ? 24 : -24) });
  const elements = [...document.elements]; elements.splice(index + 1, 0, copy);
  return { ...document, elements };
}

export function removeElement(document: StudioDocument, id: string): StudioDocument {
  const elements = document.elements.filter(element => element.id !== id);
  if (elements.length === document.elements.length) return document;
  const assetIds = new Set(elements.flatMap(element => element.kind === "image" ? [element.assetId] : []));
  return { ...document, elements, assets: Object.fromEntries(Object.entries(document.assets).filter(([id]) => assetIds.has(id))) };
}

export function orderElement(document: StudioDocument, id: string, action: StudioLayerAction): StudioDocument {
  const index = document.elements.findIndex(element => element.id === id);
  const target = action === "front" ? document.elements.length - 1 : action === "back" ? 0 : index + (action === "forward" ? 1 : -1);
  if (index < 0 || target < 0 || target >= document.elements.length || target === index) return document;
  const elements = [...document.elements]; const [element] = elements.splice(index, 1); elements.splice(target, 0, element);
  return { ...document, elements };
}

export function centerElement(document: StudioDocument, id: string, axis: "horizontal" | "vertical"): StudioDocument {
  const element = document.elements.find(element => element.id === id);
  if (!element) return document;
  const bounds = rotatedBounds(element);
  return replaceElement(document, { ...element, ...(axis === "horizontal"
    ? { x: (document.width - bounds.left - bounds.right) / 2 }
    : { y: (document.height - bounds.top - bounds.bottom) / 2 }) });
}
