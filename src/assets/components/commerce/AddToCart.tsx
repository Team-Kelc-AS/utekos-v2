"use client";

import { useState } from "react";
import { changeCart, useCartState } from "@/lib/cart/client";

import styles from "./commerce.module.css";
export function AddToCart({
  handle,
  variantId,
  available,
  compact = false,
  label,
  unavailableLabel: customUnavailableLabel,
}: {
  handle: string;
  variantId: string;
  available: boolean;
  compact?: boolean;
  label?: string;
  unavailableLabel?: string;
}) {
  const { pending } = useCartState();
  const [adding, setAdding] = useState(false);
  const unavailableLabel =
    customUnavailableLabel ??
    (handle === "utekos-dun" ? "Snart tilbake" : "Utsolgt");
  async function add() {
    if (pending || adding) return;
    setAdding(true);
    try {
      await changeCart({ action: "add", handle, variantId, quantity: 1 });
    } finally {
      setAdding(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.primary}
      disabled={!available || pending || adding}
      aria-busy={adding}
      onClick={() => { void add(); }}
    >
      {!available
        ? unavailableLabel
        : adding
          ? "Legger til …"
          : (label ?? (compact ? "Legg til" : "Legg i handlekurven"))}
    </button>
  );
}
