import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Package } from "lucide-react";
import { useQuery } from "convex/react";
import { OrderDetailModal } from "@/admin/components/OrderDetailModal";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import { formatPrice } from "@/data/content";
import { orderCurrency } from "@/lib/orderCurrency";
import { cn } from "@/lib/utils";
import type { BranchId } from "@/branch/BranchContext";
import { useAdminBranchOptions } from "@/admin/hooks/useAdminBranchOptions";
import { useAdminToken } from "@/admin/useAdminToken";
import { paymentMethodLabel } from "@/lib/loyalty";
import { compareOrdersByStatusThenCreated } from "@/lib/orderStatusFlow";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type AdminOrdersTab =
  | "all"
  | "new"
  | "processing"
  | "cancelled"
  | "delivered"
  | "history";

const PROCESSING_STATUSES: OrderStatus[] = ["confirmed", "preparing", "ready"];
const HISTORY_STATUSES: OrderStatus[] = ["completed", "cancelled"];

export const ADMIN_ORDERS_TABS: Array<{
  id: AdminOrdersTab;
  label: string;
  description: string;
}> = [
  {
    id: "all",
    label: "All orders",
    description: "Every order, newest first.",
  },
  {
    id: "new",
    label: "New orders",
    description: "Pending orders awaiting acceptance (latest first).",
  },
  {
    id: "processing",
    label: "Processing",
    description: "Accepted and in preparation or ready for pickup.",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    description: "Orders cancelled with a reason.",
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Successfully completed orders.",
  },
  {
    id: "history",
    label: "History",
    description: "Completed and cancelled orders (archive).",
  },
];

function filterOrdersByTab(orders: Doc<"orders">[], tab: AdminOrdersTab): Doc<"orders">[] {
  switch (tab) {
    case "all":
      return orders;
    case "new":
      return orders.filter((o) => o.status === "pending");
    case "processing":
      return orders.filter((o) => PROCESSING_STATUSES.includes(o.status as OrderStatus));
    case "cancelled":
      return orders.filter((o) => o.status === "cancelled");
    case "delivered":
      return orders.filter((o) => o.status === "completed");
    case "history":
      return orders.filter((o) => HISTORY_STATUSES.includes(o.status as OrderStatus));
    default:
      return orders;
  }
}

function sortOrders(list: Doc<"orders">[], tab: AdminOrdersTab): Doc<"orders">[] {
  if (tab === "new" || tab === "all" || tab === "cancelled" || tab === "delivered" || tab === "history") {
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }
  return [...list].sort(compareOrdersByStatusThenCreated);
}

export function useAdminOrdersPage() {
  const adminToken = useAdminToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminOrdersTab | null;
  const tab =
    tabParam && ADMIN_ORDERS_TABS.some((t) => t.id === tabParam) ? tabParam : "new";

  const setTab = (next: AdminOrdersTab) => {
    setSearchParams(next === "new" ? {} : { tab: next }, { replace: true });
  };

  const [branchFilter, setBranchFilter] = useState<"all" | BranchId>("all");
  const [search, setSearch] = useState("");
  const [viewOrderId, setViewOrderId] = useState<Id<"orders"> | null>(null);

  const orders = useQuery(
    api.orders.list,
    adminToken
      ? {
          adminToken,
          branchSlug: branchFilter === "all" ? undefined : branchFilter,
        }
      : "skip",
  );

  const filtered = useMemo(() => {
    if (!orders) return [];
    let list = filterOrdersByTab(orders, tab);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q),
      );
    }

    return sortOrders(list, tab);
  }, [orders, tab, search]);

  const counts = useMemo(() => {
    const base: Record<AdminOrdersTab, number> = {
      all: 0,
      new: 0,
      processing: 0,
      cancelled: 0,
      delivered: 0,
      history: 0,
    };
    if (!orders) return base;
    for (const o of orders) {
      base.all += 1;
      if (o.status === "pending") base.new += 1;
      if (PROCESSING_STATUSES.includes(o.status as OrderStatus)) base.processing += 1;
      if (o.status === "cancelled") base.cancelled += 1;
      if (o.status === "completed") base.delivered += 1;
      if (HISTORY_STATUSES.includes(o.status as OrderStatus)) base.history += 1;
    }
    return base;
  }, [orders]);

  const viewOpen = viewOrderId !== null;

  return {
    orders,
    filtered,
    counts,
    tab,
    setTab,
    branchFilter,
    setBranchFilter,
    search,
    setSearch,
    viewOrderId,
    setViewOrderId,
    viewOpen,
    adminToken,
  };
}

export function AdminOrdersToolbar({
  branchFilter,
  setBranchFilter,
  search,
  setSearch,
}: {
  branchFilter: "all" | BranchId;
  setBranchFilter: (v: "all" | BranchId) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const branchOptions = useAdminBranchOptions();

  return (
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
        aria-label="Filter by branch"
      >
        <option value="all">All branches</option>
        {branchOptions.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AdminOrdersTabs({
  tab,
  setTab,
  counts,
}: {
  tab: AdminOrdersTab;
  setTab: (t: AdminOrdersTab) => void;
  counts: Record<AdminOrdersTab, number>;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ADMIN_ORDERS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm",
              tab === t.id
                ? "border-primary/30 bg-primary text-white"
                : "border-outline/40 bg-white/70 text-on-surface hover:bg-primary/10 hover:text-primary",
            )}
          >
            {t.label}
            <span
              className={cn(
                "ml-2 rounded-full px-2 py-0.5 text-[0.65rem]",
                tab === t.id ? "bg-white/20" : "bg-cream text-muted",
              )}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        {ADMIN_ORDERS_TABS.find((t) => t.id === tab)?.description}
      </p>
    </>
  );
}

export function AdminOrdersCardGrid({
  orders,
  filtered,
  viewOrderId,
  setViewOrderId,
  viewOpen,
}: {
  orders: Doc<"orders">[] | undefined;
  filtered: Doc<"orders">[];
  viewOrderId: Id<"orders"> | null;
  setViewOrderId: (id: Id<"orders"> | null) => void;
  viewOpen: boolean;
}) {
  const formatBranch = useFormatBranchLabel();

  return (
    <>
      <div
        className={cn(
          "transition-[filter,opacity] duration-200",
          viewOpen && "pointer-events-none blur-[2px] opacity-90",
        )}
        aria-hidden={viewOpen}
      >
        {!orders ? (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            Loading orders…
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            No orders in this section.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((order) => {
              const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <article
                  key={order._id}
                  className="flex flex-col rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card transition-shadow hover:shadow-soft"
                >
                  <div className="min-h-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-coffee-dark">{order.orderNumber}</p>
                      <StatusBadge label={order.status} variant="order" />
                    </div>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                    <p className="mt-3 font-medium text-on-surface line-clamp-1">
                      {order.customerName}
                    </p>
                    <p className="truncate text-xs text-muted">{order.customerEmail}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                      <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {formatBranch(resolveBranchSlug(order))} · {itemCount} items
                    </p>
                    <p className="mt-2 text-lg font-semibold text-coffee-dark">
                      {formatPrice(order.total, orderCurrency(order))}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <StatusBadge label={order.paymentStatus} variant="payment" />
                      {order.paymentMethod && (
                        <span className="rounded-full border border-outline/40 bg-white px-2 py-0.5 text-[0.65rem] text-muted">
                          {paymentMethodLabel(order.paymentMethod)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 border-t border-outline/30 pt-4">
                    <button
                      type="button"
                      onClick={() => setViewOrderId(order._id)}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-outline/40 text-sm hover:bg-cream"
                      title="View order"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <OrderDetailModal
        orderId={viewOrderId}
        onClose={() => setViewOrderId(null)}
        softBackdrop
      />
    </>
  );
}
