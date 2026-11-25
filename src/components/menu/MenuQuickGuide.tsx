import { MousePointerClick, Search, ShoppingBag } from "lucide-react";

const STEPS = [
  { icon: Search, text: "Pick a category or search by name" },
  { icon: MousePointerClick, text: "Tap any item to see details" },
  { icon: ShoppingBag, text: "Add to cart when you are ready" },
] as const;

export function MenuQuickGuide() {
  return (
    <div
      className="grid gap-3 rounded-xl border border-outline-variant/30 bg-white p-4 sm:grid-cols-3 sm:gap-4 sm:p-5"
      aria-label="How to use the menu"
    >
      {STEPS.map(({ icon: Icon, text }, index) => (
        <div key={text} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-sm leading-snug text-on-surface-variant">
            <span className="mr-1.5 font-semibold text-primary sm:mr-0 sm:block sm:mb-1">
              {index + 1}.
            </span>
            {text}
          </p>
        </div>
      ))}
    </div>
  );
}
