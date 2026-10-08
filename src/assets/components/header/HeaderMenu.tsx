"use client";

import { lazy, Suspense, useRef, useState, type ReactNode } from "react";
import styles from "./Header.module.css";

const MenuDialog = lazy(() => import("./MenuDialog"));

export function HeaderMenu({ trigger, ...content }: {
  trigger: ReactNode;
  logo: ReactNode;
  closeIcon: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={button} type="button" className={styles.control} aria-label="Åpne meny"
      aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{trigger}</button>
    {open && <Suspense fallback={<span className={styles.searchLoading} role="status">Åpner meny …</span>}>
      <MenuDialog {...content} trigger={button} onClose={() => setOpen(false)} />
    </Suspense>}
  </>;
}
