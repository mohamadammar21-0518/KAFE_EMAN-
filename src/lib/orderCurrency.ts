import { DEFAULT_CURRENCY } from "@/lib/currencies";

export function orderCurrency(order: { currency?: string }) {
  return (order.currency ?? DEFAULT_CURRENCY).toUpperCase();
}
