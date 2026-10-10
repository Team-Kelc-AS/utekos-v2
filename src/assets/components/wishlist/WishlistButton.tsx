"use client";

import {
  addWishlistItem,
  hasWishlistVariant,
} from "@/lib/wishlist/wishlistStore";
import { lazy, Suspense, useState, useSyncExternalStore } from "react";

import { HeartIcon } from "@/components/utekos-icons/HeartIcon";
import { HeartOutlineIcon } from "@/components/utekos-icons/HeartOutlineIcon";
import { emitStorefrontAction } from "@/lib/tracking/browser-events";
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
    <button
      type="button"
      className={`${styles.iconButton} ${showHoverCard ? wishlistStyles.cardWishlist : ""} ${className}`}
      aria-label={`${wished ? "Åpne ønskeliste for" : "Legg til i ønskelisten:"} ${title}`}
      aria-pressed={wished}
      aria-haspopup="dialog"
      onClick={(event) => {
        const saved = addWishlistItem({
          productId,
          productHandle: handle,
          variantId,
        });
        if (!saved) {
          setError("Kunne ikke lagre ønskelisten på denne enheten.");
          return;
        }
        if (saved.added) {
          const raw = event.currentTarget
            .closest("[data-tracking-commerce]")
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
    </button>
  );
  return (
    <div>
      {showHoverCard ? <WishlistHoverCard button={button} dialogOpen={open} /> : button}
      {error && <p role="alert">{error}</p>}
      {open && (
        <Suspense fallback={null}>
          <WishlistDialog returnTo={returnTo} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
