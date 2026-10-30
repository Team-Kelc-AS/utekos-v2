"use client";

import { checkout } from "@/lib/cart/client";
import type { Cart } from "@/lib/cart/types";
import { formatMoney } from "@/lib/products/money";
import { KlarnaCartCreditPromotion } from "@/assets/components/klarna/KlarnaCartCreditPromotion";
import { KlarnaConnectedCartExpress } from "@/components/klarna/KlarnaConnectedExpress";
import styles from "./commerce.module.css";

export default function CartFooter({ cart, pending }: { cart: Cart; pending: boolean }) {
  if (!cart.lines.length) return null;

  const hasUnavailableLines = cart.lines.some((line) => !line.available);
  const subtotal = formatMoney(cart.subtotal, 2);
  const disabledReason = hasUnavailableLines
    ? "Fjern utsolgte varer fra handlekurven før du går til kassen."
    : undefined;

  return (
    <div className={styles.cartFooter} data-slot="drawer-footer">
      {hasUnavailableLines && (
        <p role="alert" className={styles.checkoutAlert}>
          En eller flere varer i handlekurven er ikke lenger tilgjengelige. Fjern dem før du går til kassen.
        </p>
      )}
      <div className={styles.cartTotal}>
        <span>Delsum</span>
        <span>{subtotal}</span>
      </div>
      <KlarnaCartCreditPromotion total={cart.total} />
      <div className={styles.checkoutActions}>
        <button
          type="button"
          className={styles.checkoutButton}
          disabled={pending || hasUnavailableLines}
          aria-label={disabledReason ?? (pending ? "Behandler bestilling..." : `Gå til kassen med subtotal ${subtotal}`)}
          onClick={() => { void checkout(); }}
        >
          {disabledReason ?? (pending ? "Behandler..." : "Gå til kassen")}
        </button>
        {!cart.requiresStandardCheckout && <KlarnaConnectedCartExpress disabled={hasUnavailableLines || pending} />}
      </div>
    </div>
  );
}
