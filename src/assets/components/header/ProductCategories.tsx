"use client";

import { lazy, Suspense, useId, useState, type ReactNode } from "react";
import styles from "./Header.module.css";

const CategoryCombobox = lazy(() => import("./CategoryCombobox"));

type Props = { items: readonly Readonly<{ label: string; href: string }>[]; icon: ReactNode };

export function ProductCategories(props: Props) {
  const [activated, setActivated] = useState(false);
  const listId = useId();
  const trigger = (
    <button type="button" role="combobox" aria-haspopup="dialog" aria-expanded={false} aria-controls={listId}
      aria-label="Vis produktkategorier" aria-busy={activated} disabled={activated}
      className={`${styles.control} ${styles.categoryTrigger}`}
      onClick={() => setActivated(true)}
      onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActivated(true); } }}>
      {props.icon}
    </button>
  );
  return activated ? <Suspense fallback={trigger}><CategoryCombobox {...props} listId={listId} /></Suspense> : trigger;
}
