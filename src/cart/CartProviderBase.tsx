import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/cart/CartContext";
import { normalizeCartLines, normalizeMenuItemId } from "@/lib/entityIds";

export type { CartLine };

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (item: {
    menuItemId: string;
    name: string;
    price: number;
    currency?: string;
  }) => boolean;
  removeItem: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => boolean;
  closeCart: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kafeeman.cart";

type CartItemInput = {
  menuItemId: string;
  name: string;
  price: number;
  currency?: string;
};

export function CartProviderBase({
  children,
  requireUser,
  onAuthBlocked,
}: {
  children: ReactNode;
  requireUser: () => boolean;
  /** Called when add-to-cart is blocked (e.g. guest) — show Clerk sign-in. */
  onAuthBlocked?: (item: CartItemInput) => void;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        setLines(normalizeCartLines(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines]);

  const addItem = useCallback(
    (item: CartItemInput) => {
      if (!requireUser()) {
        onAuthBlocked?.(item);
        return false;
      }
      const menuItemId = normalizeMenuItemId(item.menuItemId);
      if (!menuItemId) return false;

      setLines((prev) => {
        const existing = prev.find((l) => l.menuItemId === menuItemId);
        if (existing) {
          return prev.map((l) =>
            l.menuItemId === menuItemId ? { ...l, quantity: l.quantity + 1 } : l,
          );
        }
        return [...prev, { ...item, menuItemId, quantity: 1 }];
      });
      setIsOpen(true);
      return true;
    },
    [requireUser, onAuthBlocked],
  );

  const openCart = useCallback(() => {
    if (!requireUser()) return false;
    setIsOpen(true);
    return true;
  }, [requireUser]);

  const removeItem = useCallback((menuItemId: string) => {
    const key = normalizeMenuItemId(menuItemId) ?? menuItemId;
    setLines((prev) => prev.filter((l) => l.menuItemId !== key));
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    const key = normalizeMenuItemId(menuItemId) ?? menuItemId;
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.menuItemId !== key));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.menuItemId === key ? { ...l, quantity } : l)),
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      isOpen,
      openCart,
      closeCart: () => setIsOpen(false),
    }),
    [lines, itemCount, subtotal, addItem, removeItem, setQuantity, clearCart, isOpen, openCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartFromBase() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
