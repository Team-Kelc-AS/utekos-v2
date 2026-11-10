import { rotatedBounds, type StudioElement } from "./document";

export type Point = { x: number; y: number };
export type StudioView = Point & { scale: number };
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 4;
export const SELECTION_TOOLBAR_WIDTH = 150;
export const SELECTION_TOOLBAR_HEIGHT = 54;

export function selectionToolbarPosition(element: StudioElement, view: StudioView, width: number, height: number): Point {
  const bounds = rotatedBounds(element), radians = element.rotation * Math.PI / 180;
  const rotateX = view.x + element.x * view.scale + element.width * view.scale / 2 * Math.cos(radians) + 36 * Math.sin(radians);
  const rotateY = view.y + element.y * view.scale + element.width * view.scale / 2 * Math.sin(radians) - 36 * Math.cos(radians);
  const left = Math.min(view.x + (element.x + bounds.left) * view.scale - 6, rotateX - 10);
  const right = Math.max(view.x + (element.x + bounds.right) * view.scale + 6, rotateX + 10);
  const top = Math.min(view.y + (element.y + bounds.top) * view.scale - 6, rotateY - 10);
  const bottom = Math.max(view.y + (element.y + bounds.bottom) * view.scale + 6, rotateY + 10);
  const maxX = Math.max(8, width - SELECTION_TOOLBAR_WIDTH - 8), maxY = Math.max(8, height - SELECTION_TOOLBAR_HEIGHT - 8);
  const x = Math.max(8, Math.min((left + right - SELECTION_TOOLBAR_WIDTH) / 2, maxX));
  const y = Math.max(8, Math.min((top + bottom - SELECTION_TOOLBAR_HEIGHT) / 2, maxY));
  if (top - 12 - SELECTION_TOOLBAR_HEIGHT >= 8) return { x, y: Math.min(top - 12 - SELECTION_TOOLBAR_HEIGHT, maxY) };
  if (bottom + 12 <= maxY) return { x, y: Math.max(8, bottom + 12) };
  if (right + 12 <= maxX) return { x: Math.max(8, right + 12), y };
  if (left - 12 - SELECTION_TOOLBAR_WIDTH >= 8) return { x: Math.min(maxX, left - 12 - SELECTION_TOOLBAR_WIDTH), y };
  return { x: 8, y: 8 };
}

export function fitView(width: number, height: number, documentWidth: number, documentHeight: number): StudioView {
  const margin = width < 500 ? 40 : 80;
  const scale = Math.max(0.01, Math.min((width - margin * 2) / documentWidth, (height - margin * 2) / documentHeight));
  return { scale, x: (width - documentWidth * scale) / 2, y: (height - documentHeight * scale) / 2 };
}

export function zoomView(view: StudioView, scale: number, from: Point, to = from): StudioView {
  const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
  return { scale: next, x: to.x - (from.x - view.x) / view.scale * next,
    y: to.y - (from.y - view.y) / view.scale * next };
}

export function measurementPosition(point: Point, width: number, height: number, rotating: boolean, touch: boolean) {
  const boxWidth = rotating ? 72 : 156;
  return {
    x: Math.max(8, Math.min(point.x + 16 + boxWidth > width - 8 ? point.x - boxWidth - 16 : point.x + 16, width - boxWidth - 8)),
    y: Math.max(8, Math.min(touch || point.y + 52 > height ? point.y - 48 : point.y + 20, height - 40)),
  };
}
