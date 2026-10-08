"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import styles from "./Header.module.css";

export default function MenuDialog({ trigger, logo, closeIcon, children, onClose }: {
  trigger: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  logo: ReactNode;
  closeIcon: ReactNode;
  children: ReactNode;
}) {
  const actions = useRef<Dialog.Root.Actions>(null);
  const pathname = usePathname();
  const openedPath = useRef(pathname);
  useEffect(() => { if (pathname !== openedPath.current) actions.current?.close(); }, [pathname]);

  function closeOnNavigation(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (link && !link.hasAttribute("download") && link.getAttribute("target") !== "_blank") actions.current?.close();
  }

  return (
    <Dialog.Root defaultOpen actionsRef={actions} onOpenChangeComplete={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.menuPanel} finalFocus={trigger} onClickCapture={closeOnNavigation}>
          <div className={styles.menuHeading}>
            <div className={styles.menuBrand}>{logo}<Dialog.Title className={styles.dialogTitle}>Meny</Dialog.Title></div>
            <Dialog.Close className={`${styles.control} ${styles.close}`} aria-label="Lukk meny">{closeIcon}</Dialog.Close>
            <Dialog.Description className={styles.menuSubtitle}>Utforsk vår kolleksjon</Dialog.Description>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
