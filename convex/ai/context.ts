import { internalQuery } from "../_generated/server";
import { readBranchMenu } from "../lib/branchMenu";
import type { Doc } from "../_generated/dataModel";
import { POINTS_REDEEM_THRESHOLD } from "../lib/loyalty";
import { v } from "convex/values";
import { DEFAULT_SITE_SETTINGS } from "../lib/branchDefaults";

/**
 * Build full customer context for AI chat.
 * Loads: profile, orders, order analytics, favourites, menu, branch info,
 *        site settings, FAQs, testimonials, reservations, coupons, loyalty.
 */
export const buildCustomerContext = internalQuery({
  args: { clerkUserId: v.string(), branchSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // ── User profile ────────────────────────────────────────────────────────
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user) return null;

    // ── Branch info ─────────────────────────────────────────────────────────
    let branchLabel = "Not set";
    let branchAddress = "";
    let branchHours: string[] = [];
    let branchConcept = "";
    let branchSubtitle = "";
    let currency = "USD";

    const branchSlug = args.branchSlug ?? user.branchSlug;
    if (branchSlug) {
      const branch = await ctx.db
        .query("branches")
        .withIndex("by_slug", (q) => q.eq("slug", branchSlug))
        .unique();
      if (branch) {
        branchLabel = branch.label;
        branchAddress = branch.address;
        branchHours = branch.hours ?? [];
        branchConcept = branch.concept ?? "";
        branchSubtitle = branch.subtitle ?? "";
        currency = branch.currency || "USD";
      }
    }

    // ── All branches (for multi-branch questions) ───────────────────────────
    const allBranches = await ctx.db
      .query("branches")
      .withIndex("by_active_sort", (q) => q.eq("active", true))
      .collect();

    const branchList = allBranches.map((b) => ({
      slug: b.slug,
      label: b.label,
      address: b.address,
      hours: b.hours ?? [],
      concept: b.concept ?? "",
      currency: b.currency || "USD",
    }));

    // ── Full menu for user's home branch ────────────────────────────────────
    const catalog = branchSlug ? await readBranchMenu(ctx, branchSlug, true) : null;
    const menuByCategory = (catalog?.categories ?? []).map((group) => ({
      category: group.label,
      items: group.items.map(({ name, price, description, featured, outOfStock }) => ({
        name, price, description, featured, outOfStock,
      })),
    }));
    const listedItems = menuByCategory.flatMap((group) => group.items);
    const featuredItems = listedItems.filter((item) => item.featured && !item.outOfStock);
    const outOfStockItems = listedItems.filter((item) => item.outOfStock).map((item) => item.name);

    // ── All orders ──────────────────────────────────────────────────────────
    const byClerk = await ctx.db
      .query("orders")
      .withIndex("by_clerk_created", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();

    const byUserId = await ctx.db
      .query("orders")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .collect();

    const seen = new Set<string>();
    const allOrders = [...byClerk, ...byUserId].filter((o) => {
      if (seen.has(o._id)) return false;
      seen.add(o._id);
      return true;
    });

    const activeOrders = allOrders
      .filter((o) => o.status !== "completed" && o.status !== "cancelled")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(mapOrder);

    const completedOrders = allOrders.filter((o) => o.status === "completed");
    const cancelledOrders = allOrders.filter((o) => o.status === "cancelled");

    const orderHistory = allOrders
      .filter((o) => o.status === "completed" || o.status === "cancelled")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map(mapOrder);

    // ── Order analytics ─────────────────────────────────────────────────────
    const itemFrequency = new Map<string, { name: string; count: number; totalQty: number; lastOrdered: string }>();
    const spending = new Map<string, { total: number; orders: number }>();
    let totalPointsEarned = 0;

    for (const order of completedOrders) {
      const code = (order.currency ?? "USD").toUpperCase();
      const group = spending.get(code) ?? { total: 0, orders: 0 };
      group.total += order.total;
      group.orders++;
      spending.set(code, group);
      totalPointsEarned += order.pointsEarned ?? 0;
      const countedItems = new Set<string>();
      for (const item of order.items) {
        const key = item.name.toLowerCase().trim();
        const existing = itemFrequency.get(key);
        if (existing) {
          if (!countedItems.has(key)) existing.count += 1;
          existing.totalQty += item.quantity;
          if (order.createdAt > new Date(existing.lastOrdered).getTime()) {
            existing.lastOrdered = new Date(order.createdAt).toISOString();
          }
        } else {
          itemFrequency.set(key, {
            name: item.name,
            count: 1,
            totalQty: item.quantity,
            lastOrdered: new Date(order.createdAt).toISOString(),
          });
        }
        countedItems.add(key);
      }
    }

    const mostOrderedItems = Array.from(itemFrequency.values())
      .sort((a, b) => b.count !== a.count ? b.count - a.count : b.totalQty - a.totalQty)
      .slice(0, 10)
      .map((item) => ({
        name: item.name,
        orderedInXOrders: item.count,
        totalQuantity: item.totalQty,
        lastOrdered: item.lastOrdered,
      }));

    const lastCompletedOrder = completedOrders.sort((a, b) => b.createdAt - a.createdAt)[0];
    const lastOrderedItem = lastCompletedOrder?.items?.[0]?.name ?? null;

    const spendingSummary = {
      byCurrency: Array.from(spending, ([currency, group]) => ({ currency, totalSpent: Number(group.total.toFixed(2)), averageOrderValue: Number((group.total / group.orders).toFixed(2)) })),
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      totalPointsEarnedAllTime: totalPointsEarned,
    };

    // ── Coupons ─────────────────────────────────────────────────────────────
    const allCoupons = await ctx.db
      .query("coupons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const activeCoupons = allCoupons
      .filter((c) => !c.redeemed)
      .map((c) => ({ code: c.code, type: c.type }));

    const redeemedCoupons = allCoupons
      .filter((c) => c.redeemed)
      .slice(0, 5)
      .map((c) => ({
        code: c.code,
        type: c.type,
        redeemedAt: c.redeemedAt ? new Date(c.redeemedAt).toISOString() : null,
      }));

    // ── Favourites ──────────────────────────────────────────────────────────
    const favourites = await ctx.db
      .query("userFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const favouriteItems = await Promise.all(
      favourites
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (f) => {
          const itemId = ctx.db.normalizeId("menuItems", f.menuItemId);
          const item = itemId ? await ctx.db.get(itemId) : null;
          return {
            name: item?.name ?? f.name,
            price: item?.price ?? f.price,
            currency: branchList.find((b) => b.slug === f.branchSlug)?.currency ?? currency,
            branch: f.branchSlug || user.branchSlug || "Unknown",
            category: f.category,
            savedAt: new Date(f.createdAt).toISOString().split("T")[0],
          };
        })
    );

    // ── Testimonials / Feedback ─────────────────────────────────────────────
    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();

    const myFeedback = testimonials
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((t) => ({
        rating: t.rating,
        text: t.text,
        status: t.status,
        targetType: t.targetType,
        targetLabel: t.targetLabel,
        createdAt: new Date(t.createdAt).toISOString(),
      }));

    // ── Reservations ────────────────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    const ownedBookings = await ctx.db.query("reservations")
      .withIndex("by_owner_created", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc").take(5);
    const verifiedEmail = identity?.subject === args.clerkUserId && identity.emailVerified ? identity.email : undefined;
    const guestBookings = verifiedEmail ? await ctx.db.query("reservations")
      .withIndex("by_guest_email", (q) => q.eq("clerkUserId", undefined).eq("email", verifiedEmail))
      .order("desc").take(5) : [];
    const myReservations = [...ownedBookings, ...guestBookings]
      .sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
      .map((r) => ({
        date: r.date,
        time: r.time,
        guests: r.guests,
        branch: r.branchSlug || r.branchId || "Unknown",
        status: r.status,
        notes: r.notes,
      }));

    // ── FAQs ────────────────────────────────────────────────────────────────
    const allFaqs = await ctx.db.query("faqs").withIndex("by_sort").collect();
    const faqs = allFaqs
      .filter((f) => f.active !== false)
      .map((f) => ({ question: f.question, answer: f.answer }));

    // ── Site settings ───────────────────────────────────────────────────────
    const siteRow = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    const siteSettings = siteRow ?? { ...DEFAULT_SITE_SETTINGS, key: "global" as const };

    return {
      // Profile
      userId: user._id,
      clerkUserId: user.clerkUserId,
      firstName: user.firstName || "Guest",
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      dateOfBirth: user.dateOfBirth,
      country: user.country,
      city: user.city,
      address: user.address,
      // Home branch
      branchSlug,
      branchLabel,
      branchAddress,
      branchHours,
      branchConcept,
      branchSubtitle,
      currency,
      // All branches
      branchList,
      // Menu
      menuByCategory,
      featuredItems,
      outOfStockItems,
      // Loyalty
      points: user.points,
      totalOrders: user.totalOrders,
      pointsToNextCoupon: Math.max(0, POINTS_REDEEM_THRESHOLD - user.points),
      // Orders
      activeOrders,
      orderHistory,
      // Order analytics
      mostOrderedItems,
      lastOrderedItem,
      spendingSummary,
      // Coupons
      activeCoupons,
      redeemedCoupons,
      // Favourites
      favouriteItems,
      // Feedback
      myFeedback,
      // Reservations
      myReservations,
      // Café info
      faqs,
      siteSettings: {
        phone: siteSettings.phone,
        email: siteSettings.email,
        hours: branchHours.join(" | ") || siteSettings.hours,
        location: branchAddress || siteSettings.location,
      },
    };
  },
});

function mapOrder(order: Doc<"orders">) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: getStatusLabel(order.status),
    branch: order.branchSlug,
    total: order.total,
    currency: order.currency || "USD",
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    couponApplied: order.couponApplied ?? false,
    couponCode: order.couponCode,
    discountAmount: order.discountAmount,
    freeItemName: order.freeItemName,
    notes: order.notes,
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
    cancellationReason: order.cancellationReason,
  };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Accepted",
    preparing: "Preparing",
    ready: "Ready for pickup",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}
