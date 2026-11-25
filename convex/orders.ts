import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { computeFreeDrinkDiscount } from "./lib/applyCoupon";
import { awardLoyaltyForOrder } from "./lib/loyalty";
import { requireAdmin } from "./lib/adminAuth";
import {
  assertValidStatusTransition,
  compareOrdersByStatusThenCreated,
  type OrderStatusValue,
} from "./lib/orderStatusFlow";
import { assertUserCanPlaceOrder } from "./lib/userAccess";
import { getOrCreateUser, listActiveCoupons, requireIdentity } from "./lib/users";
import { normalizeAndValidateOrderLines } from "./lib/orderLineItems";
import { nextOrderNumber } from "./lib/orderNumbers";
import { branchCurrencyForSlug } from "./branches";
import { currencyOrDefault } from "./lib/currency";
import {
  branchSlug,
  financePeriod,
  orderLineItem,
  orderStatus,
  paymentMethod,
  paymentStatus,
} from "./lib/validators";
import { internal } from "./_generated/api";

const adminToken = v.string();

function resolveBranchSlug(branchSlugArg: string, legacyBranchId?: string) {
  const slug = (branchSlugArg || legacyBranchId || "").trim();
  if (!slug) throw new Error("Branch is required.");
  return slug;
}

function orderBranchSlug(order: { branchSlug?: string; branchId?: string }) {
  return order.branchSlug ?? order.branchId ?? "";
}

function getPeriodBounds(period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly", now = Date.now()) {
  const d = new Date(now);
  const end = now;
  let start: number;

  switch (period) {
    case "daily":
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      break;
    case "weekly": {
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff).getTime();
      break;
    }
    case "monthly":
      start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      break;
    case "quarterly": {
      const quarter = Math.floor(d.getMonth() / 3);
      start = new Date(d.getFullYear(), quarter * 3, 1).getTime();
      break;
    }
    case "yearly":
      start = new Date(d.getFullYear(), 0, 1).getTime();
      break;
  }

  return { start, end };
}

export const create = mutation({
  args: {
    branchSlug: v.optional(branchSlug),
    /** @deprecated Pass branchSlug — alias kept for existing cart UI */
    branchId: v.optional(branchSlug),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    items: v.array(orderLineItem),
    notes: v.optional(v.string()),
    couponId: v.optional(v.id("coupons")),
    freeItemMenuItemId: v.optional(v.string()),
    paymentMethod: paymentMethod,
    paymentMethodNote: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    /** @deprecated Whole-order free coupon — use couponId */
    useFreeOrderCoupon: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const slug = resolveBranchSlug(args.branchSlug ?? "", args.branchId);
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);
    assertUserCanPlaceOrder(user);

    if (!args.customerName.trim() || !args.customerEmail.trim()) {
      throw new Error("Name and email are required.");
    }
    const items = await normalizeAndValidateOrderLines(ctx, args.items, slug);

    const subtotalBeforeDiscount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let discountAmount = 0;
    let couponApplied = false;
    let couponId = args.couponId;
    let couponCode: string | undefined;
    let freeItemName: string | undefined;

    if (args.useFreeOrderCoupon && !couponId) {
      const legacy = await listActiveCoupons(ctx, user._id);
      if (legacy[0]) couponId = legacy[0]._id;
    }

    if (couponId) {
      const coupon = await ctx.db.get(couponId);
      if (!coupon || coupon.userId !== user._id) {
        throw new Error("Invalid coupon.");
      }
      if (coupon.redeemed) {
        throw new Error("This coupon has already been used.");
      }

      if (coupon.type === "free_order") {
        discountAmount = subtotalBeforeDiscount;
      } else {
        const drink = computeFreeDrinkDiscount(items, args.freeItemMenuItemId);
        discountAmount = drink.discountAmount;
        freeItemName = drink.freeItemName;
      }

      couponApplied = true;
      couponCode = coupon.code;
      await ctx.db.patch(coupon._id, { redeemed: true, redeemedAt: Date.now() });
    }

    const total = Math.max(
      0,
      Math.round((subtotalBeforeDiscount - discountAmount) * 100) / 100,
    );
    const currency = await branchCurrencyForSlug(ctx, slug);
    const now = Date.now();

    const method = args.paymentMethod;
    const paid =
      method === "card" || method === "cash"
        ? true
        : false;

    if (method === "card" && !/^\d{4}$/.test(args.cardLast4?.trim() ?? "")) {
      throw new Error("Card payment details are required.");
    }

    const orderNumber = await nextOrderNumber(ctx, now);

    const id = await ctx.db.insert("orders", {
      orderNumber,
      clerkUserId: identity.subject,
      userId: user._id,
      branchSlug: slug,
      customerName: args.customerName.trim(),
      customerEmail: args.customerEmail.trim(),
      customerPhone: args.customerPhone?.trim() || user.phone,
      items,
      subtotal: subtotalBeforeDiscount,
      subtotalBeforeDiscount,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      total,
      currency,
      status: "pending",
      paymentStatus: paid ? "paid" : "pending",
      paidAt: paid ? now : undefined,
      paymentMethod: method,
      paymentMethodNote:
        method === "other" ? args.paymentMethodNote?.trim() || undefined : undefined,
      cardLast4: method === "card" ? args.cardLast4?.trim() : undefined,
      cardBrand: method === "card" ? args.cardBrand?.trim() : undefined,
      createdAt: now,
      updatedAt: now,
      notes: args.notes?.trim() || undefined,
      couponApplied: couponApplied || undefined,
      couponId: couponId ?? undefined,
      couponCode,
      freeItemName,
    });

    // Schedule new order AI notification alert for staff
    await ctx.scheduler.runAfter(0, internal.ai.adminAlert.notifyNewOrder, {
      orderId: id,
    });

    let loyalty: Awaited<ReturnType<typeof awardLoyaltyForOrder>> = null;
    if (paid) {
      const order = await ctx.db.get(id);
      if (order) {
        loyalty = await awardLoyaltyForOrder(ctx, order);
        if (loyalty) {
          await ctx.db.patch(id, { pointsEarned: loyalty.pointsEarned });
        }
      }
    }

    return {
      id,
      orderNumber,
      pointsEarned: loyalty?.pointsEarned ?? 0,
      couponsEarned: loyalty?.couponsEarned ?? 0,
      newPointsBalance: loyalty?.newPointsBalance ?? user.points,
    };
  },
});

export const getDetail = query({
  args: {
    adminToken,
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const user = order.userId ? await ctx.db.get(order.userId) : null;
    const customer = user
      ? {
          _id: user._id,
          clerkUserId: user.clerkUserId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          dateOfBirth: user.dateOfBirth,
          country: user.country,
          address: user.address,
          avatarUrl: user.avatarUrl,
          points: user.points,
          totalOrders: user.totalOrders,
          active: user.active !== false,
        }
      : null;

    return { order, customer };
  },
});

export const list = query({
  args: {
    adminToken,
    status: v.optional(orderStatus),
    paymentStatus: v.optional(paymentStatus),
    branchSlug: v.optional(branchSlug),
    /** @deprecated Use branchSlug */
    branchId: v.optional(branchSlug),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const branchFilter = args.branchSlug ?? args.branchId;
    let orders: Doc<"orders">[];

    if (branchFilter) {
      const fromIndex = await ctx.db
        .query("orders")
        .withIndex("by_branch_created", (q) => q.eq("branchSlug", branchFilter))
        .collect();
      const legacyOnly = (await ctx.db.query("orders").collect()).filter(
        (o) => !o.branchSlug && o.branchId === branchFilter,
      );
      const seen = new Set(fromIndex.map((o) => o._id));
      orders = [
        ...fromIndex,
        ...legacyOnly.filter((o) => !seen.has(o._id)),
      ].sort((a, b) => b.createdAt - a.createdAt);
    } else {
      orders = (await ctx.db.query("orders").collect()).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    }

    if (args.status) orders = orders.filter((o) => o.status === args.status);
    if (args.paymentStatus) orders = orders.filter((o) => o.paymentStatus === args.paymentStatus);

    orders.sort(compareOrdersByStatusThenCreated);

    const limit = args.limit ?? 200;
    return orders.slice(0, limit);
  },
});

export const updateStatus = mutation({
  args: {
    adminToken,
    orderId: v.id("orders"),
    status: orderStatus,
    cancellationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found.");

    assertValidStatusTransition(
      order.status as OrderStatusValue,
      args.status as OrderStatusValue,
      args.cancellationReason,
    );

    const now = Date.now();
    const patch: {
      status: typeof args.status;
      updatedAt: number;
      cancellationReason?: string;
      pointsEarned?: number;
    } = {
      status: args.status,
      updatedAt: now,
      cancellationReason:
        args.status === "cancelled"
          ? args.cancellationReason!.trim()
          : order.cancellationReason,
    };

    if (args.status === "completed") {
      const loyalty = await awardLoyaltyForOrder(ctx, order);
      if (loyalty) {
        patch.pointsEarned = loyalty.pointsEarned;
      }
    }

    await ctx.db.patch(args.orderId, patch);

    // ── AI hooks ────────────────────────────────────────────────────────────
    // Phase A: Order accepted → analyze and learn
    if (args.status === "confirmed") {
      await ctx.scheduler.runAfter(0, internal.ai.onOrderAccepted.analyzeAcceptedOrder, {
        orderId: args.orderId,
      });
    }

    // Phase B+C: Order ready → notify customer via SMS / VAPI
    if (args.status === "ready") {
      await ctx.scheduler.runAfter(0, internal.ai.notifyCustomer.notifyOrderReady, {
        orderId: args.orderId,
      });
    }
  },
});

export const updatePaymentStatus = mutation({
  args: {
    adminToken,
    orderId: v.id("orders"),
    paymentStatus,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found.");

    const now = Date.now();
    const wasPaid = order.paymentStatus === "paid";
    const patch: {
      paymentStatus: typeof args.paymentStatus;
      paidAt?: number;
      pointsEarned?: number;
      updatedAt: number;
    } = {
      paymentStatus: args.paymentStatus,
      updatedAt: now,
    };

    if (args.paymentStatus === "paid" && !wasPaid) {
      patch.paidAt = now;
      const loyalty = await awardLoyaltyForOrder(ctx, order);
      if (loyalty) {
        patch.pointsEarned = loyalty.pointsEarned;
      }
    }

    await ctx.db.patch(args.orderId, patch);
  },
});

export const financeSummary = query({
  args: {
    adminToken,
    period: financePeriod,
    branchSlug: v.optional(branchSlug),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const { start, end } = getPeriodBounds(args.period);
    const all = await ctx.db.query("orders").collect();
    const allBranches = await ctx.db.query("branches").collect();
    const currencyBySlug = new Map(
      allBranches.map((b) => [b.slug, currencyOrDefault(b.currency)]),
    );
    const orderCurrency = (order: Doc<"orders">) =>
      currencyOrDefault(order.currency ?? currencyBySlug.get(orderBranchSlug(order)));

    const inPeriod = all.filter((o) => {
      const ts = o.paymentStatus === "paid" && o.paidAt ? o.paidAt : o.createdAt;
      if (ts < start || ts > end) return false;
      if (args.branchSlug && orderBranchSlug(o) !== args.branchSlug) return false;
      return true;
    });

    const paid = inPeriod.filter((o) => o.paymentStatus === "paid");
    const displayCurrency = args.branchSlug
      ? (currencyBySlug.get(args.branchSlug) ?? "USD")
      : undefined;
    const pendingPayment = inPeriod.filter((o) => o.paymentStatus === "pending");
    const totalRevenue = paid.reduce((sum, o) => sum + o.total, 0);
    const orderCount = inPeriod.length;
    const paidCount = paid.length;
    const averageOrderValue = paidCount > 0 ? totalRevenue / paidCount : 0;

    const bucketMs =
      args.period === "daily"
        ? 60 * 60 * 1000
        : args.period === "weekly"
          ? 24 * 60 * 60 * 1000
          : args.period === "monthly"
            ? 24 * 60 * 60 * 1000
            : args.period === "quarterly"
              ? 7 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000;

    const buckets = new Map<number, { revenue: number; orders: number }>();
    for (const order of paid) {
      const ts = order.paidAt ?? order.createdAt;
      const key = Math.floor((ts - start) / bucketMs) * bucketMs + start;
      const prev = buckets.get(key) ?? { revenue: 0, orders: 0 };
      buckets.set(key, {
        revenue: prev.revenue + order.total,
        orders: prev.orders + 1,
      });
    }

    const trend = Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, data]) => ({
        timestamp,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
      }));

    const transactions = paid
      .sort((a, b) => (b.paidAt ?? b.createdAt) - (a.paidAt ?? a.createdAt))
      .map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        branchId: orderBranchSlug(o),
        branchSlug: orderBranchSlug(o),
        currency: orderCurrency(o),
        total: o.total,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        paidAt: o.paidAt ?? o.createdAt,
        status: o.status,
      }));

    const byBranch = new Map<string, { revenue: number; orders: number }>();
    for (const order of paid) {
      const slug = orderBranchSlug(order);
      const prev = byBranch.get(slug) ?? { revenue: 0, orders: 0 };
      byBranch.set(slug, {
        revenue: prev.revenue + order.total,
        orders: prev.orders + 1,
      });
    }

    const branchBreakdown = Array.from(byBranch.entries())
      .map(([branchId, data]) => ({
        branchId,
        currency: currencyBySlug.get(branchId) ?? "USD",
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const statusCounts = {
      pending: inPeriod.filter((o) => o.status === "pending").length,
      confirmed: inPeriod.filter((o) => o.status === "confirmed").length,
      preparing: inPeriod.filter((o) => o.status === "preparing").length,
      ready: inPeriod.filter((o) => o.status === "ready").length,
      completed: inPeriod.filter((o) => o.status === "completed").length,
      cancelled: inPeriod.filter((o) => o.status === "cancelled").length,
    };

    const loyaltyPointsIssued = paid.reduce((sum, o) => sum + (o.pointsEarned ?? 0), 0);
    const couponOrders = paid.filter((o) => o.couponApplied).length;

    return {
      period: args.period,
      branchSlug: args.branchSlug,
      displayCurrency,
      start,
      end,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      orderCount,
      paidCount,
      pendingPaymentCount: pendingPayment.length,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      loyaltyPointsIssued,
      couponOrders,
      statusCounts,
      branchBreakdown,
      trend,
      transactions,
    };
  },
});
