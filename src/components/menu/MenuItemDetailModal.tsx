import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FavoriteButton } from "@/components/menu/FavoriteButton";
import { ShoppingBag, X } from "lucide-react";
import { formatPrice, MENU_CATEGORIES, type MenuItem } from "@/data/content";
import { resolveMenuImageUrl } from "@/data/refAssets";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { prefetchImage } from "@/lib/prefetchImages";
import { cn } from "@/lib/utils";

type MenuItemDetailModalProps = {
  item: MenuItem;
  branchCurrency: string;
  branchSlug?: string;
  onClose: () => void;
  onAddToCart: () => void;
};

const easeOut = [0.16, 1, 0.3, 1] as const;

export function MenuItemDetailModal({
  item,
  branchCurrency,
  branchSlug,
  onClose,
  onAddToCart,
}: MenuItemDetailModalProps) {
  useLockBodyScroll(true);
  const reduceMotion = useReducedMotion();

  const categoryLabel =
    MENU_CATEGORIES.find((c) => c.id === item.category)?.label ?? "Menu";
  const imageSrc = resolveMenuImageUrl(item.name, item.imageUrl, item.category);

  useEffect(() => {
    if (imageSrc) prefetchImage(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 12 },
      };

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="menu-item-modal"
        className="fixed inset-0 z-[88] flex items-end justify-center p-3 sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: easeOut }}
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          aria-label="Close menu item"
          onClick={onClose}
        />

        <motion.article
          {...panelMotion}
          transition={{ duration: 0.35, ease: easeOut }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-item-title"
          className={cn(
            "relative z-10 flex w-full max-w-md flex-col",
            "max-h-[min(90dvh,40rem)] overflow-hidden",
            "rounded-xl border border-outline-variant/60 bg-white text-on-surface",
            "shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
            "sm:max-w-[26rem]",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card header */}
          <header className="flex items-start justify-between gap-3 border-b border-outline-variant/40 px-5 py-4">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-muted">{categoryLabel}</p>
              <h2
                id="menu-item-title"
                className="text-lg font-semibold leading-tight tracking-tight text-coffee-dark"
              >
                {item.name}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <FavoriteButton item={item} branchSlug={branchSlug} variant="inline" />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant/50 bg-surface text-muted transition-colors hover:bg-cream hover:text-coffee-dark"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Card content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="p-5 pt-4">
              <div className="overflow-hidden rounded-lg border border-outline-variant/40 bg-cream/50">
                <div className="relative aspect-[4/3] w-full">
                  {imageSrc ? (
                    <OptimizedImage
                      src={imageSrc}
                      alt={item.name}
                      priority
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-muted/40">
                      ☕
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-3">
                <span className="text-sm text-muted">Price</span>
                <span className="text-xl font-semibold tabular-nums tracking-tight text-coffee-dark">
                  {formatPrice(item.price, branchCurrency)}
                </span>
              </div>

              <div className="my-4 h-px bg-outline-variant/35" />

              {item.description ? (
                <p className="text-sm leading-relaxed text-muted">{item.description}</p>
              ) : (
                <p className="text-sm leading-relaxed text-muted">
                  Part of our {categoryLabel.toLowerCase()} menu — prepared fresh at your
                  branch.
                </p>
              )}

              {item.featured && (
                <p className="mt-3 inline-flex rounded-md border border-outline-variant/45 bg-surface px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                  Guest favourite
                </p>
              )}
            </div>
          </div>

          {/* Card footer */}
          <footer className="border-t border-outline-variant/40 bg-surface/80 p-4">
            <p className="mb-3 text-center text-xs text-muted">
              You can change quantity anytime in your cart before checkout.
            </p>
            <button
              type="button"
              onClick={onAddToCart}
              className={cn(
                "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg",
                "bg-primary text-sm font-semibold text-white",
                "transition-colors duration-200 hover:bg-primary-container",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
              )}
            >
              <ShoppingBag className="h-4 w-4 opacity-90" aria-hidden />
              Add to my cart
            </button>
          </footer>
        </motion.article>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
