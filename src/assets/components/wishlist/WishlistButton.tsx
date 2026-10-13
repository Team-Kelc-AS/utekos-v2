"use client";

import {
  addWishlistItem,
  hasWishlistVariant,
  removeWishlistItem,
} from "@/lib/wishlist/wishlistStore";
import { lazy, Suspense, useState, useSyncExternalStore } from "react";

import { HeartIcon } from "@/components/utekos-icons/HeartIcon";
import { HeartOutlineIcon } from "@/components/utekos-icons/HeartOutlineIcon";
import { emitStorefrontAction } from "@/lib/tracking/browser-events";
import { Toggle } from "@/components/ui/toggle";
import styles from "@/components/commerce/commerce.module.css";
import wishlistStyles from "./WishlistButton.module.css";
import WishlistHoverCard from "./WishlistHoverCard";
const WishlistDialog = lazy(() => import("./WishlistDialog"));

const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("utekos:wishlist", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("utekos:wishlist", callback);
  };
};
export function WishlistButton({
  productId,
  handle,
  variantId,
  title,
  returnTo,
  className = "",
  showLabel = false,
  showHoverCard = false,
}: {
  productId: string;
  handle: string;
  variantId: string;
  title: string;
  returnTo: string;
  className?: string;
  showLabel?: boolean;
  showHoverCard?: boolean;
}) {
  const wished = useSyncExternalStore(
    subscribe,
    () => hasWishlistVariant(variantId),
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const button = (
    <Toggle
      type="button"
      size="touch"
      className={`${styles.iconButton} ${showHoverCard ? wishlistStyles.cardWishlist : ""} ${className}`}
      aria-label={`Ønskeliste: ${title}`}
      pressed={wished}
      aria-haspopup={wished ? undefined : "dialog"}
      onPressedChange={(pressed, details) => {
        if (!pressed) {
          if (!removeWishlistItem({ variantId })) {
            details.cancel();
            setError("Kunne ikke lagre ønskelisten på denne enheten.");
            return;
          }
          setError("");
          window.dispatchEvent(new Event("utekos:wishlist"));
          setOpen(false);
          return;
        }
        const saved = addWishlistItem({
          productId,
          productHandle: handle,
          variantId,
        });
        if (!saved) {
          details.cancel();
          setError("Kunne ikke lagre ønskelisten på denne enheten.");
          return;
        }
        if (saved.added) {
          const target = details.event.target;
          const raw = (target instanceof Element ? target : null)
            ?.closest("[data-tracking-commerce]")
            ?.getAttribute("data-tracking-commerce");
          if (raw) {
            try {
              emitStorefrontAction("utekos:wishlist-added", {
                commerce: JSON.parse(raw),
                mutationId: saved.mutationId,
                eventTime: saved.entry.addedAt,
              });
            } catch {}
          }
        }
        setError("");
        window.dispatchEvent(new Event("utekos:wishlist"));
        setOpen(true);
      }}
    >
      {showLabel && <span className="text-xs font-medium">Ønskeliste</span>}
      {wished ? (
        <HeartIcon tone="orange" />
      ) : showHoverCard ? (
        <span className={wishlistStyles.heart}>
          <HeartOutlineIcon tone="orange" className={wishlistStyles.outline} />
          <HeartIcon tone="orange" className={wishlistStyles.filled} />
        </span>
      ) : (
        <HeartOutlineIcon tone="orange" />
      )}
    </Toggle>
  );
  return (
    <div>
      {showHoverCard ? (
        <WishlistHoverCard
          button={button}
          dialogOpen={open}
          label={wished ? "Fjern fra ønskeliste" : "Legg i ønskeliste"}
        />
      ) : button}
      {error && <p role="alert">{error}</p>}
      {open && (
        <Suspense fallback={null}>
          <WishlistDialog returnTo={returnTo} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
