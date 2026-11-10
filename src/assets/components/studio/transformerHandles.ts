import type Konva from "konva";

export function styleTransformerHandle(anchor: Konva.Shape) {
  const rotating = anchor.hasName("rotater");
  const size = rotating ? 20 : 12;
  const position = anchor.getAbsolutePosition();
  const distances = anchor.getParent()?.getChildren()
    .filter(node => node !== anchor && node.hasName("_anchor") && node.visible())
    .map(node => { const other = node.getAbsolutePosition(); return Math.hypot(other.x - position.x, other.y - position.y); }) ?? [];
  const hitRadius = Math.max(14, Math.min(22, Math.min(...distances) / 2 - 1));
  anchor.setAttrs({ width: size, height: size, offsetX: size / 2, offsetY: size / 2,
    fill: rotating ? "#f0eee9" : "#b44701", stroke: rotating ? "#758581" : "#f0eee9", strokeWidth: 1 });
  anchor.sceneFunc((context, shape) => {
    const center = shape.width() / 2;
    context.beginPath();
    context.arc(center, center, center - 0.5, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);
    if (!rotating) return;
    context.save();
    context.translate(center, center);
    context.setAttr("strokeStyle", "#010b0a");
    context.setAttr("lineWidth", 1.25);
    context.setAttr("lineCap", "round");
    context.setAttr("lineJoin", "round");
    // Two short arcs leave a 60-degree gap before each opposite arrow.
    for (const rotation of [0, Math.PI]) {
      context.save();
      context.rotate(rotation);
      const end = -Math.PI / 6;
      const radius = 4.5;
      context.beginPath();
      context.arc(0, 0, radius, -5 * Math.PI / 6, end);
      context.stroke();
      context.translate(Math.cos(end) * radius, Math.sin(end) * radius);
      context.rotate(end + Math.PI / 2);
      context.beginPath();
      context.moveTo(-1.75, -1.75);
      context.lineTo(0, 0);
      context.lineTo(-1.75, 1.75);
      context.stroke();
      context.restore();
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
