"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function VideoPlayback({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const videos = Array.from(ref.current?.querySelectorAll("video") ?? []);
    if (!videos.length || !("IntersectionObserver" in window)) return;

    const visible = new Set<HTMLVideoElement>();
    const blocked = new Set<HTMLVideoElement>();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hasScrolled = window.scrollY > 0;
    let disposed = false;

    function updatePlayback() {
      for (const video of videos) {
        if (!visible.has(video) || document.hidden) {
          if (!video.paused) video.pause();
          continue;
        }
        if (blocked.has(video)) continue;
        if (reducedMotion.matches) {
          if (!video.paused) video.pause();
          continue;
        }
        if (!hasScrolled || !video.paused) continue;

        void video.play().then(() => {
          // Scrolling away may happen while the media request is still pending.
          if (disposed || !visible.has(video) || document.hidden) video.pause();
        }).catch((error: unknown) => {
          // If autoplay is blocked, keep the poster without adding player controls.
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            blocked.add(video);
          }
        });
      }
    }

    function onScroll() {
      if (window.scrollY <= 0) return;
      hasScrolled = true;
      window.removeEventListener("scroll", onScroll);
      updatePlayback();
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) visible.add(video);
        else visible.delete(video);
      }
      updatePlayback();
    }, { threshold: [0, 0.25] });

    for (const video of videos) {
      observer.observe(video);
    }
    if (!hasScrolled) window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", updatePlayback);
    reducedMotion.addEventListener("change", updatePlayback);

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", updatePlayback);
      reducedMotion.removeEventListener("change", updatePlayback);
      for (const video of videos) {
        if (!video.paused) video.pause();
      }
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
