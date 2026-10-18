import { animate } from "motion/mini";

export function animateProductRows(root: HTMLElement) {
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-product-row]"));
  const running = new Map<HTMLElement, ReturnType<typeof animate>[]>();
  const seen = new Set<HTMLElement>();
  const initiallyVisible = new Set(rows.filter((row) => {
    const box = row.getBoundingClientRect();
    return box.top < innerHeight && box.bottom > 0;
  }));
  const finishRow = (row: HTMLElement) => {
    seen.add(row);
    observer.unobserve(row);
    delete row.dataset.rowMotion;
    for (const animation of running.get(row) ?? []) animation.cancel();
    running.delete(row);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const row = entry.target as HTMLElement;
      if (!entry.isIntersecting || seen.has(row)) continue;
      seen.add(row);
      observer.unobserve(row);
      const controls: ReturnType<typeof animate>[] = [];
      running.set(row, controls);
      try {
        // Animate slides, leaving Embla's track transform and card flips untouched.
        row.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]').forEach((slide, index) => {
          controls.push(animate(slide, {
            opacity: initiallyVisible.has(row) ? [1, 1] : [0, 1],
            transform: ["translate(18px, 24px)", "translate(0px, 0px)"],
          }, {
            duration: 0.5,
            delay: index * 0.065,
            ease: [0.22, 1, 0.36, 1],
          }));
        });
        row.dataset.rowMotion = "playing";
        void Promise.all(controls).then(() => finishRow(row), () => finishRow(row));
      } catch {
        finishRow(row);
      }
    }
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.12 });

  const revealInteraction = (event: Event) => {
    const row = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-product-row]") : null;
    if (row && root.contains(row)) finishRow(row);
  };
  for (const row of rows) {
    // Keep visible images painted; no hidden content before hydration or import.
    if (!initiallyVisible.has(row)) row.dataset.rowMotion = "waiting";
    observer.observe(row);
  }
  root.addEventListener("focusin", revealInteraction);
  root.addEventListener("pointerdown", revealInteraction, true);
  return () => {
    for (const row of rows) finishRow(row);
    observer.disconnect();
    root.removeEventListener("focusin", revealInteraction);
    root.removeEventListener("pointerdown", revealInteraction, true);
  };
}
