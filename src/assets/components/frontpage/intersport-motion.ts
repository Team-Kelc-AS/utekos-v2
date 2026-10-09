import { animate } from "motion/mini";

const smoke = [
  [3.2, -72, -36], [4.1, -48, -18], [3.6, -88, -42],
  [4.4, -32, -24], [3.8, -64, -12],
];
const sparks = [
  [0.8, 48, 22], [1, 72, 36], [0.6, 36, 18], [0.9, 84, 28],
  [0.7, 56, 44], [1, 92, 16], [0.85, 40, 32], [0.75, 68, 40],
];
const ease = [0.22, 1, 0.36, 1] as const;

export function observeIntersport(root: HTMLElement) {
  const logo = root.querySelector<HTMLElement>("[data-intersport-logo]")!;
  const content = root.querySelector<HTMLElement>("[data-intersport-content]")!;
  const controls: ReturnType<typeof animate>[] = [];
  let played = false;

  const finish = () => {
    observer.disconnect();
    controls.forEach((control) => control.cancel());
    controls.length = 0;
    delete root.dataset.motion;
    root.style.transform = "none";
    for (const element of [logo, content]) {
      element.style.opacity = "1";
      element.style.transform = "none";
    }
    root.querySelectorAll<HTMLElement>("[data-intersport-smoke], [data-intersport-spark]")
      .forEach((particle) => {
        particle.style.opacity = "0";
        particle.style.transform = "none";
        particle.style.translate = "none";
      });
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      if (played) finish();
      return;
    }
    if (played) return;
    played = true;
    root.dataset.motion = "playing";

    controls.push(
      animate(logo, {
        opacity: [0, 1],
        transform: [
          "translateX(-140%) scaleX(1.2) rotate(-15deg)",
          "translateX(8%) scaleX(0.9) rotate(-25deg)",
          "translateX(0%) scaleX(1) rotate(0deg)",
        ],
      }, {
        duration: 1.45,
        ease: [ease],
        opacity: { duration: 1.45 * 0.38, ease },
        transform: { duration: 1.45, ease: [ease], times: [0, 0.38, 1] },
      }),
      animate(root, { transform: [-4, 4, -3, 3, 0].map((x) => `translateX(${x}px)`) },
        { duration: 0.28, delay: 0.48, ease: ["easeInOut"] }),
      animate(content, { opacity: [0, 1], transform: ["translateY(30px)", "translateY(0px)"] },
        { duration: 0.78, delay: 0.66, ease }),
    );

    for (const [kind, values] of [["smoke", smoke], ["spark", sparks]] as const) {
      root.querySelectorAll<HTMLElement>(`[data-intersport-${kind}]`).forEach((particle, index) => {
        const [scale, x, y] = values[index];
        const isSmoke = kind === "smoke";
        controls.push(animate(particle, {
          opacity: [0, isSmoke ? 0.65 : 1, 0],
          // Separate native tracks preserve the original whole-path translation
          // while scale and opacity each ease through their midpoint.
          translate: ["0px 0px", `${x}px ${y}px`],
          transform: ["scale(0)", `scale(${isSmoke ? scale * 0.72 : scale})`, `scale(${isSmoke ? scale : 0})`],
        }, {
          duration: isSmoke ? 1.45 : 0.62,
          delay: (isSmoke ? 0.42 : 0.45) + index * 0.02,
          ease: [isSmoke ? [0.16, 1, 0.3, 1] : ease],
        }));
      });
    }
    Promise.all(controls.map((control) => control.finished)).then(finish);
  }, { rootMargin: "0px 0px -18% 0px", threshold: 0.2 });

  observer.observe(root);
  return finish;
}
