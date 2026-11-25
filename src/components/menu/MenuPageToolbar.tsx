import type { ComponentType } from "react";
import { Search, ShoppingBag, X } from "lucide-react";
import { MENU_CATEGORIES, type MenuCategory } from "@/data/content";
import { cn } from "@/lib/utils";

export type MenuToolbarCategory = MenuCategory | "seasonal";

type CategoryMeta = Record<MenuCategory, { icon: ComponentType<{ className?: string }> }>;

type MenuPageToolbarProps = {
  activeCategory: MenuToolbarCategory;
  categoryMeta: CategoryMeta;
  showSeasonalNav: boolean;
  cartCount: number;
  query: string;
  featuredOnly: boolean;
  sort: "default" | "price_asc" | "price_desc";
  resultCount: number;
  onCategorySelect: (cat: MenuToolbarCategory) => void;
  onQueryChange: (value: string) => void;
  onFeaturedOnlyChange: (value: boolean) => void;
  onSortChange: (value: "default" | "price_asc" | "price_desc") => void;
  onClearFilters: () => void;
  onOpenCart: () => void;
};

export function MenuPageToolbar({
  activeCategory,
  categoryMeta,
  showSeasonalNav,
  cartCount,
  query,
  featuredOnly,
  sort,
  resultCount,
  onCategorySelect,
  onQueryChange,
  onFeaturedOnlyChange,
  onSortChange,
  onClearFilters,
  onOpenCart,
}: MenuPageToolbarProps) {
  const filtersActive = Boolean(query.trim()) || featuredOnly || sort !== "default";

  return (
    <header className="menu-cb-toolbar">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-surface">
            {resultCount} {resultCount === 1 ? "item" : "items"} to explore
          </p>
          <p className="mt-0.5 text-xs text-muted">Tap a category to jump, or scroll the menu</p>
        </div>
        <button
          type="button"
          onClick={onOpenCart}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-300",
            cartCount > 0
              ? "bg-primary text-white shadow-soft hover:bg-primary-container"
              : "border border-outline-variant/40 bg-white text-primary hover:bg-primary/5",
          )}
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={2} aria-hidden />
          {cartCount > 0 ? `View cart (${cartCount})` : "Your cart"}
        </button>
      </div>

      <nav
        className="no-scrollbar -mx-1 mt-4 flex gap-0.5 overflow-x-auto px-1 sm:gap-1"
        aria-label="Menu categories"
      >
        {showSeasonalNav && (
          <CategoryTab
            active={activeCategory === "seasonal"}
            label="Guest favourites"
            onClick={() => onCategorySelect("seasonal")}
          />
        )}
        {MENU_CATEGORIES.map((cat) => {
          const Icon = categoryMeta[cat.id].icon;
          return (
            <CategoryTab
              key={cat.id}
              active={activeCategory === cat.id}
              label={cat.label}
              icon={Icon}
              onClick={() => onCategorySelect(cat.id)}
            />
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search menu</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search coffee, tea, food…"
            className="min-h-11 w-full rounded-lg border border-outline-variant/40 bg-white py-2.5 pl-10 pr-10 text-base outline-none transition-shadow duration-300 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 sm:text-sm"
          />
          {query.trim() ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-on-surface"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        <div className="flex shrink-0 flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => onFeaturedOnlyChange(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Favourites only
          </label>

          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as typeof sort)}
            aria-label="Sort menu"
            className="min-h-11 rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="default">Sort: recommended</option>
            <option value="price_asc">Sort: lowest price</option>
            <option value="price_desc">Sort: highest price</option>
          </select>

          {filtersActive ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function CategoryTab({
  label,
  active,
  icon: Icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex min-h-11 shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-300 sm:px-4",
        active ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
      )}
    >
      {Icon ? <Icon className="h-4 w-4 opacity-80" aria-hidden /> : null}
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={cn(
          "absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
    </button>
  );
}
