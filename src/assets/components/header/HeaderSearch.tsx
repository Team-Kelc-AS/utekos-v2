"use client";

import { lazy, Suspense, useId, useRef, useState, type ReactNode } from "react";
import styles from "./Header.module.css";

const SearchDialog = lazy(() => import("./SearchDialog"));

export function HeaderSearch({ icon, closeIcon }: { icon: ReactNode; closeIcon: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <form role="search" aria-label="Søk på nettsiden" className={styles.headerSearch} onSubmit={(event) => {
      event.preventDefault();
      setQuery(input.current?.value ?? "");
      setOpen(true);
    }}>
      <label htmlFor={id} className={styles.searchInputLabel}>Søk</label>
      <div className={styles.headerSearchField}>
        <input ref={input} id={id} type="search" name="q" placeholder="Søk på nettsiden" autoComplete="off" className={styles.searchInput} />
        <button type="submit" className={styles.control} aria-label="Vis søkeresultater" aria-haspopup="dialog" aria-expanded={open}>{icon}</button>
      </div>
      {open && <Suspense fallback={<span className={styles.searchLoading} role="status">Åpner søk …</span>}>
        <SearchDialog trigger={input} initialQuery={query} closeIcon={closeIcon} onClose={() => setOpen(false)} />
      </Suspense>}
    </form>
  );
}
