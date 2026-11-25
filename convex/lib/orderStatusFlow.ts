/** Forward-only kitchen pipeline (stored values in `orders.status`). */

export const ORDER_STATUS_PIPELINE = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
] as const;

export type PipelineOrderStatus = (typeof ORDER_STATUS_PIPELINE)[number];

export type OrderStatusValue = PipelineOrderStatus | "cancelled";

export function orderStatusRank(status: string): number {
  if (status === "cancelled") return 100;
  const index = ORDER_STATUS_PIPELINE.indexOf(status as PipelineOrderStatus);
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

export function assertValidStatusTransition(
  current: OrderStatusValue,
  next: OrderStatusValue,
  cancellationReason?: string,
) {
  if (current === next) {
    throw new Error("Order is already in this status.");
  }

  if (next === "cancelled") {
    if (current === "completed" || current === "cancelled") {
      throw new Error("This order cannot be cancelled.");
    }
    if (current === "ready") {
      throw new Error("Ready orders can only be marked delivered, not cancelled.");
    }
    if (!cancellationReason?.trim()) {
      throw new Error("A cancellation reason is required.");
    }
    return;
  }

  if (current === "cancelled" || current === "completed") {
    throw new Error("Cannot change status after the order is delivered or cancelled.");
  }

  const currentIndex = ORDER_STATUS_PIPELINE.indexOf(current as PipelineOrderStatus);
  const nextIndex = ORDER_STATUS_PIPELINE.indexOf(next as PipelineOrderStatus);

  if (currentIndex === -1 || nextIndex === -1) {
    throw new Error("Invalid order status.");
  }

  if (nextIndex !== currentIndex + 1) {
    throw new Error(
      `Cannot move from ${statusLabel(current)} to ${statusLabel(next)}. Only the next step is allowed.`,
    );
  }
}

export function statusLabel(status: string): string {
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
