import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Staff should receive a new-order alert even when the AI provider is offline.
export const notifyNewOrder = internalMutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) return;
    const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    await ctx.db.insert("aiNotifications", {
      orderId, notificationType: "new_order", read: false, createdAt: Date.now(),
      message: `New order #${order.orderNumber} from ${order.customerName} · ${quantity} item${quantity === 1 ? "" : "s"} · ${order.currency ?? "USD"} ${order.total.toFixed(2)}`,
    });
  },
});
