"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { loadSearchIndex } from "@/lib/search/client";
import { filterSearchGroups } from "@/lib/search/filter";
import type { SearchIndex } from "@/lib/search/types";
import styles from "./Header.module.css";

type SearchState = { status: "loading" | "error" } | { status: "ready"; index: SearchIndex };

export default function SearchDialog({ trigger, initialQuery, closeIcon, onClose }: {
  trigger: RefObject<HTMLButtonElement | null>;
  initialQuery: string;
  closeIcon: ReactNode;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SearchState>({ status: "loading" });
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    let active = true;
    loadSearchIndex().then(
      (index) => { if (active) setState({ status: "ready", index }); },
      () => { if (active) setState({ status: "error" }); },
    );
    return () => { active = false; };
  }, [attempt]);

  const groups = state.status === "ready" ? filterSearchGroups(state.index.groups, query) : [];
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);

  function closeOnNavigation(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest("a[href]")) onClose();
  }

  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.searchPanel} initialFocus={input} finalFocus={trigger}>
          <div className={styles.searchHeading}>
            <Dialog.Title className={styles.dialogTitle}>Søk</Dialog.Title>
            <Dialog.Close className={styles.control} aria-label="Lukk søk">{closeIcon}</Dialog.Close>
          </div>
          <Dialog.Description className={styles.searchDescription}>Søk etter produkter og sider.</Dialog.Description>
          <label htmlFor={id} className={styles.searchInputLabel}>Søk på nettsiden</label>
          <input ref={input} id={id} type="search" className={styles.searchInput} placeholder="Søk på nettsiden" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className={styles.searchResults} aria-busy={state.status === "loading"} onClickCapture={closeOnNavigation}>
            {state.status === "loading" && <p role="status">Laster søk …</p>}
            {state.status === "error" && <div role="alert"><p>Søket er midlertidig utilgjengelig.</p><button type="button" className={styles.retry} onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>Prøv igjen</button></div>}
            {state.status === "ready" && <>
              <p role="status" className={styles.resultCount}>{count === 0 ? "Ingen treff" : `${count} treff`}</p>
              {groups.map((group) => <section key={group.label} aria-label={group.label}>
                <h3 className={styles.resultsHeading}>{group.label}</h3>
                <ul className={styles.resultLinks}>{group.items.map((item) => <li key={item.href}><Link prefetch={false} href={item.href} className={styles.link}>{item.title}</Link></li>)}</ul>
              </section>)}
            </>}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
