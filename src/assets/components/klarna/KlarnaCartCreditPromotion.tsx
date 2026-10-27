"use client";

import { useEffect } from "react";
import { KlarnaOnSiteMessagingScript } from "@/app/(storefront)/handlehjelp/klarna/components/KlarnaOnSiteMessagingScript";
import type { Money } from "@/lib/shopify/product-types";

function refreshPlacement() {
  window.Klarna?.OnsiteMessaging?.refresh();
}

export function KlarnaCartCreditPromotion({ total }: { total: Money }) {
  const amount = Number(total.amount);
  const purchaseAmount = total.currencyCode === "NOK" && Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100)
    : undefined;

  useEffect(() => { refreshPlacement(); }, [purchaseAmount]);

  if (purchaseAmount === undefined) return null;

  return (
    <div className="mt-2 min-h-10">
      <KlarnaOnSiteMessagingScript strategy="lazyOnload" onReady={refreshPlacement} />
      <klarna-placement
        id="klarna-credit-promotion-cart"
        data-key="credit-promotion-auto-size"
        data-locale="nb-NO"
        data-theme="dark"
        data-purchase-amount={purchaseAmount}
      />
    </div>
  );
}
