import { scroll } from "motion";
import { animate } from "motion/mini";

export function animateReadingProgress(indicator: HTMLElement, article: HTMLElement) {
  const animation = animate(indicator, {
    transform: ["scaleX(0)", "scaleX(1)"],
  }, { ease: "linear", autoplay: false });
  let detach: (() => void) | undefined;
  let observer: ResizeObserver | undefined;
  let resizeFrame: number | undefined;
  const stop = () => {
    observer?.disconnect();
    if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
    detach?.();
    animation.cancel();
    delete indicator.dataset.active;
  };

  try {
    const connect = () => {
      detach?.();
      detach = scroll(animation, { target: article, offset: ["start start", "end end"] });
    };
    connect();
    // Recalculate on content changes (e.g. sources expanding), without
    // polling page dimensions every frame or rendering React on scroll.
    observer = new ResizeObserver(() => {
      if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        try {
          connect();
        } catch {
          stop();
        }
      });
    });
    observer.observe(article);
    indicator.dataset.active = "";
  } catch (error) {
    stop();
    throw error;
  }

  return stop;
}
