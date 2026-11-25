import {
  useCallback,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { formatPrice } from "@/data/content";
import { cn } from "@/lib/utils";
import {
  ChartLegend,
  ChartTooltip,
  emptyTooltip,
  type ChartTooltipState,
} from "@/admin/components/dashboard/ChartTooltip";
import {
  CHART_PALETTE,
  CHART_SERIES,
  CHART_THEME,
  ORDER_STATUS_COLORS,
} from "@/admin/components/dashboard/chartTheme";

export function ChartPanel({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-outline-variant/80 bg-gradient-to-b from-cream/50 to-white shadow-card",
        className,
      )}
    >
      <div className="flex flex-col gap-2 border-b border-outline/20 bg-surface-container/40 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
        <div>
          <p className="text-sm font-semibold text-coffee-dark">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="touch-pan-x p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function CompactMetricTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="group rounded-xl border border-outline-variant/70 bg-white/90 px-4 py-3.5 shadow-sm transition hover:border-primary/25 hover:shadow-soft">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1.5 font-display text-xl font-semibold tracking-tight text-coffee-dark">
        {value}
      </p>
      {sublabel ? (
        <p className="mt-1 text-[11px] leading-snug text-on-surface-variant">{sublabel}</p>
      ) : null}
    </div>
  );
}

export function DashboardKpiCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-coffee-dark">{value}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

type TrendPoint = { timestamp: number; orders: number; revenue: number };

function formatAxisDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

function formatCompactMoney(n: number, currency?: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return formatPrice(n, currency);
}

function useChartTooltip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<ChartTooltipState>(emptyTooltip);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const show = useCallback(
    (e: ReactPointerEvent, index: number, title: string, lines: string[]) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setActiveIndex(index);
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        title,
        lines,
      });
    },
    [],
  );

  const hide = useCallback(() => {
    setActiveIndex(null);
    setTooltip(emptyTooltip);
  }, []);

  return { containerRef, tooltip, activeIndex, show, hide };
}

/** Revenue + orders + avg ticket — brand forest / sage palette with hover tooltips. */
export function RevenueOrdersComboChart({
  data,
  displayCurrency,
}: {
  data: TrendPoint[];
  displayCurrency?: string;
}) {
  const { containerRef, tooltip, activeIndex, show, hide } = useChartTooltip();

  const width = 720;
  const height = 268;
  const pad = { top: 20, right: 52, bottom: 40, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const avgPerDay = data.map((d) => (d.orders > 0 ? d.revenue / d.orders : 0));
  const maxAvgTicket = Math.max(...avgPerDay, 1);

  const barGroupW = innerW / Math.max(data.length, 1);
  const barW = Math.min(12, barGroupW * 0.2);

  const yTicks = 4;
  const revenueTicks = Array.from({ length: yTicks + 1 }, (_, i) => (maxRevenue / yTicks) * i);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto" onPointerLeave={hide}>
      <ChartTooltip tooltip={tooltip} />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[min(100%,320px)] max-w-full select-none"
        role="img"
        aria-label="Revenue and orders trend chart"
      >
        {revenueTicks.map((tick, i) => {
          const y = pad.top + innerH - (tick / maxRevenue) * innerH;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke={CHART_THEME.gridLight}
                strokeWidth={1}
              />
              <text
                x={pad.left - 10}
                y={y + 4}
                textAnchor="end"
                fill={CHART_THEME.neutralMuted}
                fontSize={10}
              >
                {tick === 0 ? "0" : formatCompactMoney(tick, displayCurrency)}
              </text>
            </g>
          );
        })}

        {activeIndex !== null && data[activeIndex] ? (
          <line
            x1={pad.left + activeIndex * barGroupW + barGroupW / 2}
            y1={pad.top}
            x2={pad.left + activeIndex * barGroupW + barGroupW / 2}
            y2={pad.top + innerH}
            stroke={CHART_THEME.primary}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.45}
          />
        ) : null}

        {data.map((point, i) => {
          const gx = pad.left + i * barGroupW + barGroupW / 2;
          const revH = (point.revenue / maxRevenue) * innerH;
          const ordH = (point.orders / maxOrders) * innerH * 0.82;
          const xRev = gx - barW - 2;
          const xOrd = gx + 2;
          const yBase = pad.top + innerH;
          const isActive = activeIndex === i;
          const avg = point.orders > 0 ? point.revenue / point.orders : 0;

          return (
            <g key={point.timestamp}>
              <rect
                x={pad.left + i * barGroupW}
                y={pad.top}
                width={barGroupW}
                height={innerH}
                fill="transparent"
                className="cursor-pointer touch-none"
                onPointerDown={(e) =>
                  show(e, i, formatAxisDate(point.timestamp), [
                    `Revenue: ${formatPrice(point.revenue, displayCurrency)}`,
                    `Orders: ${point.orders}`,
                    `Avg. ticket: ${formatPrice(avg, displayCurrency)}`,
                  ])
                }
                onPointerMove={(e) =>
                  show(e, i, formatAxisDate(point.timestamp), [
                    `Revenue: ${formatPrice(point.revenue, displayCurrency)}`,
                    `Orders: ${point.orders}`,
                    `Avg. ticket: ${formatPrice(avg, displayCurrency)}`,
                  ])
                }
              />
              <rect
                x={xRev}
                y={yBase - revH}
                width={barW}
                height={Math.max(revH, point.revenue > 0 ? 3 : 0)}
                fill={isActive ? CHART_THEME.primaryDark : CHART_SERIES.revenue}
                rx={3}
                opacity={isActive ? 1 : activeIndex === null ? 0.92 : 0.45}
              />
              <rect
                x={xOrd}
                y={yBase - ordH}
                width={barW}
                height={Math.max(ordH, point.orders > 0 ? 3 : 0)}
                fill={isActive ? CHART_THEME.secondary : CHART_SERIES.orders}
                rx={3}
                opacity={isActive ? 1 : activeIndex === null ? 0.88 : 0.4}
              />
              {(i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
                <text
                  x={gx}
                  y={height - 12}
                  textAnchor="middle"
                  fill={CHART_THEME.neutralMuted}
                  fontSize={9}
                >
                  {formatAxisDate(point.timestamp)}
                </text>
              )}
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke={CHART_SERIES.avgTicket}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={data
            .map((point, i) => {
              const gx = pad.left + i * barGroupW + barGroupW / 2;
              const avg = point.orders > 0 ? point.revenue / point.orders : 0;
              const y = pad.top + innerH - (avg / maxAvgTicket) * innerH;
              const clampedY = Math.max(pad.top + 6, Math.min(pad.top + innerH - 6, y));
              return `${gx},${clampedY}`;
            })
            .join(" ")}
        />

        {data.map((point, i) => {
          if (point.orders === 0) return null;
          const gx = pad.left + i * barGroupW + barGroupW / 2;
          const avg = point.revenue / point.orders;
          const y = pad.top + innerH - (avg / maxAvgTicket) * innerH;
          const clampedY = Math.max(pad.top + 6, Math.min(pad.top + innerH - 6, y));
          const isActive = activeIndex === i;
          return (
            <circle
              key={`dot-${point.timestamp}`}
              cx={gx}
              cy={clampedY}
              r={isActive ? 5 : 3.5}
              fill={CHART_THEME.white}
              stroke={CHART_SERIES.avgTicket}
              strokeWidth={2}
            />
          );
        })}

        {[0.5, 1].map((frac) => {
          const y = pad.top + innerH - frac * innerH;
          const val = maxAvgTicket * frac;
          return (
            <text
              key={`avg-${frac}`}
              x={width - pad.right + 8}
              y={y + 3}
              fill={CHART_THEME.neutralMuted}
              fontSize={9}
            >
              {formatCompactMoney(val, displayCurrency)}
            </text>
          );
        })}
      </svg>

      <ChartLegend
        items={[
          { label: "Revenue", color: CHART_SERIES.revenue, shape: "bar" },
          { label: "Orders", color: CHART_SERIES.orders, shape: "bar" },
          { label: "Avg. ticket", color: CHART_SERIES.avgTicket, shape: "line" },
        ]}
      />
    </div>
  );
}

export function TrendLineChart({
  data,
  valueKey,
  label,
  color = CHART_SERIES.signups,
  formatValue,
}: {
  data: Array<{ timestamp: number } & Record<string, number>>;
  valueKey: string;
  label: string;
  color?: string;
  formatValue?: (n: number) => string;
}) {
  const { containerRef, tooltip, activeIndex, show, hide } = useChartTooltip();

  const width = 520;
  const height = 228;
  const pad = { top: 22, right: 20, bottom: 36, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = pad.top + innerH - ((Number(d[valueKey]) || 0) / max) * innerH;
    return { x, y, d, i };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? pad.left} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;

  return (
    <div ref={containerRef} className="relative w-full" onPointerLeave={hide}>
      <ChartTooltip tooltip={tooltip} />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full select-none"
        role="img"
        aria-label={label}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = pad.top + innerH - frac * innerH;
          const val = max * frac;
          return (
            <g key={frac}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke={CHART_THEME.gridLight}
                strokeWidth={1}
              />
              <text
                x={pad.left - 8}
                y={y + 3}
                textAnchor="end"
                fill={CHART_THEME.neutralMuted}
                fontSize={9}
              >
                {formatValue ? formatValue(val) : String(Math.round(val))}
              </text>
            </g>
          );
        })}

        {activeIndex !== null && points[activeIndex] ? (
          <line
            x1={points[activeIndex].x}
            y1={pad.top}
            x2={points[activeIndex].x}
            y2={pad.top + innerH}
            stroke={CHART_THEME.primary}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.4}
          />
        ) : null}

        <path d={areaPath} fill={color} fillOpacity={0.14} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p) => {
          const isActive = activeIndex === p.i;
          const val = Number(p.d[valueKey]) || 0;
          return (
            <g key={p.d.timestamp}>
              <circle
                cx={p.x}
                cy={p.y}
                r={14}
                fill="transparent"
                className="cursor-pointer"
                onPointerMove={(e) =>
                  show(e, p.i, formatAxisDate(p.d.timestamp), [
                    formatValue ? formatValue(val) : `${val}`,
                  ])
                }
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 6 : 4}
                fill={CHART_THEME.white}
                stroke={color}
                strokeWidth={2}
                opacity={activeIndex === null || isActive ? 1 : 0.35}
              />
            </g>
          );
        })}

        {points
          .filter((p) => p.i === 0 || p.i === points.length - 1 || p.i % 3 === 0)
          .map((p) => (
            <text
              key={`lbl-${p.d.timestamp}`}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fill={CHART_THEME.neutralMuted}
              fontSize={9}
            >
              {formatAxisDate(p.d.timestamp)}
            </text>
          ))}
      </svg>
    </div>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  formatValue,
  colors,
}: {
  segments: Array<{ label: string; value: number }>;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (n: number) => string;
  colors?: string[];
}) {
  const { containerRef, tooltip, activeIndex, show, hide } = useChartTooltip();
  const palette = colors ?? CHART_PALETTE;

  const total = segments.reduce((s, x) => s + x.value, 0);
  const size = 208;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 80;
  const innerR = 50;

  if (total <= 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">No data for this period.</p>
    );
  }

  let angle = -Math.PI / 2;
  const arcs = segments.map((seg, i) => {
    const slice = (seg.value / total) * Math.PI * 2;
    const start = angle;
    angle += slice;
    const end = angle;
    const large = slice > Math.PI ? 1 : 0;
    const x1o = cx + outerR * Math.cos(start);
    const y1o = cy + outerR * Math.sin(start);
    const x2o = cx + outerR * Math.cos(end);
    const y2o = cy + outerR * Math.sin(end);
    const x1i = cx + innerR * Math.cos(end);
    const y1i = cy + innerR * Math.sin(end);
    const x2i = cx + innerR * Math.cos(start);
    const y2i = cy + innerR * Math.sin(start);
    const d = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");
    const pct = Math.round((seg.value / total) * 100);
    return { d, color: palette[i % palette.length], seg, pct, index: i };
  });

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-center"
      onPointerLeave={hide}
    >
      <ChartTooltip tooltip={tooltip} />
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
          {arcs.map((a) => {
            const isActive = activeIndex === a.index;
            return (
              <path
                key={a.seg.label}
                d={a.d}
                fill={a.color}
                stroke={CHART_THEME.white}
                strokeWidth={2}
                opacity={activeIndex === null || isActive ? 1 : 0.38}
                className="cursor-pointer transition-opacity"
                onPointerMove={(e) =>
                  show(e, a.index, a.seg.label, [
                    formatValue ? formatValue(a.seg.value) : String(a.seg.value),
                    `${a.pct}% of total`,
                  ])
                }
              />
            );
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerLabel ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {centerLabel}
              </span>
            ) : null}
            {centerValue ? (
              <span className="mt-0.5 text-base font-semibold text-coffee-dark">{centerValue}</span>
            ) : null}
          </div>
        )}
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {arcs.map((a) => {
          const isActive = activeIndex === a.index;
          return (
            <li
              key={a.seg.label}
              className={cn(
                "flex cursor-default items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
                isActive && "bg-secondary-container/50",
              )}
              onPointerEnter={(e) =>
                show(e, a.index, a.seg.label, [
                  formatValue ? formatValue(a.seg.value) : String(a.seg.value),
                  `${a.pct}% of total`,
                ])
              }
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: a.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-coffee-dark">
                {a.seg.label}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {a.pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function VerticalBarChart({
  rows,
  labelKey,
  valueKey,
  formatValue,
  color = CHART_SERIES.revenue,
  emptyMessage,
}: {
  rows: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
  formatValue?: (value: number) => string;
  color?: string;
  emptyMessage: string;
}) {
  const { containerRef, tooltip, activeIndex, show, hide } = useChartTooltip();

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);
  const chartH = 176;

  return (
    <div ref={containerRef} className="relative pt-2" onPointerLeave={hide}>
      <ChartTooltip tooltip={tooltip} />
      <div className="flex h-56 items-end justify-around gap-1 border-b border-outline/25 pb-9">
        {rows.map((row, i) => {
          const value = Number(row[valueKey]) || 0;
          const h = Math.max(10, (value / max) * chartH);
          const label = String(row[labelKey]);
          const isActive = activeIndex === i;

          return (
            <div
              key={`${label}-${i}`}
              className="flex min-w-0 max-w-[76px] flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className={cn(
                  "w-full max-w-[44px] rounded-t-lg transition-all duration-200 cursor-pointer",
                  isActive ? "shadow-soft ring-2 ring-primary/20" : "",
                )}
                style={{
                  height: h,
                  background: isActive
                    ? `linear-gradient(to top, ${CHART_THEME.primaryDark}, ${color})`
                    : `linear-gradient(to top, ${color}cc, ${color})`,
                  opacity: activeIndex === null || isActive ? 1 : 0.42,
                }}
                onPointerMove={(e) =>
                  show(e, i, label, [formatValue ? formatValue(value) : String(value)])
                }
              />
              <span
                className={cn(
                  "line-clamp-2 w-full text-center text-[9px] leading-tight",
                  isActive ? "font-medium text-coffee-dark" : "text-muted",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatusDonutChart({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const segments = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([label, value]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
    }));

  const total = segments.reduce((s, x) => s + x.value, 0);
  const colors = segments.map(
    (s) => ORDER_STATUS_COLORS[s.label.toLowerCase()] ?? CHART_THEME.primary,
  );

  return (
    <DonutChart
      segments={segments}
      centerLabel="Orders"
      centerValue={String(total)}
      colors={colors}
    />
  );
}

export function OrdersTrendChart({
  data,
  displayCurrency,
}: {
  data: TrendPoint[];
  maxOrders?: number;
  displayCurrency?: string;
}) {
  return <RevenueOrdersComboChart data={data} displayCurrency={displayCurrency} />;
}

export function SignupsTrendChart({
  data,
}: {
  data: Array<{ timestamp: number; count: number }>;
  maxCount?: number;
}) {
  return (
    <TrendLineChart
      data={data}
      valueKey="count"
      label="New clients per day"
      color={CHART_SERIES.signups}
      formatValue={(n) => `${n} client${n === 1 ? "" : "s"}`}
    />
  );
}

export function HorizontalBarList({
  rows,
  valueKey,
  labelKey,
  formatValue,
  emptyMessage,
}: {
  rows: Array<Record<string, string | number>>;
  valueKey: string;
  labelKey: string;
  formatValue?: (value: number, row: Record<string, string | number>) => string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted">{emptyMessage}</p>;
  }

  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);

  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row, i) => {
        const value = Number(row[valueKey]) || 0;
        const label = String(row[labelKey]);
        const display = formatValue ? formatValue(value, row) : String(value);

        return (
          <li key={`${label}-${i}`} className="group">
            <div className="mb-1 flex justify-between gap-2 text-sm">
              <span className="truncate font-medium text-coffee-dark group-hover:text-primary">
                {label}
              </span>
              <span className="shrink-0 text-muted">{display}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary-container/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all group-hover:from-primary group-hover:to-primary-dark"
                style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function StatusPillGrid({
  counts,
}: {
  counts: Record<string, number>;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Object.entries(counts).map(([status, count]) => (
        <div
          key={status}
          className={cn(
            "rounded-xl border border-outline/25 px-3 py-2.5 text-sm transition hover:border-primary/20",
            count > 0 ? "bg-cream/40" : "bg-white/50 opacity-70",
          )}
        >
          <p className="text-xs capitalize text-muted">{status}</p>
          <p className="mt-0.5 text-lg font-semibold text-coffee-dark">{count}</p>
        </div>
      ))}
    </div>
  );
}
