import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminModal } from "@/admin/components/AdminModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import { formatPrice } from "@/data/content";
import { orderCurrency } from "@/lib/orderCurrency";
import { formatSuspensionEnd, isSuspendedNow } from "@/lib/userAccess";
import { useAdminToken } from "@/admin/useAdminToken";

export function UserDetailModal({
  userId,
  onClose,
}: {
  userId: Id<"users"> | null;
  onClose: () => void;
}) {
  const adminToken = useAdminToken();
  const customer = useQuery(
    api.admins.getCustomer,
    adminToken && userId ? { adminToken, userId } : "skip",
  );
  const setActive = useMutation(api.admins.setCustomerActive);
  const clearSuspension = useMutation(api.admins.clearCustomerSuspension);
  const formatBranch = useFormatBranchLabel();

  const name = customer
    ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
    : "";

  const suspended = customer ? isSuspendedNow(customer) : false;

  async function handleDeactivate() {
    if (!adminToken || !userId || !customer) return;
    if (!window.confirm(customer.active ? "Deactivate this user?" : "Reactivate this user?")) {
      return;
    }
    await setActive({ adminToken, userId, active: !customer.active });
  }

  async function handleClearSuspension() {
    if (!adminToken || !userId) return;
    await clearSuspension({ adminToken, userId });
  }

  return (
    <AdminModal
      open={userId !== null}
      onClose={onClose}
      title={name || "Customer"}
      subtitle="Signed in via Clerk on the website"
      wide
      softBackdrop
    >
      {!customer && <p className="text-sm text-muted">Loading profile…</p>}
      {customer && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {customer.avatarUrl ? (
              <img
                src={customer.avatarUrl}
                alt=""
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : null}
            <div>
              <p className="font-semibold text-coffee-dark">{name}</p>
              <p className="text-sm text-muted">{customer.email}</p>
              {!customer.active ? (
                <span className="mt-1 inline-block text-xs font-medium text-red-600">
                  Deactivated
                </span>
              ) : suspended ? (
                <span className="mt-1 inline-block text-xs font-medium text-amber-700">
                  Suspended until {formatSuspensionEnd(customer.suspendedUntil!)}
                </span>
              ) : (
                <span className="mt-1 inline-block text-xs font-medium text-brand-green">
                  Active
                </span>
              )}
            </div>
          </div>

          {suspended && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm text-amber-900">
              <p className="font-medium">Checkout blocked</p>
              <p className="mt-1">
                This customer cannot place orders until{" "}
                {formatSuspensionEnd(customer.suspendedUntil!)}.
              </p>
              {customer.suspensionReason && (
                <p className="mt-2 text-xs text-amber-800/90">
                  Reason: {customer.suspensionReason}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleClearSuspension()}
                className="mt-3 rounded-full border border-amber-300 bg-white px-4 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50"
              >
                Lift suspension now
              </button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4 text-center">
              <p className="text-xs text-muted">Orders</p>
              <p className="text-2xl font-semibold text-coffee-dark">{customer.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4 text-center">
              <p className="text-xs text-muted">Reward points</p>
              <p className="text-2xl font-semibold text-coffee-dark">{customer.points}</p>
            </div>
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4 text-center">
              <p className="text-xs text-muted">Coupons</p>
              <p className="text-2xl font-semibold text-coffee-dark">{customer.activeCoupons}</p>
            </div>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">User ID</dt>
              <dd className="font-mono text-xs break-all">{customer._id}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd>
                {customer.phone ?? "—"}
                {customer.phoneVerified && (
                  <span className="ml-2 text-xs text-brand-green">Verified</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Home branch</dt>
              <dd>
                {customer.branchSlug ? formatBranch(customer.branchSlug) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Joined</dt>
              <dd>{formatDateTime(customer.createdAt)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Clerk user ID</dt>
              <dd className="font-mono text-xs break-all">{customer.clerkUserId}</dd>
            </div>
          </dl>

          {customer.orders.length > 0 && (
            <section>
              <p className="mb-3 text-sm font-semibold text-coffee-dark">Recent orders</p>
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {customer.orders.slice(0, 8).map((order) => (
                  <li
                    key={order._id}
                    className="flex items-center justify-between rounded-xl border border-outline/40 bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted">
                        {formatBranch(resolveBranchSlug(order))} ·{" "}
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(order.total, orderCurrency(order))}
                      </p>
                      <StatusBadge label={order.status} variant="order" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap gap-2 border-t border-outline/40 pt-4">
            <button
              type="button"
              onClick={() => void handleDeactivate()}
              className="rounded-full border border-outline/40 px-4 py-2 text-sm font-medium hover:bg-cream"
            >
              {customer.active ? "Deactivate user" : "Reactivate user"}
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
