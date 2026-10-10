"use client";

import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ReactElement, type RefAttributes } from "react";
import { createPortal } from "react-dom";
import styles from "./WishlistButton.module.css";

// This is a text tooltip, not an interactive preview. Keep its dependency
// limited to React; a portal preserves visibility outside overflow-hidden cards.
export default function WishlistHoverCard({ button, dialogOpen }: {
  button: ReactElement<ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>>;
  dialogOpen: boolean;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const visible = open && !dialogOpen;

  function cancelTimer() { clearTimeout(timer.current); }
  function close() { cancelTimer(); setOpen(false); }
  function show() { cancelTimer(); timer.current = setTimeout(() => setOpen(true), 250); }
  function leave() {
    cancelTimer();
    timer.current = setTimeout(() => {
      if (document.activeElement !== trigger.current) setOpen(false);
    }, 100);
  }

  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    if (!visible) return;
    function position() {
      const anchor = trigger.current?.getBoundingClientRect();
      const tooltip = popup.current;
      if (!anchor || !tooltip) return;
      const { width, height } = tooltip.getBoundingClientRect();
      tooltip.style.left = `${Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8))}px`;
      tooltip.style.top = `${anchor.top - height - 8 >= 8 ? anchor.top - height - 8 : anchor.bottom + 8}px`;
    }
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape") { clearTimeout(timer.current); setOpen(false); }
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("keydown", dismiss);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("keydown", dismiss);
    };
  }, [visible]);

  return <>
    {cloneElement(button, {
      // The local button has no external ref or pointer/focus handlers.
      ref: trigger,
      "aria-describedby": visible ? id : undefined,
      onPointerEnter: event => { if (event.pointerType !== "touch") show(); },
      onPointerLeave: leave,
      onFocus: show,
      onBlur: close,
      onClick: event => { close(); button.props.onClick?.(event); },
    })}
    {visible && createPortal(
      <div ref={popup} id={id} role="tooltip" className={`${styles.hoverCard} fixed z-50 rounded-lg text-sm shadow-md`}
        onPointerEnter={cancelTimer} onPointerLeave={leave}>
        Legg i ønskeliste
      </div>, document.body,
    )}
  </>;
}
