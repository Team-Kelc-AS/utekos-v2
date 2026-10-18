"use client";

import { useId, useState } from "react";
import styles from "./DiscountCodeReveal.module.css";

// Keep this state local; the product summary remains server-rendered.
export function DiscountCodeReveal({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className={styles.root} data-open={open}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Skjul rabattkode" : "Trykk for å se rabattkode"}
      </button>
      <div id={panelId} className={styles.reveal} aria-hidden={!open} inert={!open}>
        <div className={styles.inner}>
          <div className={styles.code}>
            <span>Rabattkode</span>
            <code>{code}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
