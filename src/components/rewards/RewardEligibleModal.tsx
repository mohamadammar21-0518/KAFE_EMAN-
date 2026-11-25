import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Sparkles, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useCart } from "@/cart/CartContext";
import { POINTS_REDEEM_THRESHOLD } from "@/lib/loyalty";
import { hasClerk, hasConvex } from "@/providers/AppProviders";

const DISMISS_KEY = "kafeeman.rewardModal.dismissedAt";

export function RewardEligibleModal() {
  const { isSignedIn } = useAuth();
  const profile = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const convertPoints = useMutation(api.users.convertPointsToCoupon);
  const { openCart } = useCart();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.needsOnboarding) return;

    const canConvert = profile.canConvertPointsToCoupon;
    const hasCoupons = (profile.activeCoupons ?? 0) > 0;
    if (!canConvert && !hasCoupons) return;

    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const dayMs = 24 * 60 * 60 * 1000;
    if (Date.now() - dismissed < dayMs) return;

    setOpen(true);
  }, [profile]);

  if (!hasClerk() || !hasConvex()) return null;

  async function handleConvert() {
    setBusy(true);
    setError(null);
    try {
      const result = await convertPoints({});
      setCreatedCode(result.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not convert points.");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  }

  function goToCheckout() {
    dismiss();
    openCart();
  }

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[95] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          aria-label="Close reward notice"
          onClick={dismiss}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reward-modal-title"
          className="relative z-10 w-full max-w-md rounded-2xl border border-brand-green/20 bg-white p-6 shadow-xl"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-cream"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/12 text-brand-green">
            <Gift className="h-6 w-6" />
          </div>

          <h2 id="reward-modal-title" className="mt-4 text-lg font-semibold text-coffee-dark">
            {createdCode
              ? "Your coupon is ready"
              : profile?.canConvertPointsToCoupon
                ? "You earned a reward!"
                : "Apply your coupon at checkout"}
          </h2>

          {createdCode ? (
            <p className="mt-2 text-sm text-muted">
              Use code{" "}
              <span className="font-mono font-semibold text-primary">{createdCode}</span> on your
              next order for one free drink.
            </p>
          ) : profile?.canConvertPointsToCoupon ? (
            <p className="mt-2 text-sm text-muted">
              You have {profile.points} points. Convert {POINTS_REDEEM_THRESHOLD} points into a
              free-drink coupon code, or keep earning for more rewards.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              You have {profile?.activeCoupons ?? 0} active coupon
              {(profile?.activeCoupons ?? 0) === 1 ? "" : "s"}. Select one in the cart to get one
              drink free.
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {profile?.canConvertPointsToCoupon && !createdCode && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleConvert()}
                className="btn-ref-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                {busy ? "Converting…" : "Convert to coupon code"}
              </button>
            )}
            <button
              type="button"
              onClick={goToCheckout}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-primary/30 bg-primary/8 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/12"
            >
              {createdCode ? "Open cart & order" : "Apply at checkout"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
