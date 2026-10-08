import type { Money } from '@/lib/shopify/product-types';
export function formatMoney(money: Money) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: money.currencyCode, maximumFractionDigits: Number(money.amount) % 1 ? 2 : 0 }).format(Number(money.amount));
}
