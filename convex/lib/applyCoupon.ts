import type { OrderLineStored } from "./orderLineItems";

export type CouponApplyResult = {
  discountAmount: number;
  freeItemName: string;
  freeItemMenuItemId?: string;
};

/**
 * One free drink: deducts the price of a single unit from the cart subtotal.
 * Picks the requested line, otherwise the highest unit price.
 */
export function computeFreeDrinkDiscount(
  items: OrderLineStored[],
  freeItemMenuItemId?: string,
): CouponApplyResult {
  if (!items.length) {
    throw new Error("Add at least one drink to use this coupon.");
  }

  let target = freeItemMenuItemId
    ? items.find((i) => i.menuItemId === freeItemMenuItemId)
    : undefined;

  if (!target) {
    target = items.reduce((best, item) => (item.price > best.price ? item : best));
  }

  const discountAmount = Math.round(target.price * 100) / 100;
  return {
    discountAmount,
    freeItemName: target.name,
    freeItemMenuItemId: target.menuItemId,
  };
}
