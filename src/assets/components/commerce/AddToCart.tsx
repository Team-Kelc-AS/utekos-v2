"use client";

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
  const unavailableLabel =
    customUnavailableLabel ??
    (handle === "utekos-dun" ? "Snart tilbake" : "Utsolgt");
  return (
    <button
      type="button"
      className={styles.primary}
      disabled={!available || pending}
      aria-busy={pending}
      onClick={() => {
        void changeCart({ action: "add", handle, variantId, quantity: 1 });
      }}
    >
      {!available
        ? unavailableLabel
        : pending
          ? "Legger til …"
          : (label ?? (compact ? "Legg til" : "Legg i handlekurven"))}
    </button>
  );
}
