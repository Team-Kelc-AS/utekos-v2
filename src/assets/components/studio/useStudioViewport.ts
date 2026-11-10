import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject, type TouchEvent as ReactTouchEvent } from "react";
import { fitView, zoomView, type Point, type StudioView } from "@/lib/studio/viewport";

type Pan = { kind: "mouse" | "touch"; from: Point; view: StudioView };
type Pinch = { center: Point; distance: number; view: StudioView };

export function useStudioViewport(host: RefObject<HTMLDivElement | null>, documentWidth: number, documentHeight: number, interrupt: () => void) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<StudioView | null>(null);
  const [handMode, setHandMode] = useState(false);
  const [space, setSpace] = useState(false);
  const [panning, setPanning] = useState(false);
  const hovered = useRef(false);
  const previousSize = useRef(viewport);
  const pan = useRef<Pan | null>(null);
  const pinch = useRef<Pinch | null>(null);
  const view = camera ?? fitView(viewport.width, viewport.height, documentWidth, documentHeight);

  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const previous = previousSize.current;
      if (previous.width && previous.height) setCamera(camera => camera ? {
        ...camera, x: camera.x + (width - previous.width) / 2, y: camera.y + (height - previous.height) / 2,
      } : null);
      previousSize.current = { width, height };
      setViewport({ width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [host]);

  useEffect(() => {
    function move(event: MouseEvent) {
      const active = pan.current;
      if (active?.kind === "mouse") setCamera({ ...active.view,
        x: active.view.x + event.clientX - active.from.x, y: active.view.y + event.clientY - active.from.y });
    }
    function end() { if (pan.current?.kind === "mouse") { pan.current = null; setPanning(false); } }
    function down(event: KeyboardEvent) {
      if (event.code !== "Space" || !hovered.current || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, button, a, [contenteditable=true]")) return;
      event.preventDefault(); setSpace(true);
    }
    function up(event: KeyboardEvent) { if (event.code === "Space") setSpace(false); }
    function blur() { pan.current = null; pinch.current = null; setSpace(false); setPanning(false); interrupt(); }
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", end);
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur);
    };
  }, [interrupt]);

  function mouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 1 && !(event.button === 0 && (handMode || space))) return;
    event.preventDefault(); event.stopPropagation(); interrupt();
    pan.current = { kind: "mouse", from: { x: event.clientX, y: event.clientY }, view };
    setPanning(true);
  }
  function touchPoints(event: ReactTouchEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return Array.from(event.touches, touch => ({ x: touch.clientX - bounds.left, y: touch.clientY - bounds.top }));
  }
  function touchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const [first, second] = touchPoints(event);
    if (second) {
      event.stopPropagation(); interrupt(); pan.current = null;
      pinch.current = { view, center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)) };
      setPanning(true);
    } else if (handMode && first) {
      event.stopPropagation(); interrupt(); pan.current = { kind: "touch", from: first, view }; setPanning(true);
    }
  }
  function touchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const [first, second] = touchPoints(event);
    const active = pinch.current;
    if (active) {
      event.stopPropagation();
      if (first && second) {
        const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        setCamera(zoomView(active.view, active.view.scale * distance / active.distance, active.center, center));
      }
    } else if (pan.current?.kind === "touch" && first) {
      event.stopPropagation(); const active = pan.current;
      setCamera({ ...active.view, x: active.view.x + first.x - active.from.x, y: active.view.y + first.y - active.from.y });
    }
  }
  function touchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    if (!pinch.current && !pan.current) return;
    event.stopPropagation();
    if (!event.touches.length) { pan.current = null; pinch.current = null; setPanning(false); }
  }
  return {
    viewport, view, handMode, panning, panEnabled: handMode || space,
    togglePan: () => setHandMode(value => !value),
    fit: () => setCamera(null),
    zoom: (scale: number, point: Point = { x: viewport.width / 2, y: viewport.height / 2 }) => setCamera(zoomView(view, scale, point)),
    wheel: (event: WheelEvent, point: Point) => {
      if (event.ctrlKey || event.metaKey) setCamera(zoomView(view, view.scale * Math.exp(-event.deltaY * 0.01), point));
      else setCamera({ ...view, x: view.x - event.deltaX, y: view.y - event.deltaY });
    },
    hostEvents: {
      onMouseEnter: () => { hovered.current = true; }, onMouseLeave: () => { hovered.current = false; },
      onMouseDownCapture: mouseDown, onTouchStartCapture: touchStart, onTouchMoveCapture: touchMove, onTouchEndCapture: touchEnd,
      onTouchCancelCapture: () => { pan.current = null; pinch.current = null; setPanning(false); interrupt(); },
    },
  };
}
