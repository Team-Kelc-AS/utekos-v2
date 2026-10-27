import type { Money } from '@/lib/shopify/product-types';
export function formatMoney(money: Money, fractionDigits = Number(money.amount) % 1 ? 2 : 0) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: money.currencyCode, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(Number(money.amount));
}
