import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminModal } from "@/admin/components/AdminModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import { formatPrice } from "@/data/content";
import { orderCurrency } from "@/lib/orderCurrency";
import { paymentMethodLabel } from "@/lib/loyalty";
import {
  allowedOrderStatusActions,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/orderStatusFlow";
import { useAdminToken } from "@/admin/useAdminToken";
import { cn } from "@/lib/utils";

export function OrderDetailModal({
  orderId,
  onClose,
  softBackdrop,
}: {
  orderId: Id<"orders"> | null;
  onClose: () => void;
  softBackdrop?: boolean;
}) {
  const adminToken = useAdminToken();
  const detail = useQuery(
    api.orders.getDetail,
    adminToken && orderId ? { adminToken, orderId } : "skip",
  );
  const updateStatus = useMutation(api.orders.updateStatus);
  const updatePayment = useMutation(api.orders.updatePaymentStatus);
  const formatBranch = useFormatBranchLabel();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const order = detail?.order;
  const customer = detail?.customer;
  const actions = order ? allowedOrderStatusActions(order.status as OrderStatus) : [];

  async function applyStatus(status: OrderStatus, reason?: string) {
    if (!adminToken || !orderId) return;
    setStatusError(null);
    setBusy(true);
    try {
      await updateStatus({
        adminToken,
        orderId,
        status,
        cancellationReason: reason,
      });
      setCancelOpen(false);
      setCancelReason("");
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminModal
      open={orderId !== null}
      onClose={onClose}
      title={order?.orderNumber ?? "Order"}
      subtitle={
        order
          ? `Placed ${formatDateTime(order.createdAt)}`
          : "Customer order from website checkout"
      }
      wide
      softBackdrop={softBackdrop}
    >
      {!detail && <p className="text-sm text-muted">Loading order…</p>}
      {order && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={order.status} variant="order" />
            <StatusBadge label={order.paymentStatus} variant="payment" />
            {order.couponApplied && (
              <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-2.5 py-0.5 text-xs text-brand-green">
                {order.couponCode ? `Coupon ${order.couponCode}` : "Coupon used"}
              </span>
            )}
            {order.paymentMethod && (
              <span className="rounded-full border border-outline/40 bg-white px-2.5 py-0.5 text-xs text-on-surface">
                {paymentMethodLabel(order.paymentMethod)}
              </span>
            )}
          </div>

          {order.status === "cancelled" && order.cancellationReason && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="text-xs font-medium uppercase tracking-[0.1em]">Cancellation reason</p>
              <p className="mt-2">{order.cancellationReason}</p>
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-outline/40 bg-cream/30 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">Customer</p>
              <p className="mt-2 font-semibold text-coffee-dark">{order.customerName}</p>
              <p className="text-sm text-muted">{order.customerEmail}</p>
              {order.customerPhone && (
                <p className="text-sm text-muted">{order.customerPhone}</p>
              )}
              {customer && (
                <div className="mt-3 space-y-1 border-t border-outline/30 pt-3 text-xs text-muted">
                  <p>Clerk account · signed-in customer</p>
                  {customer.address && <p>Address: {customer.address}</p>}
                  {customer.country && <p>Country: {customer.country}</p>}
                  <p>Reward points: {customer.points}</p>
                  <p>Total orders: {customer.totalOrders}</p>
                </div>
              )}
            </section>
            <section className="rounded-xl border border-outline/40 bg-cream/30 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">Order info</p>
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Branch</dt>
                  <dd>{formatBranch(resolveBranchSlug(order))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Placed</dt>
                  <dd>{formatDateTime(order.createdAt)}</dd>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Paid</dt>
                    <dd>{formatDateTime(order.paidAt)}</dd>
                  </div>
                )}
                {order.pointsEarned != null && order.pointsEarned > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Points earned</dt>
                    <dd className="text-brand-green">+{order.pointsEarned}</dd>
                  </div>
                )}
                {order.paymentMethod && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Payment</dt>
                    <dd>
                      {paymentMethodLabel(order.paymentMethod)}
                      {order.paymentMethod === "card" && order.cardLast4
                        ? ` · ${order.cardBrand ?? "Card"} •••• ${order.cardLast4}`
                        : null}
                      {order.paymentMethod === "other" && order.paymentMethodNote
                        ? ` — ${order.paymentMethodNote}`
                        : null}
                    </dd>
                  </div>
                )}
                {order.couponApplied && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Coupon</dt>
                    <dd>
                      {order.couponCode ?? "Applied"}
                      {order.freeItemName ? ` · Free: ${order.freeItemName}` : null}
                    </dd>
                  </div>
                )}
                {order.discountAmount != null && order.discountAmount > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Discount</dt>
                    <dd className="text-brand-green">
                      −{formatPrice(order.discountAmount, orderCurrency(order))}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          </div>

          <section>
            <p className="mb-3 text-sm font-semibold text-coffee-dark">Items</p>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li
                  key={`${item.name}-${i}`}
                  className="flex justify-between rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm"
                >
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.price * item.quantity, orderCurrency(order))}
                  </span>
                </li>
              ))}
            </ul>
            {(order.subtotalBeforeDiscount != null && order.discountAmount) ? (
              <div className="mt-3 space-y-1 text-right text-sm">
                <p className="text-muted">
                  Subtotal {formatPrice(order.subtotalBeforeDiscount, orderCurrency(order))}
                </p>
                <p className="text-brand-green">
                  Discount −{formatPrice(order.discountAmount, orderCurrency(order))}
                </p>
                <p className="text-lg font-semibold text-coffee-dark">
                  Total {formatPrice(order.total, orderCurrency(order))}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-right text-lg font-semibold text-coffee-dark">
                Total {formatPrice(order.total, orderCurrency(order))}
              </p>
            )}
          </section>

          {order.notes && (
            <section className="rounded-xl border border-outline/40 bg-white p-4 text-sm">
              <p className="text-xs font-medium uppercase text-muted">Notes</p>
              <p className="mt-2 text-on-surface">{order.notes}</p>
            </section>
          )}

          {actions.length > 0 && (
            <section>
              <p className="mb-1 text-sm font-semibold text-coffee-dark">Next step</p>
              <p className="mb-3 text-xs text-muted">
                Current: {orderStatusLabel(order.status)}. Only forward moves are allowed
                (pending → accepted → preparing → ready → delivered).
              </p>
              {statusError && (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {statusError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {actions.map((action) =>
                  action.requiresReason ? (
                    <button
                      key={action.status}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setCancelOpen(true);
                        setStatusError(null);
                      }}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-40",
                        "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                      )}
                    >
                      {action.label}
                    </button>
                  ) : (
                    <button
                      key={action.status}
                      type="button"
                      disabled={busy}
                      onClick={() => void applyStatus(action.status)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-40",
                        action.variant === "primary"
                          ? "border-primary/30 bg-primary text-white hover:bg-primary/90"
                          : "border-outline/40 bg-white hover:bg-cream",
                      )}
                    >
                      {action.label}
                    </button>
                  ),
                )}
              </div>
              {cancelOpen && (
                <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
                  <label className="block text-sm font-medium text-coffee-dark">
                    Cancellation reason
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-outline/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
                      placeholder="Why is this order being cancelled?"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !cancelReason.trim()}
                      onClick={() => void applyStatus("cancelled", cancelReason.trim())}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                    >
                      Confirm cancellation
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setCancelOpen(false);
                        setCancelReason("");
                      }}
                      className="rounded-full border border-outline/40 bg-white px-4 py-2 text-sm"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {order.paymentStatus === "pending" && (
            <button
              type="button"
              onClick={() => {
                if (!adminToken || !orderId) return;
                void updatePayment({ adminToken, orderId, paymentStatus: "paid" });
              }}
              className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
            >
              Mark payment received
            </button>
          )}
        </div>
      )}
    </AdminModal>
  );
}
