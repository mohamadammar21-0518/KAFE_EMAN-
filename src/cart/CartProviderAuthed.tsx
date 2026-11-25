import { useAuth } from "@clerk/react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useAuthModal } from "@/auth/AuthModalContext";
import { CartProviderBase, useCartFromBase, type CartLine } from "@/cart/CartProviderBase";

type PendingCartItem = {
  menuItemId: string;
  name: string;
  price: number;
  currency?: string;
};

function FlushPendingCartItem({
  pendingRef,
  isLoaded,
  isSignedIn,
}: {
  pendingRef: React.MutableRefObject<PendingCartItem | null>;
  isLoaded: boolean;
  isSignedIn: boolean;
}) {
  const { addItem } = useCartFromBase();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !pendingRef.current) return;
    const item = pendingRef.current;
    pendingRef.current = null;
    addItem(item);
  }, [isLoaded, isSignedIn, addItem, pendingRef]);

  return null;
}

/** Client cart — guests must sign in with Clerk before adding items. */
export function CartProviderAuthed({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useAuthModal();
  const pendingRef = useRef<PendingCartItem | null>(null);

  const requireUser = useCallback(() => {
    if (!isLoaded) return false;
    return Boolean(isSignedIn);
  }, [isLoaded, isSignedIn]);

  const onAuthBlocked = useCallback(
    (item: PendingCartItem) => {
      pendingRef.current = item;
      openSignIn("cart");
    },
    [openSignIn],
  );

  return (
    <CartProviderBase requireUser={requireUser} onAuthBlocked={onAuthBlocked}>
      <FlushPendingCartItem
        pendingRef={pendingRef}
        isLoaded={isLoaded}
        isSignedIn={Boolean(isSignedIn)}
      />
      {children}
    </CartProviderBase>
  );
}

export type { CartLine };
