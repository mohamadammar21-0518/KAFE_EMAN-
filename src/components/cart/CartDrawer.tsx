import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useAuth, useUser } from "@clerk/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuthModal } from "@/auth/AuthModalContext";
import { useOnboarding } from "@/auth/useOnboarding";
import { useCart } from "@/cart/CartContext";
import { CardPaymentModal, type CardPaymentResult } from "@/components/cart/CardPaymentModal";
import { FormSuccessModal } from "@/components/ui/FormSuccessModal";
import { useBranch } from "@/branch/BranchContext";
import { useBranchCurrency } from "@/branch/useBranchCurrency";
import { formatPrice } from "@/data/content";
import {
  POINTS_REDEEM_THRESHOLD,
  paymentMethodLabel,
  previewFreeDrinkDiscount,
  type PaymentMethod,
} from "@/lib/loyalty";
import { isSuspendedNow, suspensionMessage } from "@/lib/userAccess";
import { cn } from "@/lib/utils";
import { hasClerk, hasConvex } from "@/providers/AppProviders";

function customerFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function buildOrderSuccessMessage(firstName: string, orderRef: string | null): string {
  const reference = orderRef ? ` (${orderRef})` : "";
  return `Thank you, ${firstName}! We have received your order${reference} and will proceed with it shortly — please wait for our response. Thanks for your patience.`;
}

function CartDrawerInner() {
  const {
    lines,
    itemCount,
    subtotal,
    isOpen,
    closeCart,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { branchId } = useBranch();
  const branchCurrency = useBranchCurrency();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { openSignIn } = useAuthModal();
  const {
    openOnboarding,
    prepareCheckoutAfterAuth,
    resumeCheckout,
    clearResumeCheckout,
  } = useOnboarding();
  const profile = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const myCoupons = useQuery(api.users.myCoupons, isSignedIn ? {} : "skip");
  const createOrder = useMutation(api.orders.create);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentNote, setPaymentNote] = useState("");
  const [selectedCouponId, setSelectedCouponId] = useState<Id<"coupons"> | "">("");
  const [freeItemMenuItemId, setFreeItemMenuItemId] = useState("");
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCustomerName, setSuccessCustomerName] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function resetOrderSuccess() {
    setStatus("idle");
    setShowSuccessModal(false);
    setSuccessCustomerName("");
    setOrderNumber(null);
    setPointsEarned(0);
  }

  function handleCloseCart() {
    if (status === "success") {
      resetOrderSuccess();
    }
    closeCart();
  }

  const successFirstName = customerFirstName(successCustomerName);
  const orderSuccessMessage = buildOrderSuccessMessage(successFirstName, orderNumber);

  const activeCoupons = useMemo(
    () => myCoupons?.filter((c) => !c.redeemed) ?? [],
    [myCoupons],
  );

  const selectedCoupon = activeCoupons.find((c) => c._id === selectedCouponId);
  const accountSuspended =
    isSignedIn && profile && isSuspendedNow(profile) && profile.suspendedUntil != null;

  const pricing = useMemo(() => {
    if (!selectedCoupon) {
      return { total: subtotal, discount: 0, freeItemName: "" };
    }
    if (selectedCoupon.type === "free_order") {
      return { total: 0, discount: subtotal, freeItemName: "Entire order" };
    }
    const preview = previewFreeDrinkDiscount(
      lines,
      freeItemMenuItemId || undefined,
    );
    return {
      total: Math.max(0, subtotal - preview.discount),
      discount: preview.discount,
      freeItemName: preview.freeItemName,
    };
  }, [selectedCoupon, subtotal, lines, freeItemMenuItemId]);

  const cartCurrency = branchCurrency;
  const totalLabel = formatPrice(pricing.total, cartCurrency);

  useEffect(() => {
    if (!user && !profile) return;
    setName(
      profile?.firstName
        ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
        : user?.fullName ?? "",
    );
    setEmail(profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "");
    setPhone(profile?.phone ?? user?.primaryPhoneNumber?.phoneNumber ?? "");
  }, [user, profile]);

  useEffect(() => {
    if (!selectedCouponId && activeCoupons[0]) {
      setSelectedCouponId(activeCoupons[0]._id);
    }
  }, [activeCoupons, selectedCouponId]);

  useEffect(() => {
    if (lines[0] && !freeItemMenuItemId) {
      setFreeItemMenuItemId(lines[0].menuItemId);
    }
  }, [lines, freeItemMenuItemId]);

  function handleCheckoutClick() {
    if (!isSignedIn) {
      prepareCheckoutAfterAuth();
      openSignIn("cart");
      return;
    }
    if (profile?.needsOnboarding) {
      openOnboarding("cart");
      setError("Please complete your profile to place your order.");
      return;
    }
    if (paymentMethod === "card") {
      setCardModalOpen(true);
      return;
    }
    void submitOrder();
  }

  useEffect(() => {
    if (!resumeCheckout || !isOpen || !isSignedIn || profile === undefined) return;
    if (!profile || profile.needsOnboarding) return;
    clearResumeCheckout();
    if (paymentMethod === "card") {
      setCardModalOpen(true);
    } else {
      void submitOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeCheckout, isOpen, isSignedIn, profile?.needsOnboarding, profile, clearResumeCheckout]);

  async function submitOrder(card?: CardPaymentResult) {
    setStatus("loading");
    setError(null);
    try {
      const result = await createOrder({
        branchSlug: branchId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
        })),
        notes: notes || undefined,
        couponId: selectedCouponId || undefined,
        freeItemMenuItemId: selectedCoupon ? freeItemMenuItemId || undefined : undefined,
        paymentMethod,
        paymentMethodNote: paymentMethod === "other" ? paymentNote : undefined,
        cardLast4: card?.cardLast4,
        cardBrand: card?.cardBrand,
      });
      setSuccessCustomerName(name.trim());
      setOrderNumber(result.orderNumber);
      setPointsEarned(result.pointsEarned);
      clearCart();
      setSelectedCouponId("");
      setCardModalOpen(false);
      setStatus("success");
      setShowSuccessModal(true);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not place order. Try again.");
    }
  }

  return (
    <>
      <CardPaymentModal
        open={cardModalOpen}
        totalLabel={totalLabel}
        onClose={() => setCardModalOpen(false)}
        onSubmit={(card) => {
          setCardModalOpen(false);
          void submitOrder(card);
        }}
      />

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCart}
            />
            <motion.aside
              className="fixed right-0 top-0 z-[91] flex h-dvh w-full max-w-md flex-col border-l-2 border-outline/50 bg-surface shadow-[-8px_0_40px_rgba(21,13,7,0.12)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div className="flex items-center justify-between border-b border-outline/40 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/12 text-brand-green">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-coffee-dark">Your order</p>
                    <p className="text-xs text-muted">{itemCount} item(s)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCart}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline/50 bg-white text-coffee-dark transition hover:bg-cream"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {status === "success" ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <p className="text-headline-md text-coffee-dark">
                    Congratulations{successCustomerName ? `, ${successFirstName}` : ""}!
                  </p>

                  {!showSuccessModal && (
                    <p className="mt-4 w-full rounded-xl border border-brand-green/25 bg-brand-green/8 px-4 py-3 text-body-md text-coffee-dark">
                      Thank you, {successFirstName}! Your order was submitted successfully. We will
                      proceed with your order soon — please wait for our response. Thanks for your
                      patience.
                    </p>
                  )}

                  <p className="mt-3 text-sm text-muted">
                    {paymentMethod === "other"
                      ? "We received your order. Payment will be confirmed by the café."
                      : paymentMethod === "cash"
                        ? "Pay with cash when you pick up your order."
                        : "Your order was placed with the demo card."}
                  </p>
                  {orderNumber && (
                    <p className="mt-4 rounded-full border border-outline/40 bg-white px-4 py-2 text-sm font-medium text-coffee-dark">
                      {orderNumber}
                    </p>
                  )}
                  {pointsEarned > 0 && (
                    <p className="mt-3 text-sm font-medium text-brand-green">
                      You earned +{pointsEarned} reward points!
                    </p>
                  )}
                  <a
                    href="/account"
                    onClick={handleCloseCart}
                    className="btn-ref-primary mt-6 inline-flex rounded-full px-6 py-3.5 text-sm font-medium"
                  >
                    View order history
                  </a>
                  <button
                    type="button"
                    className="mt-3 text-sm text-muted underline"
                    onClick={handleCloseCart}
                  >
                    Continue browsing
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {lines.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted">
                        Your cart is empty. Add items from the menu.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {lines.map((line) => (
                          <li
                            key={line.menuItemId}
                            className="rounded-2xl border border-outline/40 bg-white/70 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-coffee-dark">
                                  {line.name}
                                </p>
                                <p className="text-xs text-muted">
                                  {formatPrice(line.price, cartCurrency)} each
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-coffee-dark">
                                {formatPrice(line.price * line.quantity, cartCurrency)}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="inline-flex items-center gap-1 rounded-full border border-outline/40 bg-cream/50 p-1">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"
                                  onClick={() =>
                                    setQuantity(line.menuItemId, line.quantity - 1)
                                  }
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-[2ch] text-center text-sm font-medium tabular-nums">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"
                                  onClick={() =>
                                    setQuantity(line.menuItemId, line.quantity + 1)
                                  }
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600"
                                onClick={() => removeItem(line.menuItemId)}
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {lines.length > 0 && (
                      <div className="mt-6 space-y-4 border-t border-outline/40 pt-6">
                        <p className="text-label-sm text-on-surface-variant">Your details</p>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name"
                          className="w-full rounded-xl border border-outline/40 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-green/40"
                          required
                        />
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          type="email"
                          className="w-full rounded-xl border border-outline/40 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-green/40"
                          required
                        />
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone (optional)"
                          className="w-full rounded-xl border border-outline/40 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-green/40"
                        />
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notes (optional)"
                          rows={2}
                          className="w-full resize-none rounded-xl border border-outline/40 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-green/40"
                        />

                        <div>
                          <p className="text-label-sm text-on-surface-variant">Payment method</p>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {(["card", "cash", "other"] as const).map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={cn(
                                  "rounded-xl border px-2 py-2.5 text-xs font-semibold transition",
                                  paymentMethod === method
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-outline/40 bg-white/80 text-muted hover:border-primary/25",
                                )}
                              >
                                {paymentMethodLabel(method)}
                              </button>
                            ))}
                          </div>
                          {paymentMethod === "other" && (
                            <input
                              value={paymentNote}
                              onChange={(e) => setPaymentNote(e.target.value)}
                              placeholder="e.g. Bank transfer, e-wallet…"
                              className="mt-2 w-full rounded-xl border border-outline/40 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-green/40"
                            />
                          )}
                        </div>

                        {(activeCoupons.length > 0 ||
                          profile?.canConvertPointsToCoupon) && (
                          <div className="rounded-xl border border-brand-green/25 bg-brand-green/8 p-4">
                            <p className="text-sm font-semibold text-coffee-dark">
                              Rewards & coupons
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {POINTS_REDEEM_THRESHOLD} points = one free drink. Apply a coupon
                              below — one drink is free, the rest stays full price.
                            </p>

                            {activeCoupons.length > 0 ? (
                              <ul className="mt-3 space-y-2">
                                <li>
                                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <input
                                      type="radio"
                                      name="coupon"
                                      checked={!selectedCouponId}
                                      onChange={() => setSelectedCouponId("")}
                                    />
                                    No coupon
                                  </label>
                                </li>
                                {activeCoupons.map((c) => (
                                  <li key={c._id}>
                                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-outline/30 bg-white/80 px-3 py-2 text-sm">
                                      <input
                                        type="radio"
                                        name="coupon"
                                        checked={selectedCouponId === c._id}
                                        onChange={() => setSelectedCouponId(c._id)}
                                        className="mt-1"
                                      />
                                      <span>
                                        <span className="font-mono font-semibold text-primary">
                                          {c.code}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted">
                                          {c.type === "free_order"
                                            ? "Free entire order"
                                            : "One free drink"}
                                        </span>
                                      </span>
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-xs text-muted">
                                No active coupons — convert {POINTS_REDEEM_THRESHOLD} points from
                                your account page.
                              </p>
                            )}

                            {selectedCoupon && selectedCoupon.type !== "free_order" && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-on-surface-variant">
                                  Free drink applies to
                                </p>
                                <select
                                  value={freeItemMenuItemId}
                                  onChange={(e) => setFreeItemMenuItemId(e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-outline/40 bg-white px-3 py-2 text-sm"
                                >
                                  {lines.map((l) => (
                                    <option key={l.menuItemId} value={l.menuItemId}>
                                      {l.name} ({formatPrice(l.price, cartCurrency)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {pricing.discount > 0 && (
                              <p className="mt-3 text-xs font-medium text-brand-green">
                                −{formatPrice(pricing.discount, cartCurrency)}
                                {pricing.freeItemName
                                  ? ` off (${pricing.freeItemName})`
                                  : ""}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-outline/40 p-5">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted">Subtotal</span>
                      <span className="text-coffee-dark">
                        {formatPrice(subtotal, cartCurrency)}
                      </span>
                    </div>
                    {pricing.discount > 0 && (
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted">Coupon</span>
                        <span className="text-brand-green">
                          −{formatPrice(pricing.discount, cartCurrency)}
                        </span>
                      </div>
                    )}
                    <div className="mb-4 flex items-center justify-between text-sm font-semibold">
                      <span className="text-coffee-dark">Total</span>
                      <span className="text-coffee-dark">{totalLabel}</span>
                    </div>
                    {accountSuspended && (
                      <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {suspensionMessage(profile.suspendedUntil!)}
                      </p>
                    )}
                    {error && (
                      <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                      </p>
                    )}
                    {!isSignedIn && lines.length > 0 && (
                      <p className="mb-3 text-center text-xs text-muted">
                        Log in to continue — your cart is saved on this device.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={
                        lines.length === 0 ||
                        status === "loading" ||
                        !name.trim() ||
                        !email.trim() ||
                        Boolean(accountSuspended)
                      }
                      onClick={handleCheckoutClick}
                      className={cn(
                        "btn-ref-primary w-full rounded-full px-6 py-3.5 text-sm font-medium transition",
                        (lines.length === 0 || !name.trim() || !email.trim()) &&
                          "cursor-not-allowed opacity-50",
                      )}
                    >
                      {status === "loading"
                        ? "Placing order…"
                        : !isSignedIn
                          ? "Log in & continue"
                          : profile?.needsOnboarding
                            ? "Complete profile & continue"
                            : paymentMethod === "card"
                              ? "Continue to demo card payment"
                              : "Place order"}
                    </button>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <FormSuccessModal
        open={showSuccessModal && status === "success"}
        onClose={() => setShowSuccessModal(false)}
        title={
          successCustomerName
            ? `Congratulations, ${successFirstName}!`
            : "Congratulations!"
        }
        message={orderSuccessMessage}
        titleId="order-success-title"
      />
    </>
  );
}

export function CartDrawer() {
  const { isOpen, closeCart } = useCart();

  if (!hasClerk() || !hasConvex()) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[90] bg-black/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
            />
            <motion.aside
              className="fixed right-0 top-0 z-[91] flex h-dvh w-full max-w-md flex-col border-l border-outline/40 bg-surface p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
            >
              <p className="text-sm font-semibold text-coffee-dark">Checkout unavailable</p>
              <p className="mt-2 text-sm text-muted">
                Sign-in and Convex must be configured to place orders.
              </p>
              <button
                type="button"
                className="mt-4 text-sm text-brand-green underline"
                onClick={closeCart}
              >
                Close
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return <CartDrawerInner />;
}
