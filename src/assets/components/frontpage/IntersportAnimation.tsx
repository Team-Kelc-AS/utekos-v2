"use client";

import { useEffectEvent, useRef, type ReactNode } from "react";
import styles from "./IntersportSection.module.css";

export function IntersportAnimation({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffectEvent(() => {
    const root = containerRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || reducedMotion.matches) return;

    let disposed = false;
    let stop: (() => void) | undefined;
    const finish = () => {
      disposed = true;
      observer.disconnect();
      stop?.();
      delete root.dataset.motion;
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        import("./intersport-motion")
          .then(({ observeIntersport }) => {
            if (!disposed) stop = observeIntersport(root);
          })
          .catch(finish);
      },
      { rootMargin: "400px" },
    );

    root.dataset.motion = "pending";
    observer.observe(root);
    reducedMotion.addEventListener("change", finish, { once: true });
    root.addEventListener("focusin", finish, { once: true });
    return () => {
      finish();
      reducedMotion.removeEventListener("change", finish);
      root.removeEventListener("focusin", finish);
    };
  });

  return (
    <div ref={containerRef} className={styles.animation}>
      {children}
    </div>
  );
}
