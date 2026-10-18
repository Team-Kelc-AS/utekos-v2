"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ProductOverview.module.css";

// Server-rendered rows pass through this single enhancement boundary.
export function ProductRowsMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || media.matches || !window.IntersectionObserver) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    const finish = () => {
      disposed = true;
      observer.disconnect();
      stop?.();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      import("./product-rows-motion").then(({ animateProductRows }) => {
        if (!disposed) stop = animateProductRows(root);
      }).catch(finish);
    }, { rootMargin: "400px" });
    observer.observe(root);
    media.addEventListener("change", finish, { once: true });
    return () => {
      finish();
      media.removeEventListener("change", finish);
    };
  }, []);
  return <section ref={rootRef} className={styles.rows} aria-label="Alle produkter og størrelser">{children}</section>;
}
