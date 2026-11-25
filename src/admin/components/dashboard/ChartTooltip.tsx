import { cn } from "@/lib/utils";

export type ChartTooltipState = {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  lines: string[];
};

export const emptyTooltip: ChartTooltipState = {
  visible: false,
  x: 0,
  y: 0,
  title: "",
  lines: [],
};

export function ChartTooltip({
  tooltip,
  className,
}: {
  tooltip: ChartTooltipState;
  className?: string;
}) {
  if (!tooltip.visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 min-w-[140px] max-w-[220px] rounded-lg border border-outline/30 bg-coffee-dark px-3 py-2.5 text-left shadow-lg",
        className,
      )}
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
      role="tooltip"
    >
      <p className="text-[11px] font-semibold text-white/95">{tooltip.title}</p>
      {tooltip.lines.map((line) => (
        <p key={line} className="mt-0.5 text-[11px] text-secondary-container">
          {line}
        </p>
      ))}
      <span
        className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-outline/30 bg-coffee-dark"
        aria-hidden
      />
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string; shape?: "bar" | "line" | "dot" }>;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-outline/20 pt-4">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant"
        >
          {item.shape === "line" ? (
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          ) : item.shape === "dot" ? (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: item.color }}
            />
          ) : (
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}
