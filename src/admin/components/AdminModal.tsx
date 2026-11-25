import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
  compact,
  panelClassName,
  softBackdrop,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
  /** Tighter header/body padding and slightly lower max height */
  compact?: boolean;
  panelClassName?: string;
  /** Light dim + subtle blur for read-only detail modals */
  softBackdrop?: boolean;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={cn(
              "fixed inset-0 z-[300]",
              softBackdrop
                ? "bg-coffee-dark/[0.06] backdrop-blur-[6px] backdrop-saturate-150"
                : "bg-black/40 backdrop-blur-sm",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "cafe-modal fixed left-1/2 z-[301] w-[calc(100%-1.5rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-outline/40 bg-surface shadow-2xl sm:w-[calc(100%-2rem)]",
              "top-[max(5.25rem,calc(env(safe-area-inset-top)+4.75rem))] sm:top-[max(5.75rem,6vh)]",
              compact
                ? "max-h-[min(78vh,calc(100dvh-5.5rem))]"
                : "max-h-[min(88vh,calc(100dvh-6rem))]",
              wide ? "max-w-3xl" : "max-w-lg",
              panelClassName,
            )}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-outline/40 bg-surface/95 backdrop-blur-md",
                compact ? "px-5 py-3" : "px-6 py-4",
              )}
            >
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className={cn(
                    "text-coffee-dark",
                    compact ? "text-lg font-semibold leading-snug" : "text-headline-md",
                  )}
                >
                  {title}
                </h2>
                {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-outline/40 text-muted hover:bg-cream"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className={compact ? "px-5 py-4" : "px-6 py-5"}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
