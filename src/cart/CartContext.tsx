import type { ReactNode } from "react";
import { hasClerk } from "@/providers/AppProviders";
import { CartProviderAuthed } from "@/cart/CartProviderAuthed";
import { CartProviderBase } from "@/cart/CartProviderBase";

export type CartLine = {
  /** Convex `menuItems._id` or `static:menu:…` when using offline fallback data. */
  menuItemId: string;
  name: string;
  price: number;
  currency?: string;
  quantity: number;
};

export { useCartFromBase as useCart } from "@/cart/CartProviderBase";

export function CartProvider({ children }: { children: ReactNode }) {
  if (hasClerk()) {
    return <CartProviderAuthed>{children}</CartProviderAuthed>;
  }

  return (
    <CartProviderBase requireUser={() => true}>{children}</CartProviderBase>
  );
}
