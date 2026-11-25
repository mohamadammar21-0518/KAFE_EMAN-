import type { Doc } from "../../convex/_generated/dataModel";

export const ORDER_STATUS_PIPELINE = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
] as const;

export type OrderStatus = Doc<"orders">["status"];

export function orderStatusRank(status: string): number {
  if (status === "cancelled") return 100;
  const index = ORDER_STATUS_PIPELINE.indexOf(status as (typeof ORDER_STATUS_PIPELINE)[number]);
  return index === -1 ? 50 : index;
}

export function compareOrdersByStatusThenCreated(
  a: { status: string; createdAt: number },
  b: { status: string; createdAt: number },
) {
  const byStatus = orderStatusRank(a.status) - orderStatusRank(b.status);
  if (byStatus !== 0) return byStatus;
  return a.createdAt - b.createdAt;
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Accepted";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready for pickup";
    case "completed":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

/** Customer account: simplified track steps (pending → processing → ready → delivered). */
export const CUSTOMER_ORDER_TRACK_STEPS = [
  { id: "pending", label: "Pending", hint: "We received your order" },
  { id: "processing", label: "Processing", hint: "Your order is being prepared" },
  { id: "ready", label: "Ready to collect", hint: "Come pick up when you're ready" },
  { id: "completed", label: "Delivered", hint: "Order completed" },
] as const;

export function customerOrderTrackStepIndex(status: string): number {
  if (status === "cancelled") return -1;
  if (status === "pending") return 0;
  if (status === "confirmed" || status === "preparing") return 1;
  if (status === "ready") return 2;
  if (status === "completed") return 3;
  return 0;
}

/** Short label shown prominently on the customer dashboard. */
export function customerOrderStatusHeadline(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
    case "preparing":
      return "Processing";
    case "ready":
      return "Ready to collect";
    case "completed":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return orderStatusLabel(status);
  }
}

/** One-line status message for the customer. */
export function customerOrderStatusMessage(status: string): string {
  switch (status) {
    case "pending":
      return "Your order is pending. The café will confirm it shortly.";
    case "confirmed":
      return "Your order was accepted and is moving into the kitchen.";
    case "preparing":
      return "Your order is being prepared right now.";
    case "ready":
      return "Your order is ready to collect — head to the branch when you can.";
    case "completed":
      return "This order has been delivered. Thank you for visiting Kafe Eman!";
    case "cancelled":
      return "This order was cancelled.";
    default:
      return "";
  }
}

export type OrderStatusAction = {
  status: OrderStatus;
  label: string;
  variant?: "danger" | "primary";
  requiresReason?: boolean;
};

export function allowedOrderStatusActions(status: OrderStatus): OrderStatusAction[] {
  switch (status) {
    case "pending":
      return [
        { status: "confirmed", label: "Accept", variant: "primary" },
        { status: "cancelled", label: "Cancel order", variant: "danger", requiresReason: true },
      ];
    case "confirmed":
      return [
        { status: "preparing", label: "Start preparing", variant: "primary" },
        { status: "cancelled", label: "Cancel order", variant: "danger", requiresReason: true },
      ];
    case "preparing":
      return [
        { status: "ready", label: "Ready for pickup", variant: "primary" },
        { status: "cancelled", label: "Cancel order", variant: "danger", requiresReason: true },
      ];
    case "ready":
      return [{ status: "completed", label: "Mark delivered", variant: "primary" }];
    default:
      return [];
  }
}
