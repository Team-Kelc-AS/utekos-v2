"use client";

import { useEffect, useRef } from "react";
import styles from "./ArticleReadingProgress.module.css";

// Only the indicator hydrates; article markup and content stay server-rendered.
export function ArticleReadingProgress() {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const indicator = indicatorRef.current;
    const article = indicator?.closest("article");
    if (!indicator || !article) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let stop: (() => void) | undefined;
    const sync = () => {
      stop?.();
      stop = undefined;
      if (reducedMotion.matches) return;

      import("./article-reading-progress-motion").then(({ animateReadingProgress }) => {
        if (!disposed && !reducedMotion.matches && !stop) {
          stop = animateReadingProgress(indicator, article);
        }
      }).catch(() => {
        // An optional enhancement must never affect access to the article.
        delete indicator.dataset.active;
      });
    };

    sync();
    reducedMotion.addEventListener("change", sync);
    return () => {
      disposed = true;
      reducedMotion.removeEventListener("change", sync);
      stop?.();
    };
  }, []);

  return <div ref={indicatorRef} className={styles.progress} data-reading-progress aria-hidden="true" />;
}
