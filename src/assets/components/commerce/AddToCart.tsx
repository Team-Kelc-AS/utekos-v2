"use client";

import { useState } from "react";
import { changeCart, openCart, useCartState } from "@/lib/cart/client";
import { KlarnaIdentityModal } from "@/components/klarna/KlarnaIdentityModal";

import styles from "./commerce.module.css";
export function AddToCart({
  handle,
  variantId,
  available,
  compact = false,
  label,
  unavailableLabel: customUnavailableLabel,
  showKlarnaModal = false,
}: {
  handle: string;
  variantId: string;
  available: boolean;
  compact?: boolean;
  label?: string;
  unavailableLabel?: string;
  showKlarnaModal?: boolean;
}) {
  const { pending } = useCartState();
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const unavailableLabel =
    customUnavailableLabel ??
    (handle === "utekos-dun" ? "Snart tilbake" : "Utsolgt");
  async function add() {
    if (!showKlarnaModal) {
      await changeCart({ action: "add", handle, variantId, quantity: 1 });
      return;
    }
    const status = fetch('/api/identity/klarna/status', {
      cache: 'no-store', signal: AbortSignal.timeout(12000),
    }).then(async response => {
      if (!response.ok) throw new Error('Klarna status unavailable');
      return response.json() as Promise<{ available: boolean; connected: boolean; originSupported: boolean }>;
    }).catch(() => null);
    const added = await changeCart({ action: "add", handle, variantId, quantity: 1 }, { openOnSuccess: false });
    if (!added) return;
    void import('./CartDrawer');
    const identity = await status;
    if (!identity?.available || identity.connected) {
      openCart();
      return;
    }
    setPreview(!identity.originSupported);
    setModalOpen(true);
  }

  return <>
    <button
      type="button"
      className={styles.primary}
      disabled={!available || pending}
      aria-busy={pending}
      onClick={() => { void add(); }}
    >
      {!available
        ? unavailableLabel
        : pending
          ? "Legger til …"
          : (label ?? (compact ? "Legg til" : "Legg i handlekurven"))}
    </button>
    {showKlarnaModal && <KlarnaIdentityModal open={modalOpen} onOpenChange={(next) => {
      setModalOpen(next);
      if (!next) window.setTimeout(openCart, 0);
    }} preview={preview} />}
  </>;
}
