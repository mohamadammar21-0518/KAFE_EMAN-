import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../lib/adminAuth";

/**
 * AI notifications - query and mark as read
 */

export const listUnread = query({
  args: {
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.adminToken);

    const notifications = await ctx.db
      .query("aiNotifications")
      .withIndex("by_read", (q) => q.eq("read", false))
      .order("desc")
      .take(50);

    // Enrich with order details
    const enriched = await Promise.all(
      notifications.map(async (notification) => {
        const order = await ctx.db.get(notification.orderId);
        return {
          ...notification,
          order: order
            ? {
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                branchSlug: order.branchSlug,
                status: order.status,
                total: order.total,
                currency: order.currency,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

export const markAsRead = mutation({
  args: {
    notificationId: v.id("aiNotifications"),
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.adminToken);

    await ctx.db.patch(args.notificationId, {
      read: true,
    });

    return { success: true };
  },
});

export const markAllAsRead = mutation({
  args: {
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.adminToken);

    const unreadNotifications = await ctx.db
      .query("aiNotifications")
      .withIndex("by_read", (q) => q.eq("read", false))
      .collect();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { read: true })
      )
    );

    return { success: true, count: unreadNotifications.length };
  },
});
