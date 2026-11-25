import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/adminAuth";
import { currencyOrDefault } from "./lib/currency";

const adminToken = v.string();
const OVERVIEW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function dayStart(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function orderBranchSlug(order: { branchSlug?: string; branchId?: string }) {
  return order.branchSlug ?? order.branchId ?? "";
}

function buildDailyBuckets(start: number, end: number) {
  const keys: number[] = [];
  for (let t = dayStart(start); t <= end; t += DAY_MS) {
    keys.push(t);
  }
  return keys;
}

export const overview = query({
  args: { adminToken },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const now = Date.now();
    const start = now - OVERVIEW_DAYS * DAY_MS;
    const dayKeys = buildDailyBuckets(start, now);

    const orders = await ctx.db.query("orders").collect();
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_created", (q) => q.gte("createdAt", start))
      .collect();
    const paidOrders = await ctx.db
      .query("orders")
      .withIndex("by_payment_created", (q) => q.eq("paymentStatus", "paid"))
      .collect();
    const users = await ctx.db.query("users").collect();
    const recentUsers = await ctx.db
      .query("users")
      .withIndex("by_created", (q) => q.gte("createdAt", start))
      .collect();
    const reservations = await ctx.db.query("reservations").collect();
    const pendingReservations = (
      await ctx.db
        .query("reservations")
        .withIndex("by_status_created", (q) => q.eq("status", "pending"))
        .collect()
    ).length;
    const messages = await ctx.db.query("contactMessages").collect();
    const pendingMessages = (
      await ctx.db
        .query("contactMessages")
        .withIndex("by_status_created", (q) => q.eq("status", "pending"))
        .collect()
    ).length;
    const testimonials = await ctx.db.query("testimonials").collect();
    const pendingTestimonials = (
      await ctx.db
        .query("testimonials")
        .withIndex("by_status_created", (q) => q.eq("status", "pending"))
        .collect()
    ).length;
    const publishedTestimonials = (
      await ctx.db
        .query("testimonials")
        .withIndex("by_status_sort", (q) => q.eq("status", "accepted"))
        .collect()
    ).length;
    const branches = await ctx.db.query("branches").collect();
    const branchLabels = new Map(branches.map((b) => [b.slug, b.label]));

    const recentPaid = paidOrders.filter((o) => (o.paidAt ?? o.createdAt) >= start);

    const ordersTrendMap = new Map(dayKeys.map((k) => [k, { orders: 0, revenue: 0 }]));
    for (const order of recentOrders) {
      const key = dayStart(order.createdAt);
      const bucket = ordersTrendMap.get(key);
      if (!bucket) continue;
      bucket.orders += 1;
    }
    for (const order of recentPaid) {
      const key = dayStart(order.paidAt ?? order.createdAt);
      const bucket = ordersTrendMap.get(key);
      if (!bucket) continue;
      bucket.revenue += order.total;
    }

    const ordersTrend = dayKeys.map((timestamp) => {
      const data = ordersTrendMap.get(timestamp) ?? { orders: 0, revenue: 0 };
      return {
        timestamp,
        orders: data.orders,
        revenue: Math.round(data.revenue * 100) / 100,
      };
    });

    const signupsMap = new Map(dayKeys.map((k) => [k, 0]));
    for (const user of recentUsers) {
      const key = dayStart(user.createdAt);
      signupsMap.set(key, (signupsMap.get(key) ?? 0) + 1);
    }
    const signupsTrend = dayKeys.map((timestamp) => ({
      timestamp,
      count: signupsMap.get(timestamp) ?? 0,
    }));

    const branchMap = new Map<string, { orders: number; revenue: number }>();
    for (const order of paidOrders) {
      const slug = orderBranchSlug(order);
      if (!slug) continue;
      const prev = branchMap.get(slug) ?? { orders: 0, revenue: 0 };
      branchMap.set(slug, {
        orders: prev.orders + 1,
        revenue: prev.revenue + order.total,
      });
    }
    const ordersByBranch = Array.from(branchMap.entries())
      .map(([branchSlug, data]) => ({
        branchSlug,
        label: branchLabels.get(branchSlug) ?? branchSlug.replace(/-/g, " "),
        orders: data.orders,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.orders - a.orders);

    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of recentPaid) {
      for (const line of order.items) {
        const name = line.name.trim() || "Unknown item";
        const prev = itemMap.get(name) ?? { name, quantity: 0, revenue: 0 };
        itemMap.set(name, {
          name,
          quantity: prev.quantity + line.quantity,
          revenue: prev.revenue + line.price * line.quantity,
        });
      }
    }
    const topMenuItems = Array.from(itemMap.values())
      .map((row) => ({
        ...row,
        revenue: Math.round(row.revenue * 100) / 100,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    const customerMap = new Map<
      string,
      { label: string; orders: number; revenue: number }
    >();
    for (const order of paidOrders) {
      const key = order.userId ?? order.customerEmail.trim().toLowerCase();
      const label = order.customerName.trim() || order.customerEmail || "Guest";
      const prev = customerMap.get(key) ?? { label, orders: 0, revenue: 0 };
      customerMap.set(key, {
        label: prev.label || label,
        orders: prev.orders + 1,
        revenue: prev.revenue + order.total,
      });
    }
    const topCustomers = Array.from(customerMap.values())
      .map((row) => ({
        ...row,
        revenue: Math.round(row.revenue * 100) / 100,
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);

    const statusKeys = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ] as const;
    const orderStatusCounts: Record<string, number> = {};
    for (const status of statusKeys) {
      orderStatusCounts[status] = recentOrders.filter((o) => o.status === status).length;
    }

    const revenueLast14Days = recentPaid.reduce((sum, o) => sum + o.total, 0);
    const revenueAllTime = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue14d =
      recentPaid.length > 0
        ? Math.round((revenueLast14Days / recentPaid.length) * 100) / 100
        : 0;
    const primaryCurrency =
      branches.find((b) => b.active)?.currency ??
      orders.find((o) => o.currency)?.currency;

    return {
      computedAt: now,
      periodDays: OVERVIEW_DAYS,
      displayCurrency: currencyOrDefault(primaryCurrency),
      totals: {
        clients: users.length,
        newClients14d: recentUsers.length,
        orders: orders.length,
        orders14d: recentOrders.length,
        paidOrders: paidOrders.length,
        paidOrders14d: recentPaid.length,
        revenue14d: Math.round(revenueLast14Days * 100) / 100,
        revenueAllTime: Math.round(revenueAllTime * 100) / 100,
        avgOrderValue14d,
        reservations: reservations.length,
        pendingReservations,
        messages: messages.length,
        pendingMessages,
        testimonials: testimonials.length,
        pendingTestimonials,
        publishedTestimonials,
      },
      ordersTrend,
      signupsTrend,
      ordersByBranch,
      topMenuItems,
      topCustomers,
      orderStatusCounts,
    };
  },
});
