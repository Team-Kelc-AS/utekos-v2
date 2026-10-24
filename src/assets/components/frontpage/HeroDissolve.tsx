"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HeroDissolve({ children, mediaQuery = "(min-width: 640px) and (prefers-reduced-motion: no-preference)" }: { children: ReactNode; mediaQuery?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const media = window.matchMedia(mediaQuery);
    const front = root.querySelector<HTMLImageElement>("[data-hero-front] img");
    let controller: AbortController | undefined;
    let frame = 0;
    let idle = 0;
    let timer = 0;
    let hasBeenVisible = false;
    const cancel = () => {
      controller?.abort();
      cancelAnimationFrame(frame);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
    const sync = () => {
      cancel();
      if (!media.matches || !hasBeenVisible || document.readyState !== "complete" || !front?.complete || !front.naturalWidth) return;
      const next = new AbortController();
      controller = next;
      const enhance = () => {
        if (next.signal.aborted) return;
        // The second slide must not compete with the first image for bandwidth.
        for (const source of root.querySelectorAll<HTMLSourceElement>("[data-hero-srcset]")) {
          if (!source.srcset) source.srcset = source.dataset.heroSrcset ?? "";
        }
        import("./hero-dissolve")
          .then(({ enhanceHeroDissolve }) => enhanceHeroDissolve(root, next.signal))
          .catch((error: unknown) => {
            if (next.signal.aborted) return;
            next.abort();
            console.warn("Hero dissolve unavailable; retaining the original images.", error);
          });
      };
      // Allow the first image to paint before preparing the GPU and second slide.
      frame = requestAnimationFrame(() => {
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(enhance, { timeout: 1500 });
        else timer = window.setTimeout(enhance, 0);
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      hasBeenVisible = true;
      observer.disconnect();
      sync();
    });
    observer.observe(root);
    media.addEventListener("change", sync);
    front?.addEventListener("load", sync);
    window.addEventListener("load", sync);
    return () => {
      cancel();
      observer.disconnect();
      media.removeEventListener("change", sync);
      front?.removeEventListener("load", sync);
      window.removeEventListener("load", sync);
    };
  }, [mediaQuery]);

  return (
    <div
      ref={rootRef}
      data-hero-dissolve
      className="group/dissolve relative isolate"
    >
      <div data-hero-frame className="relative overflow-hidden">
        {children}
        <canvas
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden size-full opacity-(--hero-particle-opacity) group-data-[state=ready]/dissolve:block"
        />
      </div>
    </div>
  );
}
