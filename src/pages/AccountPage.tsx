import { useEffect, useMemo, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { CustomerOrderDetailModal } from "@/components/account/CustomerOrderDetailModal";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import { formatPrice } from "@/data/content";
import { orderCurrency } from "@/lib/orderCurrency";
import {
  POINTS_PER_SUCCESSFUL_ORDER,
  POINTS_REDEEM_THRESHOLD,
  POINTS_WELCOME_BONUS,
  couponTypeLabel,
} from "@/lib/loyalty";
import { OrderProgressTracker } from "@/components/account/OrderProgressTracker";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { useAuthModal } from "@/auth/AuthModalContext";
import { useOnboarding } from "@/auth/useOnboarding";
import {
  AddressLocationFields,
  type AddressLocationValue,
} from "@/components/auth/AddressLocationFields";
import {
  isAddressSelectionComplete,
  profileToAddressFields,
  resolveStreetLine,
} from "@/lib/addressLocations";
import { ConvexSetupNotice } from "@/components/convex/ConvexSetupNotice";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { hasClerk, hasConvex } from "@/providers/AppProviders";
import { customerOrderStatusHeadline } from "@/lib/orderStatusFlow";
import { cn } from "@/lib/utils";
import {
  Activity,
  Gift,
  Heart,
  LogOut,
  MapPin,
  Package,
  PackageSearch,
  User,
  Eye,
} from "lucide-react";
import { MenuCard } from "@/components/ui/MenuCard";
import { useBranch } from "@/branch/BranchContext";
import { useBranchCurrency } from "@/branch/useBranchCurrency";
import { favoriteToMenuItem, useMyFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/cart/CartContext";
import type { MenuCategory } from "@/data/content";

type AccountSection = "track" | "history" | "favorites" | "rewards" | "activity" | "profile";

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "preparing", "ready"]);

const SIDEBAR_ITEMS: Array<{
  id: AccountSection;
  label: string;
  icon: typeof Package;
}> = [
  { id: "track", label: "Track orders", icon: PackageSearch },
  { id: "history", label: "Order history", icon: Package },
  { id: "favorites", label: "My favourites", icon: Heart },
  { id: "rewards", label: "Reward points", icon: Gift },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "profile", label: "My information", icon: User },
];

function AccountPageConnected() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { openSignIn } = useAuthModal();
  const { openOnboarding } = useOnboarding();
  const [section, setSection] = useState<AccountSection>("track");

  const profile = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const orders = useQuery(api.users.myOrders, isSignedIn ? {} : "skip");
  const coupons = useQuery(api.users.myCoupons, isSignedIn ? {} : "skip");
  const favorites = useMyFavorites();
  const { branchId } = useBranch();
  const branchCurrency = useBranchCurrency();
  const { addItem, openCart } = useCart();
  const syncProfile = useMutation(api.users.syncProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const convertPointsToCoupon = useMutation(api.users.convertPointsToCoupon);
  const [convertStatus, setConvertStatus] = useState<"idle" | "loading" | "error">("idle");
  const [convertError, setConvertError] = useState<string | null>(null);
  const formatBranch = useFormatBranchLabel();
  const { imageUrl: avatarUrl, email: accountEmail, name: accountName } = useUserAvatar();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressFields, setAddressFields] = useState<AddressLocationValue>({
    country: "",
    region: "",
    city: "",
    addressLine: "",
    customAddress: "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [viewOrderId, setViewOrderId] = useState<Id<"orders"> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) openSignIn("account", "/account");
  }, [isLoaded, isSignedIn, openSignIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    void syncProfile({});
  }, [isSignedIn, syncProfile]);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setDateOfBirth(profile.dateOfBirth ?? "");
    setAddressFields(
      profileToAddressFields({
        country: profile.country,
        region: profile.region,
        city: profile.city,
        address: profile.address,
      }),
    );
  }, [profile]);

  const activeOrders = useMemo(
    () => orders?.filter((o) => ACTIVE_STATUSES.has(o.status)) ?? [],
    [orders],
  );

  const historyOrders = useMemo(
    () =>
      orders?.filter((o) => o.status === "completed" || o.status === "cancelled") ?? [],
    [orders],
  );

  const activityItems = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((o) => o.pointsEarned && o.pointsEarned > 0)
      .map((o) => ({
        id: o._id,
        label: `Order ${o.orderNumber}`,
        detail: `+${o.pointsEarned} points · ${formatBranch(resolveBranchSlug(o))}`,
        at: o.createdAt,
      }));
  }, [orders, formatBranch]);

  if (!isLoaded || (isSignedIn && profile === undefined)) {
    return (
      <div className="container-main py-20 text-center text-muted">Loading your account…</div>
    );
  }

  if (isSignedIn && profile === null) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-muted">Setting up your customer profile…</p>
        <button
          type="button"
          className="btn-ref-primary mt-4 rounded-full px-6 py-2.5 text-sm font-medium text-white"
          onClick={() => void syncProfile({})}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-headline-md text-coffee-dark">Customer account</p>
        <p className="mt-2 text-sm text-muted">
          Sign in with Clerk to track orders, view rewards and coupons, and manage your profile.
          Staff admin login is separate at /admin.
        </p>
        <button
          type="button"
          onClick={() => openSignIn("account", "/account")}
          className="btn-ref-primary mt-6 rounded-full px-6 py-3 text-sm font-medium text-white"
        >
          Log in
        </button>
      </div>
    );
  }

  const activeCoupons = coupons?.filter((c: Doc<"coupons">) => !c.redeemed).length ?? 0;
  const points = profile?.points ?? 0;
  const progressPct = Math.min(100, (points / POINTS_REDEEM_THRESHOLD) * 100);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const streetLine = resolveStreetLine(
        addressFields.addressLine,
        addressFields.customAddress,
      );
      await updateProfile({
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        country: addressFields.country,
        region: addressFields.region,
        city: addressFields.city,
        address: streetLine,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }

  function renderOrderCard(order: Doc<"orders">, options?: { compact?: boolean }) {
    const compact = options?.compact ?? false;
    const statusHeadline = customerOrderStatusHeadline(order.status);

    return (
      <article
        key={order._id}
        className="rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-coffee-dark">{order.orderNumber}</p>
            <p className="text-xs text-muted">
              {formatDateTime(order.createdAt)} · {formatBranch(resolveBranchSlug(order))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                order.status === "pending" && "border-amber-200 bg-amber-50 text-amber-800",
                (order.status === "confirmed" || order.status === "preparing") &&
                  "border-violet-200 bg-violet-50 text-violet-800",
                order.status === "ready" && "border-teal-200 bg-teal-50 text-teal-800",
                order.status === "completed" &&
                  "border-brand-green/25 bg-brand-green/10 text-brand-green",
                order.status === "cancelled" && "border-red-200 bg-red-50 text-red-700",
              )}
            >
              {statusHeadline}
            </span>
            <StatusBadge label={order.paymentStatus} variant="payment" />
          </div>
        </div>
        <p className="mt-3 text-sm text-on-surface">
          {order.items
            .map((i: { quantity: number; name: string }) => `${i.quantity}× ${i.name}`)
            .join(", ")}
        </p>
        <p className="mt-2 text-sm font-semibold text-coffee-dark">
          {formatPrice(order.total, orderCurrency(order))}
          {order.pointsEarned ? (
            <span className="ml-2 font-normal text-brand-green">+{order.pointsEarned} pts</span>
          ) : null}
        </p>
        {order.status === "cancelled" && order.cancellationReason ? (
          <p className="mt-3 text-sm text-red-700">
            Reason: {order.cancellationReason}
          </p>
        ) : null}
        <OrderProgressTracker status={order.status} compact={compact} />
        <div className="mt-4 flex flex-wrap gap-2 border-t border-outline/30 pt-4">
          <button
            type="button"
            onClick={() => setViewOrderId(order._id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
          >
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            View details
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="section-pad">
      <div className="container-main max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar
              imageUrl={avatarUrl ?? profile?.avatarUrl}
              email={accountEmail ?? profile?.email}
              name={accountName}
              size="xl"
            />
            <div>
              <h1 className="text-headline-lg text-coffee-dark">
                {profile?.firstName || user?.firstName || "My account"}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {profile?.email || user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-brand-green/25 bg-brand-green/8 px-4 py-3">
            <Gift className="h-5 w-5 text-brand-green" />
            <div>
              <p className="text-xs text-muted">Reward points</p>
              <p className="text-lg font-semibold text-coffee-dark">{points}</p>
            </div>
          </div>
        </div>

        {profile?.needsOnboarding && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm text-amber-950">
              Finish setup (delivery details + phone verification) to unlock checkout and your{" "}
              {POINTS_WELCOME_BONUS} pt welcome bonus. You can browse this dashboard anytime.
            </p>
            <button
              type="button"
              onClick={() => openOnboarding("account")}
              className="btn-ref-primary rounded-full px-5 py-2 text-sm font-medium text-white"
            >
              Complete profile
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row">
          <aside className="lg:w-56 lg:shrink-0">
            <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-outline/40 bg-white/70 p-2 shadow-card no-scrollbar lg:flex-col lg:overflow-visible">
              {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition lg:w-full lg:gap-3",
                    section === id
                      ? "bg-brand-green text-white"
                      : "text-on-surface hover:bg-cream",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/" })}
                className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 lg:w-full lg:gap-3"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Log out
              </button>
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            {section === "track" && (
              <div className="space-y-4">
                <h2 className="text-headline-md text-coffee-dark">Track orders</h2>
                <p className="text-sm text-muted">
                  Follow your order from pending to processing, ready to collect, and delivered.
                  Updates appear here when the café changes your order status.
                </p>
                {!orders ? (
                  <p className="text-sm text-muted">Loading…</p>
                ) : activeOrders.length === 0 ? (
                  <div className="rounded-2xl border border-outline/40 bg-white/60 p-8 text-center">
                    <p className="text-sm text-muted">No active orders right now.</p>
                    <Link to="/menu" className="mt-4 inline-block text-sm font-medium text-brand-green">
                      Order from menu →
                    </Link>
                  </div>
                ) : (
                  activeOrders.map((order) => renderOrderCard(order))
                )}
              </div>
            )}

            {section === "history" && (
              <div className="space-y-4">
                <h2 className="text-headline-md text-coffee-dark">Order history</h2>
                {!orders ? (
                  <p className="text-sm text-muted">Loading…</p>
                ) : historyOrders.length === 0 ? (
                  <p className="text-sm text-muted">No past orders yet.</p>
                ) : (
                  historyOrders.map((order) => renderOrderCard(order, { compact: true }))
                )}
              </div>
            )}

            {section === "favorites" && (
              <div className="space-y-4">
                <h2 className="text-headline-md text-coffee-dark">My favourites</h2>
                <p className="text-sm text-muted">
                  Drinks and bites you saved from the menu. Tap the heart again to remove, or
                  order straight from here.
                </p>
                {favorites === undefined ? (
                  <p className="text-sm text-muted">Loading…</p>
                ) : favorites.length === 0 ? (
                  <div className="rounded-2xl border border-outline/40 bg-white/60 p-8 text-center">
                    <Heart className="mx-auto h-8 w-8 text-muted/50" />
                    <p className="mt-3 text-sm text-muted">
                      No favourites yet. Browse the menu and tap the heart on items you love.
                    </p>
                    <Link
                      to="/menu"
                      className="mt-4 inline-block text-sm font-medium text-brand-green"
                    >
                      Explore menu →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                    {favorites.map((row, index) => {
                      const item = favoriteToMenuItem(row);
                      return (
                        <div key={row._id} className="relative">
                          <MenuCard
                            menuItem={item}
                            branchSlug={row.branchSlug ?? branchId}
                            showFavorite
                            name={item.name}
                            description={item.description}
                            price={item.price}
                            currency={branchCurrency}
                            imageUrl={item.imageUrl}
                            category={item.category as MenuCategory}
                            index={index}
                            onOpen={() => {
                              addItem({
                                menuItemId: item._id,
                                name: item.name,
                                price: item.price,
                              });
                              openCart();
                            }}
                          />
                          {row.outOfStock ? (
                            <p className="mt-1 text-center text-xs text-amber-800">
                              Currently unavailable
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === "rewards" && (
              <div className="space-y-4">
                <h2 className="text-headline-md text-coffee-dark">Reward points</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                      Your balance
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-coffee-dark">{points}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-brand-green transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {profile?.pointsToNextCoupon ?? POINTS_REDEEM_THRESHOLD - points} pts to
                      next free drink coupon
                    </p>
                    {profile?.canConvertPointsToCoupon && (
                      <button
                        type="button"
                        disabled={convertStatus === "loading"}
                        onClick={async () => {
                          setConvertStatus("loading");
                          setConvertError(null);
                          try {
                            await convertPointsToCoupon({});
                            setConvertStatus("idle");
                          } catch (e) {
                            setConvertStatus("error");
                            setConvertError(
                              e instanceof Error ? e.message : "Could not convert points.",
                            );
                          }
                        }}
                        className="btn-ref-primary mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold"
                      >
                        {convertStatus === "loading"
                          ? "Converting…"
                          : `Convert ${POINTS_REDEEM_THRESHOLD} pts → coupon`}
                      </button>
                    )}
                    {convertError && (
                      <p className="mt-2 text-xs text-red-600">{convertError}</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                      Active drink coupons
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-coffee-dark">{activeCoupons}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-outline/40 bg-cream/40 p-6">
                  <ul className="space-y-2 text-sm text-on-surface">
                    <li>• Welcome bonus (first sign-in): +{POINTS_WELCOME_BONUS} points</li>
                    <li>• Each successful order: +{POINTS_PER_SUCCESSFUL_ORDER} points</li>
                    <li>
                      • {POINTS_REDEEM_THRESHOLD} points = 1 free drink coupon (automatic or
                      convert from rewards)
                    </li>
                  </ul>
                </div>
                {!coupons ? (
                  <p className="text-sm text-muted">Loading coupons…</p>
                ) : (
                  <ul className="space-y-2">
                    {coupons.map((c: Doc<"coupons">) => (
                      <li
                        key={c._id}
                        className="flex items-center justify-between rounded-xl border border-outline/40 bg-white/70 px-4 py-3 text-sm"
                      >
                        <span>
                          <span className="font-mono font-semibold text-primary">
                            {c.code ?? "—"}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {couponTypeLabel(c.type)}
                          </span>
                        </span>
                        <span className={c.redeemed ? "text-muted" : "font-medium text-brand-green"}>
                          {c.redeemed ? "Redeemed" : "Apply at checkout"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {section === "activity" && (
              <div className="space-y-4">
                <h2 className="text-headline-md text-coffee-dark">Activity</h2>
                <p className="text-sm text-muted">Points earned from your orders.</p>
                {activityItems.length === 0 ? (
                  <p className="text-sm text-muted">No activity yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {activityItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-outline/40 bg-white/70 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-coffee-dark">{item.label}</p>
                          <p className="text-xs text-muted">{item.detail}</p>
                        </div>
                        <span className="text-xs text-muted">{formatDateTime(item.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {section === "profile" && (
              <form
                onSubmit={handleSaveProfile}
                className="grid gap-4 rounded-2xl border border-outline/40 bg-white/70 p-6 shadow-card md:grid-cols-2"
              >
                <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <UserAvatar
                    imageUrl={avatarUrl ?? profile?.avatarUrl}
                    email={accountEmail ?? profile?.email}
                    name={accountName}
                    size="lg"
                  />
                  <div>
                    <h2 className="text-headline-md text-coffee-dark">My information</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5" />
                      Profile photo from your sign-in account ({profile?.email || accountEmail}).
                    </p>
                  </div>
                </div>
                <label className="grid gap-2 text-sm">
                  <span className="text-muted">First name</span>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl border border-outline/40 bg-white px-4 py-3 outline-none focus:border-brand-green/40"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-muted">Last name</span>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl border border-outline/40 bg-white px-4 py-3 outline-none focus:border-brand-green/40"
                  />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span className="text-muted">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border border-outline/40 bg-white px-4 py-3 outline-none focus:border-brand-green/40"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-muted">Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl border border-outline/40 bg-white px-4 py-3 outline-none focus:border-brand-green/40"
                  />
                  {profile?.phoneVerified && (
                    <span className="text-xs text-brand-green">Verified</span>
                  )}
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-muted">Date of birth</span>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="rounded-xl border border-outline/40 bg-white px-4 py-3 outline-none focus:border-brand-green/40"
                  />
                </label>
                <div className="md:col-span-2">
                  <AddressLocationFields
                    value={addressFields}
                    onChange={setAddressFields}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={
                      saveStatus === "saving" || !isAddressSelectionComplete(addressFields)
                    }
                    className="btn-ref-primary rounded-full px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saveStatus === "saving"
                      ? "Saving…"
                      : saveStatus === "saved"
                        ? "Saved"
                        : "Save profile"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <CustomerOrderDetailModal
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
        />
      </div>
    </div>
  );
}

export function AccountPage() {
  if (!hasClerk()) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-headline-md text-coffee-dark">Account sign-in not configured</p>
        <p className="mt-2 text-sm text-muted">Set VITE_CLERK_PUBLISHABLE_KEY in your .env file.</p>
      </div>
    );
  }

  if (!hasConvex()) {
    return (
      <div className="container-main py-20">
        <ConvexSetupNotice context="Your account, orders, and rewards" />
      </div>
    );
  }

  return <AccountPageConnected />;
}
