"use client";

import { useRef, useState, type ReactNode } from "react";
import type { CartResult } from "@/lib/cart/types";
import type { ComfyBuyNowSize } from "@/lib/cart/comfyBuyNow";
import {
  persistCheckoutPreparation,
  reportCartMutation,
} from "@/lib/cart/tracking";

export function ComfyrobeBuyNowButton({
  size,
  className,
  children,
}: {
  size: ComfyBuyNowSize;
  className: string;
  children: ReactNode;
}) {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/cart/comfy-buy-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size }),
      });
      const result = (await response.json()) as CartResult & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Kassen kunne ikke åpnes. Prøv igjen.");
      }
      if (!result.cart?.checkout || !result.cart.commerce) {
        throw new Error("Kassen kunne ikke bekreftes. Prøv igjen.");
      }
      reportCartMutation(result);
      const { checkoutUrl } = await persistCheckoutPreparation(
        result.cart,
        "shopify",
        size,
      );
      window.location.assign(checkoutUrl);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Kassen kunne ikke åpnes. Prøv igjen.",
      );
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        aria-busy={pending}
        data-track="ComfyrobeBuyNow"
        onClick={() => void startCheckout()}
      >
        {pending ? "Åpner kassen …" : children}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-current">{error}</p>}
    </>
  );
}
