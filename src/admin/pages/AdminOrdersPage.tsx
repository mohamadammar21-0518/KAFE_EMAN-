import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { OrderDetailModal } from "@/admin/components/OrderDetailModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import { formatPrice } from "@/data/content";
import { orderCurrency } from "@/lib/orderCurrency";
import { compareOrdersByStatusThenCreated } from "@/lib/orderStatusFlow";
import { cn } from "@/lib/utils";
import type { BranchId } from "@/branch/BranchContext";
import { useAdminBranchOptions } from "@/admin/hooks/useAdminBranchOptions";
import { useAdminToken } from "@/admin/useAdminToken";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

const STATUS_FILTERS: Array<{ id: "all" | OrderStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Accepted" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export function AdminOrdersPage() {
  const adminToken = useAdminToken();
  const orders = useQuery(
    api.orders.list,
    adminToken ? { adminToken } : "skip",
  );
  const updatePayment = useMutation(api.orders.updatePaymentStatus);
  const formatBranch = useFormatBranchLabel();
  const branchOptions = useAdminBranchOptions();

  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [branchFilter, setBranchFilter] = useState<"all" | BranchId>("all");
  const [search, setSearch] = useState("");
  const [viewOrderId, setViewOrderId] = useState<Id<"orders"> | null>(null);

  const filtered = useMemo(() => {
    if (!orders) return [];
    let list = [...orders];
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (branchFilter !== "all") {
      list = list.filter((o) => resolveBranchSlug(o) === branchFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q),
      );
    }
    if (statusFilter === "completed" || statusFilter === "cancelled") {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list.sort(compareOrdersByStatusThenCreated);
  }, [orders, statusFilter, branchFilter, search]);

  return (
    <div className="space-y-6">
      <OrderDetailModal orderId={viewOrderId} onClose={() => setViewOrderId(null)} />

      <div>
        <h1 className="text-headline-lg text-coffee-dark">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          Incoming customer orders from the menu checkout. Open an order to move it forward
          (pending → accepted → preparing → ready → delivered) or cancel with a reason.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, name, email…"
          className="min-w-[220px] flex-1 rounded-xl border border-outline/40 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-primary/40"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value as typeof branchFilter)}
          className="rounded-xl border border-outline/40 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-primary/40"
        >
          <option value="all">All branches</option>
          {branchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              statusFilter === f.id
                ? "border-primary/30 bg-primary text-white"
                : "border-outline/40 bg-white/70 text-on-surface hover:bg-primary/10 hover:text-primary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline/40 bg-white/70 shadow-card">
        {!orders ? (
          <p className="p-8 text-center text-sm text-muted">Loading orders…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No orders match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-outline/40 bg-cream/40 text-xs uppercase tracking-[0.1em] text-muted">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: Doc<"orders">) => {
                  const itemCount = order.items.reduce(
                    (s: number, i: { quantity: number }) => s + i.quantity,
                    0,
                  );
                  return (
                    <tr
                      key={order._id}
                      className="border-b border-outline/30 transition hover:bg-primary/8"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-coffee-dark">{order.orderNumber}</p>
                        <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{order.customerName}</p>
                        <p className="text-xs text-muted">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-on-surface">
                        {formatBranch(resolveBranchSlug(order))}
                      </td>
                      <td className="px-4 py-3 text-on-surface">{itemCount}</td>
                      <td className="px-4 py-3 font-semibold text-coffee-dark">
                        {formatPrice(order.total, orderCurrency(order))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={order.paymentStatus} variant="payment" />
                        {order.paymentStatus === "pending" && adminToken && (
                          <button
                            type="button"
                            onClick={() => {
                              void updatePayment({
                                adminToken,
                                orderId: order._id,
                                paymentStatus: "paid",
                              });
                            }}
                            className="mt-1 block text-xs font-medium text-primary hover:underline"
                          >
                            Mark paid
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={order.status} variant="order" />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setViewOrderId(order._id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline/40 hover:bg-white"
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
