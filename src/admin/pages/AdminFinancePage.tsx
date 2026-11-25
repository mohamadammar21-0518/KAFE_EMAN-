import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { useAdminBranchOptions } from "@/admin/hooks/useAdminBranchOptions";
import { FINANCE_PERIODS, formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import type { BranchId } from "@/branch/BranchContext";
import { formatPrice } from "@/data/content";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { DollarSign, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { useAdminToken } from "@/admin/useAdminToken";

type FinancePeriod = (typeof FINANCE_PERIODS)[number]["id"];

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof DollarSign;
}) {
  return (
    <div className="rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-coffee-dark">{value}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function AdminFinancePage() {
  const adminToken = useAdminToken();
  const branchOptions = useAdminBranchOptions();
  const [period, setPeriod] = useState<FinancePeriod>("daily");
  const [branchFilter, setBranchFilter] = useState<"all" | BranchId>("all");
  const summary = useQuery(
    api.orders.financeSummary,
    adminToken
      ? {
          adminToken,
          period,
          branchSlug: branchFilter === "all" ? undefined : branchFilter,
        }
      : "skip",
  );
  const formatBranch = useFormatBranchLabel();
  const displayCurrency = summary?.displayCurrency ?? DEFAULT_CURRENCY;

  useEffect(() => {
    if (branchOptions.length === 0 || branchFilter !== "all") return;
    setBranchFilter(branchOptions[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- default to first branch once options load
  }, [branchOptions]);

  const maxRevenue = Math.max(
    ...(summary?.trend.map((t: { revenue: number }) => t.revenue) ?? [1]),
    1,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg text-coffee-dark">Finance</h1>
        <p className="mt-1 text-sm text-muted">
          Revenue from paid customer orders. Pick a branch to see totals in that branch&apos;s
          currency (set under Branches).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value as typeof branchFilter)}
          className="rounded-xl border border-outline/40 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-primary/40"
          aria-label="Filter by branch"
        >
          {branchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {FINANCE_PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              period === p.id
                ? "border-primary/30 bg-primary text-white shadow-soft"
                : "border-outline/40 bg-white/70 text-on-surface hover:bg-primary/10 hover:text-primary",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!summary ? (
        <p className="text-sm text-muted">Loading finance data…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard
              title="Total revenue"
              value={formatPrice(summary.totalRevenue, displayCurrency)}
              hint={`${FINANCE_PERIODS.find((p) => p.id === period)?.label} · ${displayCurrency} · paid orders`}
              icon={DollarSign}
            />
            <KpiCard
              title="Paid transactions"
              value={String(summary.paidCount)}
              hint={`${summary.pendingPaymentCount} awaiting payment`}
              icon={Receipt}
            />
            <KpiCard
              title="Total orders"
              value={String(summary.orderCount)}
              hint="All orders in period"
              icon={ShoppingCart}
            />
            <KpiCard
              title="Avg. order value"
              value={formatPrice(summary.averageOrderValue, displayCurrency)}
              hint={`Revenue ÷ paid orders · ${displayCurrency}`}
              icon={TrendingUp}
            />
            <KpiCard
              title="Loyalty points issued"
              value={String(summary.loyaltyPointsIssued)}
              hint="Points granted on paid orders"
              icon={TrendingUp}
            />
            <KpiCard
              title="Coupon orders"
              value={String(summary.couponOrders)}
              hint="Free-order redemptions"
              icon={Receipt}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-outline/40 bg-white/70 p-6 shadow-card">
              <p className="text-sm font-semibold text-coffee-dark">Revenue by branch</p>
              <ul className="mt-4 space-y-2">
                {summary.branchBreakdown.length === 0 ? (
                  <li className="text-sm text-muted">No paid orders in this period.</li>
                ) : (
                  summary.branchBreakdown.map(
                    (row: {
                      branchId: string;
                      currency: string;
                      revenue: number;
                      orders: number;
                    }) => (
                      <li
                        key={row.branchId}
                        className="flex justify-between rounded-xl border border-outline/30 bg-cream/20 px-4 py-2 text-sm"
                      >
                        <span>{formatBranch(row.branchId)}</span>
                        <span className="font-medium">
                          {formatPrice(row.revenue, row.currency)} · {row.orders} orders
                        </span>
                      </li>
                    ),
                  )
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-outline/40 bg-white/70 p-6 shadow-card">
              <p className="text-sm font-semibold text-coffee-dark">Orders by status</p>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(summary.statusCounts).map(([status, count]) => (
                  <li
                    key={status}
                    className="flex justify-between rounded-xl border border-outline/30 px-3 py-2 capitalize"
                  >
                    <span className="text-muted">{status}</span>
                    <span className="font-medium">{count as number}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {summary.trend.length > 0 && (
            <div className="rounded-2xl border border-outline/40 bg-white/70 p-6 shadow-card">
              <p className="text-sm font-semibold text-coffee-dark">Revenue trend</p>
              <p className="mt-1 text-xs text-muted">Paid order revenue across the selected period</p>
              <div className="mt-6 flex h-40 items-end gap-1.5">
                {summary.trend.map((bucket: { timestamp: number; revenue: number; orders: number }) => (
                  <div
                    key={bucket.timestamp}
                    className="group flex flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-primary to-primary/50 transition-all group-hover:from-coffee-dark group-hover:to-primary"
                      style={{
                        height: `${Math.max(8, (bucket.revenue / maxRevenue) * 100)}%`,
                      }}
                      title={`${formatPrice(bucket.revenue, displayCurrency)} · ${bucket.orders} orders`}
                    />
                    <span className="hidden text-[10px] text-muted sm:block">
                      {new Date(bucket.timestamp).toLocaleDateString("en-MY", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-outline/40 bg-white/70 shadow-card">
            <div className="border-b border-outline/40 px-5 py-4">
              <p className="text-sm font-semibold text-coffee-dark">Transactions</p>
              <p className="text-xs text-muted">Paid orders in this period</p>
            </div>
            {summary.transactions.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No paid transactions in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline/40 bg-cream/40 text-xs uppercase tracking-[0.1em] text-muted">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Branch</th>
                      <th className="px-5 py-3 font-medium">Items</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.transactions.map((tx: {
                      _id: string;
                      orderNumber: string;
                      customerName: string;
                      branchId: string;
                      currency: string;
                      total: number;
                      itemCount: number;
                      paidAt: number;
                      status: string;
                    }) => (
                      <tr
                        key={tx._id}
                        className="border-b border-outline/30 hover:bg-primary/8"
                      >
                        <td className="px-5 py-3 text-muted">{formatDateTime(tx.paidAt)}</td>
                        <td className="px-5 py-3 font-medium text-coffee-dark">{tx.orderNumber}</td>
                        <td className="px-5 py-3">{tx.customerName}</td>
                        <td className="px-5 py-3">
                          {formatBranch(resolveBranchSlug(tx))}
                        </td>
                        <td className="px-5 py-3">{tx.itemCount}</td>
                        <td className="px-5 py-3 font-semibold text-coffee-dark">
                          {formatPrice(tx.total, tx.currency)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge label={tx.status} variant="order" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
