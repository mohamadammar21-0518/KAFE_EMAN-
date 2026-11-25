/** Keep in sync with convex/lib/loyalty.ts */

export const POINTS_PER_SUCCESSFUL_ORDER = 10;
export const POINTS_REDEEM_THRESHOLD = 40;
export const POINTS_WELCOME_BONUS = 20;

/** @deprecated Use POINTS_PER_SUCCESSFUL_ORDER */
export const POINTS_FIRST_ORDER = POINTS_PER_SUCCESSFUL_ORDER;
/** @deprecated Use POINTS_PER_SUCCESSFUL_ORDER */
export const POINTS_REPEAT_ORDER = POINTS_PER_SUCCESSFUL_ORDER;

export type PaymentMethod = "card" | "cash" | "other";

export function describePointsEarned(orderIndex?: number): string;
export function describePointsEarned() {
  return `+${POINTS_PER_SUCCESSFUL_ORDER} reward points`;
}

export function paymentMethodLabel(method: PaymentMethod | string | undefined) {
  switch (method) {
    case "card":
      return "Card";
    case "cash":
      return "Cash";
    case "other":
      return "Other";
    default:
      return "—";
  }
}

export function couponTypeLabel(type: string | undefined) {
  if (type === "free_order") return "Free order";
  return "Free drink";
}

/** Client-side preview of one free drink on a cart subtotal. */
export function previewFreeDrinkDiscount(
  lines: Array<{ menuItemId: string; name: string; price: number; quantity: number }>,
  freeItemMenuItemId?: string,
) {
  if (!lines.length) return { discount: 0, freeItemName: "" };
  const target =
    lines.find((l) => l.menuItemId === freeItemMenuItemId) ??
    lines.reduce((best, line) => (line.price > best.price ? line : best));
  return {
    discount: target.price,
    freeItemName: target.name,
  };
}
