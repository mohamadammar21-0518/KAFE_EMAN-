import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AppModal } from "@/components/ui/AppModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import { formatPrice } from "@/data/content";
import { orderCurrency } from "@/lib/orderCurrency";
import { paymentMethodLabel } from "@/lib/loyalty";
import { customerOrderStatusHeadline } from "@/lib/orderStatusFlow";

export function CustomerOrderDetailModal({
  orderId,
  onClose,
}: {
  orderId: Id<"orders"> | null;
  onClose: () => void;
}) {
  const formatBranch = useFormatBranchLabel();
  const detail = useQuery(
    api.users.getMyOrderDetail,
    orderId ? { orderId } : "skip",
  );

  const order = detail?.order;

  return (
    <AppModal
      open={orderId !== null}
      onClose={onClose}
      title={order?.orderNumber ?? "Order details"}
      subtitle={
        order
          ? `Placed ${formatDateTime(order.createdAt)}`
          : "Full summary of your order"
      }
      wide
      softBackdrop
    >
      {detail === undefined && <p className="text-sm text-muted">Loading order…</p>}
      {detail === null && (
        <p className="text-sm text-red-700">This order could not be found or is not linked to your account.</p>
      )}
      {order && (
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-outline/40 bg-white px-2.5 py-0.5 text-xs font-semibold text-coffee-dark">
              {customerOrderStatusHeadline(order.status)}
            </span>
            <StatusBadge label={order.paymentStatus} variant="payment" />
            {order.paymentMethod && (
              <span className="rounded-full border border-outline/40 bg-white px-2.5 py-0.5 text-xs text-on-surface">
                {paymentMethodLabel(order.paymentMethod)}
              </span>
            )}
            {order.couponApplied && (
              <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-2.5 py-0.5 text-xs text-brand-green">
                {order.couponCode ? `Coupon ${order.couponCode}` : "Coupon used"}
              </span>
            )}
          </div>

          {order.status === "cancelled" && order.cancellationReason && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="text-xs font-medium uppercase tracking-[0.1em]">Cancellation reason</p>
              <p className="mt-2">{order.cancellationReason}</p>
            </section>
          )}

          <section className="rounded-xl border border-outline/40 bg-cream/30 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">Order information</p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-muted">Order number</dt>
                <dd className="font-medium text-coffee-dark">{order.orderNumber}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-muted">Branch</dt>
                <dd>{formatBranch(resolveBranchSlug(order))}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-muted">Date & time</dt>
                <dd>{formatDateTime(order.createdAt)}</dd>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-muted">Last updated</dt>
                  <dd>{formatDateTime(order.updatedAt)}</dd>
                </div>
              )}
              {order.paidAt && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-muted">Paid</dt>
                  <dd>{formatDateTime(order.paidAt)}</dd>
                </div>
              )}
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-muted">Payment status</dt>
                <dd className="capitalize">{order.paymentStatus}</dd>
              </div>
              {order.paymentMethod && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-muted">Payment method</dt>
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
              {order.pointsEarned != null && order.pointsEarned > 0 && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-muted">Reward points</dt>
                  <dd className="text-brand-green">+{order.pointsEarned}</dd>
                </div>
              )}
              {order.couponApplied && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-muted">Coupon</dt>
                  <dd>
                    {order.couponCode ?? "Applied"}
                    {order.freeItemName ? ` · Free: ${order.freeItemName}` : null}
                  </dd>
                </div>
              )}
              {order.discountAmount != null && order.discountAmount > 0 && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-brand-green">
                    −{formatPrice(order.discountAmount, orderCurrency(order))}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold text-coffee-dark">Items</p>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li
                  key={`${item.name}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline/40 bg-white px-3 py-2.5 text-sm sm:px-4 sm:py-3"
                >
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(item.price * item.quantity, orderCurrency(order))}
                  </span>
                </li>
              ))}
            </ul>
            {order.subtotalBeforeDiscount != null && order.discountAmount ? (
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
        </div>
      )}
    </AppModal>
  );
}
