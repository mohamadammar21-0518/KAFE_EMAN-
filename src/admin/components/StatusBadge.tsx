import { orderStatusLabel } from "@/lib/orderStatusFlow";
import { reservationStatusLabel } from "@/lib/reservationStatusFlow";
import { cn } from "@/lib/utils";

const RESERVATION_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  progressing: "bg-blue-50 text-blue-800 border-blue-200",
  confirmed: "bg-blue-50 text-blue-800 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-brand-green/10 text-brand-green border-brand-green/25",
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-blue-50 text-blue-800 border-blue-200",
  preparing: "bg-violet-50 text-violet-800 border-violet-200",
  ready: "bg-teal-50 text-teal-800 border-teal-200",
  completed: "bg-brand-green/10 text-brand-green border-brand-green/25",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  read: "bg-blue-50 text-blue-800 border-blue-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  paid: "bg-brand-green/10 text-brand-green border-brand-green/25",
  refunded: "bg-slate-100 text-slate-700 border-slate-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({
  label,
  variant = "order",
}: {
  label: string;
  variant?: "order" | "payment" | "reservation";
}) {
  const styles =
    variant === "payment"
      ? PAYMENT_STATUS_STYLES[label] ?? "bg-white text-on-surface border-outline/40"
      : variant === "reservation"
        ? RESERVATION_STATUS_STYLES[label] ?? "bg-white text-on-surface border-outline/40"
        : ORDER_STATUS_STYLES[label] ?? "bg-white text-on-surface border-outline/40";

  const display =
    variant === "reservation"
      ? reservationStatusLabel(label)
      : variant === "order"
        ? orderStatusLabel(label)
        : label;

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        styles,
      )}
    >
      {display}
    </span>
  );
}
