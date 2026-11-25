import { Check, Circle } from "lucide-react";
import {
  CUSTOMER_ORDER_TRACK_STEPS,
  customerOrderStatusHeadline,
  customerOrderStatusMessage,
  customerOrderTrackStepIndex,
} from "@/lib/orderStatusFlow";
import { cn } from "@/lib/utils";

export function OrderProgressTracker({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  if (status === "cancelled") {
    return (
      <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {customerOrderStatusMessage(status)}
      </p>
    );
  }

  if (compact && status === "completed") {
    return (
      <p className="mt-3 rounded-xl border border-brand-green/25 bg-brand-green/8 px-4 py-2.5 text-sm text-coffee-dark">
        {customerOrderStatusMessage(status)}
      </p>
    );
  }

  const currentStep = customerOrderTrackStepIndex(status);
  const headline = customerOrderStatusHeadline(status);
  const message = customerOrderStatusMessage(status);

  return (
    <div className={cn("mt-4", compact && "mt-3")}>
      <div
        className={cn(
          "rounded-xl border border-brand-green/25 bg-brand-green/8 px-4 py-3",
          compact && "py-2.5",
        )}
      >
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Current status</p>
        <p className={cn("font-semibold text-coffee-dark", compact ? "text-sm" : "text-base")}>
          {headline}
        </p>
        <p className={cn("mt-1 text-muted", compact ? "text-xs" : "text-sm")}>{message}</p>
      </div>

      <ol
        className={cn("mt-4 grid gap-2", compact ? "mt-3" : "")}
        aria-label="Order progress"
      >
        {CUSTOMER_ORDER_TRACK_STEPS.map((step, index) => {
          const done = currentStep > index;
          const active = currentStep === index;
          const upcoming = currentStep < index;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                active && "border-brand-green/35 bg-brand-green/10",
                done && "border-brand-green/20 bg-white/80",
                upcoming && "border-outline/30 bg-cream/30 opacity-70",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  done && "border-brand-green bg-brand-green text-white",
                  active && "border-brand-green bg-white text-brand-green",
                  upcoming && "border-outline/50 bg-white text-muted",
                )}
                aria-hidden
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : active ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-40" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-green" />
                  </span>
                ) : (
                  <Circle className="h-3.5 w-3.5" strokeWidth={2} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    active || done ? "text-coffee-dark" : "text-muted",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted">{step.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
