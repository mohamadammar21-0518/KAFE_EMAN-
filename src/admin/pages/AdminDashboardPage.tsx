import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CalendarClock,
  CircleDollarSign,
  CircleHelp,
  Mail,
  MessageSquareQuote,
  Settings2,
  ShoppingBag,
  Store,
  Shield,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  ChartPanel,
  CompactMetricTile,
  DonutChart,
  RevenueOrdersComboChart,
  SignupsTrendChart,
  StatusDonutChart,
  TrendLineChart,
  VerticalBarChart,
} from "@/admin/components/dashboard/DashboardCharts";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatPrice } from "@/data/content";
import { cn } from "@/lib/utils";

type DashboardTab = "revenue" | "operations" | "guests";

type DashboardSection = {
  title: string;
  subtitle: string;
  to: string;
  icon: LucideIcon;
};

const DASHBOARD_SECTIONS: DashboardSection[] = [
  { title: "Orders", subtitle: "Customer orders from menu checkout", to: "/admin/orders", icon: ShoppingBag },
  { title: "Finance", subtitle: "Daily to yearly revenue & transactions", to: "/admin/finance", icon: CircleDollarSign },
  { title: "Branches", subtitle: "Address and contact for each branch", to: "/admin/branches", icon: Store },
  { title: "Menu", subtitle: "Items and branch availability", to: "/admin/menu", icon: UtensilsCrossed },
  { title: "Reservations", subtitle: "Table bookings from the website", to: "/admin/reservations", icon: CalendarClock },
  { title: "Clients", subtitle: "Customers who sign in on the website", to: "/admin/clients", icon: Users },
  { title: "Testimonials", subtitle: "Client feedback & featured quotes", to: "/admin/testimonials", icon: MessageSquareQuote },
  { title: "Staff", subtitle: "Admin panel access for your team", to: "/admin/staff", icon: Shield },
  { title: "FAQ", subtitle: "Questions shown on the FAQ page", to: "/admin/faqs", icon: CircleHelp },
  { title: "Get In Touch", subtitle: "Messages from the contact form", to: "/admin/messages", icon: Mail },
  { title: "Content & contact", subtitle: "Footer text, contact details, and site copy", to: "/admin/content", icon: Settings2 },
];

const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: "revenue", label: "Revenue" },
  { id: "operations", label: "Operations" },
  { id: "guests", label: "Guests" },
];

function SectionCard({ title, subtitle, to, icon: Icon }: DashboardSection) {
  return (
    <Link
      to={to}
      className="hover-lift flex flex-col rounded-xl border border-outline/35 bg-white p-4 shadow-sm transition-colors hover:border-primary/25"
    >
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-2 text-sm font-semibold text-coffee-dark">{title}</p>
      <p className="mt-0.5 text-xs text-muted line-clamp-2">{subtitle}</p>
    </Link>
  );
}

function LiveDataBadge({ computedAt }: { computedAt: number }) {
  const [label, setLabel] = useState("Live");

  useEffect(() => {
    const tick = () => {
      const sec = Math.max(0, Math.floor((Date.now() - computedAt) / 1000));
      if (sec < 5) setLabel("Live");
      else if (sec < 60) setLabel(`Updated ${sec}s ago`);
      else setLabel(`Updated ${new Date(computedAt).toLocaleTimeString()}`);
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [computedAt]);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      {label}
    </span>
  );
}

export function AdminDashboardPage() {
  const adminToken = useAdminToken();
  const [tab, setTab] = useState<DashboardTab>("revenue");
  const overview = useQuery(
    api.adminDashboard.overview,
    adminToken ? { adminToken } : "skip",
  );

  const currency = overview?.displayCurrency;
  const periodLabel = `${overview?.periodDays ?? 14} days`;

  const branchDonut = useMemo(
    () =>
      (overview?.ordersByBranch ?? [])
        .filter((b) => b.revenue > 0)
        .slice(0, 6)
        .map((b) => ({ label: b.label, value: b.revenue })),
    [overview?.ordersByBranch],
  );

  const menuBarRows = useMemo(
    () =>
      (overview?.topMenuItems ?? []).slice(0, 6).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        revenue: item.revenue,
      })),
    [overview?.topMenuItems],
  );

  const hasOrderActivity = overview?.ordersTrend.some((t) => t.orders > 0 || t.revenue > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline-lg text-coffee-dark">Store overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Financial and operational snapshot for the last {periodLabel} — charts update live from
            your Convex data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {overview?.computedAt ? <LiveDataBadge computedAt={overview.computedAt} /> : null}
          <Link
            to="/admin/finance"
            className="inline-flex items-center gap-2 rounded-full border border-outline/40 bg-white px-4 py-2 text-sm font-medium text-coffee-dark shadow-sm hover:border-primary/30"
          >
            <CircleDollarSign className="h-4 w-4 text-primary" />
            Full finance
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 rounded-full bg-coffee-dark px-4 py-2 text-sm font-medium text-white hover:bg-coffee-dark/90"
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </Link>
        </div>
      </div>

      <div
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-outline/30 px-1 pb-px [-webkit-overflow-scrolling:touch]"
        role="tablist"
        aria-label="Dashboard views"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-b-2 border-coffee-dark text-coffee-dark"
                : "text-muted hover:text-on-surface",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!overview ? (
        <p className="text-sm text-muted">Loading overview…</p>
      ) : (
        <>
          {/* QuickBooks-style hero: KPI tiles + main combo chart */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="grid grid-cols-2 gap-3 lg:col-span-4">
              <CompactMetricTile
                label={`Revenue (${periodLabel})`}
                value={formatPrice(overview.totals.revenue14d, currency)}
                sublabel={`${overview.totals.paidOrders14d} paid orders`}
              />
              <CompactMetricTile
                label="Total revenue"
                value={formatPrice(overview.totals.revenueAllTime, currency)}
                sublabel="All paid orders"
              />
              <CompactMetricTile
                label="Avg. order value"
                value={formatPrice(overview.totals.avgOrderValue14d, currency)}
                sublabel={`Last ${overview.periodDays} days`}
              />
              <CompactMetricTile
                label={`Orders (${periodLabel})`}
                value={String(overview.totals.orders14d)}
                sublabel={`${overview.totals.orders} all time`}
              />
              <CompactMetricTile
                label="Clients"
                value={String(overview.totals.clients)}
                sublabel={`+${overview.totals.newClients14d} new`}
              />
              <CompactMetricTile
                label="Needs attention"
                value={String(
                  overview.totals.pendingReservations +
                    overview.totals.pendingMessages +
                    overview.totals.pendingTestimonials,
                )}
                sublabel="Reservations · messages · testimonials"
              />
            </div>

            <ChartPanel
              className="lg:col-span-8"
              title={`Revenue & orders · last ${overview.periodDays} days`}
              subtitle="Forest green = paid revenue · Sage = order volume · Deep green line = average ticket. Hover any day for details."
            >
              {hasOrderActivity ? (
                <RevenueOrdersComboChart
                  data={overview.ordersTrend}
                  displayCurrency={currency}
                />
              ) : (
                <p className="py-16 text-center text-sm text-muted">
                  No orders in this period yet. Charts will appear when customers check out.
                </p>
              )}
            </ChartPanel>
          </div>

          {/* Bottom charts row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {(tab === "revenue" || tab === "operations") && (
              <ChartPanel
                title={
                  tab === "revenue"
                    ? `Daily revenue · last ${overview.periodDays} days`
                    : `Order pipeline · last ${overview.periodDays} days`
                }
                subtitle={
                  tab === "revenue"
                    ? "Paid order revenue over time"
                    : "How recent orders are distributed by status"
                }
              >
                {tab === "revenue" ? (
                  overview.ordersTrend.some((t) => t.revenue > 0) ? (
                    <TrendLineChart
                      data={overview.ordersTrend}
                      valueKey="revenue"
                      label="Daily revenue"
                      formatValue={(n) => formatPrice(n, currency)}
                    />
                  ) : (
                    <p className="py-12 text-center text-sm text-muted">No paid revenue yet.</p>
                  )
                ) : (
                  <StatusDonutChart counts={overview.orderStatusCounts} />
                )}
              </ChartPanel>
            )}

            {(tab === "revenue" || tab === "operations") && (
              <ChartPanel
                title="Revenue by branch"
                subtitle="Share of paid revenue — all time"
              >
                <DonutChart
                  segments={branchDonut}
                  centerLabel="Total"
                  centerValue={formatPrice(
                    branchDonut.reduce((s, x) => s + x.value, 0),
                    currency,
                  )}
                  formatValue={(n) => formatPrice(n, currency)}
                />
              </ChartPanel>
            )}

            {tab === "guests" && (
              <>
                <ChartPanel
                  title={`New clients · last ${overview.periodDays} days`}
                  subtitle="Website sign-ups (Clerk)"
                >
                  {overview.signupsTrend.some((t) => t.count > 0) ? (
                    <SignupsTrendChart data={overview.signupsTrend} />
                  ) : (
                    <p className="py-12 text-center text-sm text-muted">No new clients yet.</p>
                  )}
                </ChartPanel>
                <ChartPanel title="Client growth" subtitle="Cumulative sign-ups in period">
                  <TrendLineChart
                    data={overview.signupsTrend.reduce<
                      Array<{ timestamp: number; cumulative: number }>
                    >((acc, point) => {
                      const prev = acc[acc.length - 1]?.cumulative ?? 0;
                      acc.push({
                        timestamp: point.timestamp,
                        cumulative: prev + point.count,
                      });
                      return acc;
                    }, [])}
                    valueKey="cumulative"
                    label="Cumulative sign-ups"
                  />
                </ChartPanel>
              </>
            )}

            {tab === "operations" && (
              <ChartPanel
                className="lg:col-span-2"
                title={`Top menu items · last ${overview.periodDays} days`}
                subtitle="Best sellers by quantity (paid orders)"
              >
                <VerticalBarChart
                  rows={menuBarRows}
                  labelKey="name"
                  valueKey="quantity"
                  formatValue={(qty) => `${qty} sold`}
                  emptyMessage="No item sales in this period."
                />
              </ChartPanel>
            )}
          </div>

          {tab === "revenue" && menuBarRows.length > 0 && (
            <ChartPanel
              title={`Top menu items · last ${overview.periodDays} days`}
              subtitle="Quantity sold on paid orders"
            >
              <VerticalBarChart
                rows={menuBarRows}
                labelKey="name"
                valueKey="quantity"
                formatValue={(qty) => `${qty} sold`}
                  emptyMessage="No item sales in this period."
              />
            </ChartPanel>
          )}
        </>
      )}

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Quick links</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {DASHBOARD_SECTIONS.map((section) => (
            <SectionCard key={section.to} {...section} />
          ))}
        </div>
      </div>
    </div>
  );
}
