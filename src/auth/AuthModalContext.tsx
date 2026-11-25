import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthModalReason = "cart" | "account" | "general";

const DEFAULT_RETURN_PATH: Record<AuthModalReason, string | null> = {
  account: "/account",
  cart: null,
  general: null,
};

type AuthModalContextValue = {
  isOpen: boolean;
  reason: AuthModalReason;
  returnPath: string | null;
  openSignIn: (reason?: AuthModalReason, returnPath?: string | null) => void;
  closeSignIn: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

const REASON_COPY: Record<AuthModalReason, { title: string; subtitle: string }> = {
  cart: {
    title: "Log in to continue",
    subtitle:
      "Sign in with Google or email to add items to your cart, checkout, and track orders.",
  },
  account: {
    title: "Your Kafe Eman account",
    subtitle: "Track orders, earn points, and manage your profile.",
  },
  general: {
    title: "Welcome back",
    subtitle: "Sign in to continue your café experience.",
  },
};

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

export function useAuthModalCopy() {
  const { reason } = useAuthModal();
  return REASON_COPY[reason];
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<AuthModalReason>("general");
  const [returnPath, setReturnPath] = useState<string | null>(null);

  const openSignIn = useCallback(
    (nextReason: AuthModalReason = "general", nextReturnPath?: string | null) => {
      setReason(nextReason);
      setReturnPath(
        nextReturnPath === undefined ? DEFAULT_RETURN_PATH[nextReason] : nextReturnPath,
      );
      setIsOpen(true);
    },
    [],
  );

  const closeSignIn = useCallback(() => {
    setIsOpen(false);
    setReturnPath(null);
  }, []);

  const value = useMemo(
    () => ({ isOpen, reason, returnPath, openSignIn, closeSignIn }),
    [isOpen, reason, returnPath, openSignIn, closeSignIn],
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}
