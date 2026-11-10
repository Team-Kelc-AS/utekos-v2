import type Konva from "konva";

const DIRECTIONS: ReadonlyArray<readonly [string, number]> = [
  ["top-left", -3 * Math.PI / 4], ["top-center", -Math.PI / 2], ["top-right", -Math.PI / 4],
  ["middle-left", Math.PI], ["middle-right", 0],
  ["bottom-left", 3 * Math.PI / 4], ["bottom-center", Math.PI / 2], ["bottom-right", Math.PI / 4],
];

export function styleTransformerHandle(anchor: Konva.Shape) {
  const rotating = anchor.hasName("rotater");
  const direction = DIRECTIONS.find(([name]) => anchor.hasName(name))?.[1] ?? 0;
  const position = anchor.getAbsolutePosition();
  const distances = anchor.getParent()?.getChildren()
    .filter(node => node !== anchor && node.hasName("_anchor") && node.visible())
    .map(node => { const other = node.getAbsolutePosition(); return Math.hypot(other.x - position.x, other.y - position.y); }) ?? [];
  const hitRadius = Math.max(14, Math.min(22, Math.min(...distances) / 2 - 1));
  anchor.setAttrs({ fill: "#b44701", stroke: "#f0eee9", strokeWidth: 1.5 });
  anchor.sceneFunc((context, shape) => {
    const center = shape.width() / 2;
    context.beginPath();
    context.arc(center, center, center - 0.75, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);

    context.save();
    context.translate(center, center);
    context.setAttr("fillStyle", "#f0eee9");
    if (rotating) {
      const end = Math.PI * 2.2;
      context.setAttr("strokeStyle", "#f0eee9");
      context.setAttr("lineWidth", 1.8);
      context.setAttr("lineCap", "round");
      context.setAttr("lineJoin", "round");
      context.beginPath();
      context.arc(0, 0, 5.5, Math.PI * 0.75, end);
      context.stroke();
      context.translate(Math.cos(end) * 5.5, Math.sin(end) * 5.5);
      context.rotate(end + Math.PI / 2);
      context.beginPath();
      context.moveTo(-3, -3);
      context.lineTo(0, 0);
      context.lineTo(-3, 3);
      context.stroke();
    } else {
      // Anchor-local directions rotate with the selected object.
      context.rotate(direction);
      context.beginPath();
      context.moveTo(-6, -1.25);
      context.lineTo(1, -1.25);
      context.lineTo(1, -4.5);
      context.lineTo(6, 0);
      context.lineTo(1, 4.5);
      context.lineTo(1, 1.25);
      context.lineTo(-6, 1.25);
      context.closePath();
      context.fill();
    }
    context.restore();
  });
  // Expand toward 44px when space permits, without blocking object dragging
  // between nearby handles on small mobile previews.
  anchor.hitFunc((context, shape) => {
    const center = shape.width() / 2;
    context.beginPath();
    context.arc(center, center, hitRadius, 0, Math.PI * 2);
    context.closePath();
    context.fillShape(shape);
  });
}
