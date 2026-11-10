export type Point = { x: number; y: number };
export type StudioView = Point & { scale: number };
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 4;

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
