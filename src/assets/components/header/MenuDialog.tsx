"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { useAnimate } from "motion/react-mini";
import { Dialog } from "@base-ui/react/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";
import styles from "./Header.module.css";

export default function MenuDialog({ trigger, logo, closeIcon, categories, children, onClose }: {
  trigger: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  logo: ReactNode;
  closeIcon: ReactNode;
  categories: ReactNode;
  children: ReactNode;
}) {
  const actions = useRef<Dialog.Root.Actions>(null);
  const [, animate] = useAnimate();
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [closing, setClosing] = useState(false);
  const backdrop = useRef<HTMLDivElement>(null);
  const controls = useRef(new Map<Element, ReturnType<typeof animate>>());
  const pathname = usePathname();
  const openedPath = useRef(pathname);
  useEffect(() => { if (pathname !== openedPath.current) actions.current?.close(); }, [pathname]);

  useLayoutEffect(() => {
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(`.${styles.menuLinks} > li`));
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = controls.current;
    let finished = false;
    let deadline: ReturnType<typeof setTimeout> | undefined;

    function stop() {
      for (const control of animations.values()) control.stop();
      animations.clear();
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      stop();
      if (closing) {
        actions.current?.unmount();
      } else {
        for (const element of [panel!, ...items]) {
          element.style.opacity = "1";
          element.style.transform = "none";
        }
        if (backdrop.current) backdrop.current.style.opacity = "1";
      }
    }

    function onPreferenceChange() {
      if (media.matches) finish();
    }

    if (media.matches) {
      // Run after Base UI has applied its open-state change, including focus return.
      queueMicrotask(finish);
    } else {
      try {
        const ease = [0.22, 1, 0.36, 1] as const;
        animations.set(panel, animate(panel, closing
          ? { opacity: 0, transform: "translateX(-24px)" }
          : { opacity: [0, 1], transform: ["translateX(-24px)", "translateX(0px)"] },
        { duration: closing ? 0.2 : 0.22, ease }));
        items.forEach((item, index) => {
          if (!closing && item.contains(document.activeElement)) return;
          animations.set(item, animate(item, closing
            ? { opacity: 0, transform: "translateY(12px)" }
            : { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] }, {
            duration: closing ? 0.125 : 0.18,
            delay: closing ? Math.min(items.length - 1 - index, 3) * 0.025 : 0.06 + index * 0.04,
            ease,
          }));
        });
        if (backdrop.current) {
          animations.set(backdrop.current, animate(backdrop.current,
            closing ? { opacity: 0 } : { opacity: [0, 1] }, { duration: 0.15 }));
        }
        // A canceled browser animation must never strand a modal overlay.
        if (closing) deadline = setTimeout(finish, 200);
        void Promise.all([...animations.values()]).then(finish, finish);
      } catch {
        queueMicrotask(finish);
      }
    }
    media.addEventListener("change", onPreferenceChange);
    return () => {
      finished = true;
      clearTimeout(deadline);
      media.removeEventListener("change", onPreferenceChange);
      stop(); // Motion commits current styles, preserving interrupted positions.
    };
  }, [panel, closing, animate]);

  function revealFocusedItem(event: FocusEvent<HTMLDivElement>) {
    if (closing) return;
    const item = event.target.closest<HTMLElement>(`.${styles.menuLinks} > li`);
    if (!item) return;
    // Reveal both the item and its animated ancestor before painting focus.
    for (const element of [panel, item]) {
      if (!element) continue;
      controls.current.get(element)?.stop();
      controls.current.delete(element);
      element.style.opacity = "1";
      element.style.transform = "none";
    }
  }

  function closeOnNavigation(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (link && !link.hasAttribute("download") && link.getAttribute("target") !== "_blank") actions.current?.close();
  }

  return (
    <Dialog.Root defaultOpen actionsRef={actions} onOpenChange={(open, details) => {
      if (!open) {
        details.preventUnmountOnClose();
        setClosing(true);
      }
    }} onOpenChangeComplete={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop ref={backdrop} className={`${styles.backdrop} ${styles.menuBackdrop}`} />
        <Dialog.Popup ref={setPanel} onFocusCapture={revealFocusedItem} className={styles.menuPanel} finalFocus={trigger} onClickCapture={closeOnNavigation}>
          <div className={styles.menuHeading}>
            <div className={styles.menuBrand}>{logo}<Dialog.Title className={styles.dialogTitle}>Meny</Dialog.Title></div>
            <Dialog.Close className={`${styles.control} ${styles.close}`} aria-label="Lukk meny">{closeIcon}</Dialog.Close>
            <Dialog.Description className={styles.menuSubtitle}>Utforsk vår kolleksjon</Dialog.Description>
          </div>
          <nav className={styles.panelNavigation} aria-label="Alle sider">
            <ul className={styles.menuLinks}>
              <li>
                <Accordion>
                  <AccordionItem value="products" variant="navigation">
                    <AccordionTrigger variant="navigation" typography="inherit">Produkter</AccordionTrigger>
                    <AccordionContent variant="navigation" typography="inherit">{categories}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </li>
              {children}
            </ul>
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
