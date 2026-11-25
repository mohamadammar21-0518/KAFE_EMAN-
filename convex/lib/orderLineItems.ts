import { readBranchMenu } from "./branchMenu";
import type { MutationCtx } from "../_generated/server";
import { isStaticMenuItemId, normalizeMenuItemId } from "./entityIds";

export type OrderLineInput = {
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderLineStored = {
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
};

export async function normalizeAndValidateOrderLines(
  ctx: MutationCtx,
  items: OrderLineInput[],
  branchSlug: string,
): Promise<OrderLineStored[]> {
  if (!items.length) {
    throw new Error("Cart is empty.");
  }

  const menu = await readBranchMenu(ctx, branchSlug);
  const available = menu.categories.flatMap((group) => group.items);
  return items.map((line) => {
    const id = normalizeMenuItemId(line.menuItemId);
    const matches =
      id && !isStaticMenuItemId(id)
        ? available.filter((item) => item._id === id)
        : available.filter((item) => item.name.toLowerCase() === line.name.trim().toLowerCase());
    if (matches.length !== 1) {
      throw new Error(`${line.name} is unavailable at this branch. Refresh your cart and try again.`);
    }
    const item = matches[0];
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`Invalid quantity for ${item.name}.`);
    }
    if (line.price !== item.price) {
      throw new Error(
        `The price of ${item.name} has changed. Remove it and add it again to see the current price.`,
      );
    }
    // Preserve legacy cart identifiers for free-drink selection during this checkout.
    return { menuItemId: id ?? item._id, name: item.name, price: item.price, quantity: line.quantity };
  });
}
