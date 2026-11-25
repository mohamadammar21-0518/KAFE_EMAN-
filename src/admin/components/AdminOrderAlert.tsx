import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { createPortal } from "react-dom";
import { Bell, X, ShoppingBag, Check, ExternalLink, Bot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAdminToken } from "@/admin/useAdminToken";

type Notification = {
  _id: Id<"aiNotifications">;
  orderId: Id<"orders">;
  message: string;
  notificationType: "new_order" | "order_ready";
  read: boolean;
  createdAt: number;
  order: {
    orderNumber: string;
    customerName: string;
    branchSlug?: string;
    status: string;
    total: number;
    currency?: string;
  } | null;
};

/**
 * Admin Order Alert — floating notification overlay for the admin panel.
 * Shows order alerts when new orders arrive or when orders are ready.
 * Staff can accept or dismiss notifications.
 */
export function AdminOrderAlert() {
  const navigate = useNavigate();
  const adminToken = useAdminToken();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const notifications = useQuery(
    api.ai.notifications.listUnread,
    adminToken ? { adminToken } : "skip"
  ) as Notification[] | undefined;

  const markAsRead = useMutation(api.ai.notifications.markAsRead);
  const updateOrderStatus = useMutation(api.orders.updateStatus);

  // Get unread notifications not yet dismissed
  const activeNotifications = (notifications || []).filter(
    (n) => !dismissed.has(n._id)
  ).slice(0, 3); // Max 3 visible at once

  async function handleDismiss(notificationId: Id<"aiNotifications">) {
    setDismissed((prev) => new Set([...prev, notificationId]));
    if (adminToken) {
      await markAsRead({ notificationId, adminToken });
    }
  }

  async function handleAccept(notification: Notification) {
    if (!adminToken || !notification.order) return;

    try {
      await updateOrderStatus({
        orderId: notification.orderId,
        status: "confirmed",
        adminToken,
      });
      await handleDismiss(notification._id);
    } catch (err) {
      console.error("Failed to accept order:", err);
    }
  }

  async function handleViewOrder(notification: Notification) {
    await handleDismiss(notification._id);
    navigate("/admin/orders");
  }

  if (activeNotifications.length === 0) return null;

  return createPortal(
    <div className="fixed right-4 top-16 z-[450] flex flex-col gap-2 sm:right-6 sm:top-20">
      <AnimatePresence>
        {activeNotifications.map((notification) => (
          <motion.div
            key={notification._id}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[320px] overflow-hidden rounded-xl border border-outline/20 bg-surface shadow-xl sm:w-[360px]"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-outline/15 bg-coffee-dark px-4 py-2.5">
              <Bell className="h-4 w-4 text-white/80" />
              <span className="flex-1 text-xs font-medium text-white">
                {notification.notificationType === "new_order" ? "New Order" : "Order Ready"}
              </span>
              <span className="text-xs text-white/50">
                {formatTimeAgo(notification.createdAt)}
              </span>
              <button
                type="button"
                onClick={() => handleDismiss(notification._id)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* AI Message */}
            <div className="px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coffee-dark/10 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-coffee-dark" />
                </div>
                <p className="flex-1 text-sm text-on-surface leading-relaxed">
                  {notification.message}
                </p>
              </div>

              {/* Order summary */}
              {notification.order && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-cream/60 px-3 py-2 text-xs text-muted">
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-on-surface">
                    #{notification.order.orderNumber}
                  </span>
                  <span>·</span>
                  <span>{notification.order.customerName}</span>
                  <span className="ml-auto font-medium text-on-surface">
                    {notification.order.currency || "USD"}{" "}
                    {notification.order.total.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-outline/15 px-4 py-2.5">
              {notification.notificationType === "new_order" && notification.order?.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAccept(notification)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-coffee-dark px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-coffee-dark/90"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewOrder(notification)}
                    className="flex items-center gap-1.5 rounded-full border border-outline/30 px-3 py-1.5 text-xs text-muted transition-colors hover:bg-cream hover:text-on-surface"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </button>
                </>
              )}
              {notification.notificationType !== "new_order" && (
                <button
                  type="button"
                  onClick={() => handleViewOrder(notification)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-coffee-dark px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-coffee-dark/90"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Order
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hr ago";
  return `${hours} hrs ago`;
}
