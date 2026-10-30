"use client";

import { useKlarnaPreferences } from "@/lib/klarna/preferences-client";
import {
  KlarnaCartExpressCheckout,
  KlarnaProductExpressCheckout,
} from "./KlarnaProductExpressCheckout";
export function KlarnaConnectedProductExpress({
  handle,
  variantId,
}: {
  handle: string;
  variantId: string;
}) {
  const { connected } = useKlarnaPreferences();
  return connected ? (
    <div data-klarna-connected-express>
      <KlarnaProductExpressCheckout
        key={variantId}
        handle={handle}
        variantId={variantId}
      />
    </div>
  ) : null;
}
export function KlarnaConnectedCartExpress({
  disabled,
}: {
  disabled: boolean;
}) {
  const { connected } = useKlarnaPreferences();
  return connected ? <KlarnaCartExpressCheckout disabled={disabled} /> : null;
}
