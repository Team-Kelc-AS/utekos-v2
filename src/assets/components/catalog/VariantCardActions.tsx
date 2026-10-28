"use client";

import { changeCart, useCartState } from "@/lib/cart/client";

import { BagOutlineIcon } from "@/components/utekos-icons/BagOutlineIcon";
import { Button } from "@/components/ui/button";
import { DunReservationButton } from "@/components/reservations/DunReservationButton";
import type { DunSelection } from "@/lib/reservations/dun";
import { Loader2 } from "lucide-react";
import styles from "./ProductOverview.module.css";
import { useState } from "react";

export function VariantCardActions({
  handle,
  variantId,
  available,
  title,
  reservationSelection,
}: {
  handle: string;
  variantId: string;
  available: boolean;
  title: string;
  reservationSelection?: DunSelection;
}) {
  const unavailableLabel =
    handle === "utekos-dun" ? "Snart tilbake" : "Utsolgt";
  const { pending } = useCartState();
  const [adding, setAdding] = useState(false);
  async function add() {
    setAdding(true);
    try {
      await changeCart({ action: "add", handle, variantId, quantity: 1 });
    } finally {
      setAdding(false);
    }
  }
  return (
    <div
      className={styles.actions}
      data-layout={handle === "utekos-dun" && !available && reservationSelection ? "reservation" : undefined}
    >
      {handle === "utekos-dun" && !available && reservationSelection && (
        <DunReservationButton
          selection={reservationSelection}
          className={styles.buy}
        />
      )}
      <Button
        className={styles.buy}
        disabled={!available || pending}
        aria-busy={adding}
        aria-label={
          available
            ? `Legg ${title} i handlekurv`
            : handle === "utekos-dun"
              ? `${title} – ${unavailableLabel}`
              : `${title} er utsolgt`
        }
        onClick={() => {
          void add();
        }}
      >
        {adding ? (
          <Loader2 className="size-4 motion-safe:animate-spin" />
        ) : (
          <BagOutlineIcon className={styles.bag} size={16} />
        )}
        <span>
          {adding
            ? "Legger til …"
            : available
              ? "Legg i handlekurv"
              : unavailableLabel}
        </span>
      </Button>
    </div>
  );
}
