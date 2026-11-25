import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { prefetchImage } from "@/lib/prefetchImages";
import { motion } from "framer-motion";
import { Coffee, Croissant, Flag, Leaf, UtensilsCrossed } from "lucide-react";
import { MenuItemDetailModal } from "@/components/menu/MenuItemDetailModal";
import { MenuPageToolbar, type MenuToolbarCategory } from "@/components/menu/MenuPageToolbar";
import { MenuQuickGuide } from "@/components/menu/MenuQuickGuide";
import { MenuCard } from "@/components/ui/MenuCard";
import {
  MENU_CATEGORIES,
  MENU_CATEGORY_HINTS,
  type MenuCategory,
} from "@/data/content";
import { useMenuItems } from "@/hooks/useData";
import { resolveMenuImageUrl } from "@/data/refAssets";
import { type MenuItem } from "@/data/content";
import { useBranch } from "@/branch/BranchContext";
import { useBranchCurrency } from "@/branch/useBranchCurrency";
import { useCart } from "@/cart/CartContext";

function filterItems(
  items: MenuItem[],
  opts: { featuredOnly: boolean; query: string; sort: "default" | "price_asc" | "price_desc" },
) {
  let next = [...items];
  if (opts.featuredOnly) next = next.filter((i) => i.featured);
  const q = opts.query.trim().toLowerCase();
  if (q) {
    next = next.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q),
    );
  }
  if (opts.sort === "price_asc") next.sort((a, b) => a.price - b.price);
  else if (opts.sort === "price_desc") next.sort((a, b) => b.price - a.price);
  else next.sort((a, b) => a.sortOrder - b.sortOrder);
  return next;
}

export function MenuPage() {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<MenuToolbarCategory>("signature");
  const { branchId, branches } = useBranch();
  const branchLabel = branches.find((b) => b.id === branchId)?.label;
  const branchCurrency = useBranchCurrency();
  const allItems = useMenuItems({ branchId });
  const { itemCount: cartCount, addItem, openCart } = useCart();
  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<"default" | "price_asc" | "price_desc">("default");
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const filterOpts = useMemo(() => ({ featuredOnly, query, sort }), [featuredOnly, query, sort]);

  useEffect(() => {
    if (!selected) return;
    prefetchImage(
      resolveMenuImageUrl(selected.name, selected.imageUrl, selected.category),
    );
  }, [selected]);

  const itemsByCategory = useMemo(() => {
    const grouped = new Map<MenuCategory, MenuItem[]>();
    for (const cat of MENU_CATEGORIES) {
      grouped.set(cat.id, []);
    }
    for (const item of allItems) {
      const arr = grouped.get(item.category) ?? [];
      arr.push(item);
      grouped.set(item.category, arr);
    }
    for (const [k, v] of grouped.entries()) {
      grouped.set(k, filterItems(v, filterOpts));
    }
    return grouped;
  }, [allItems, filterOpts]);

  const seasonalItems = useMemo(
    () => filterItems(allItems.filter((i) => i.featured), filterOpts),
    [allItems, filterOpts],
  );

  const showSeasonal =
    seasonalItems.length > 0 && !featuredOnly && !query.trim();

  useEffect(() => {
    if (location.pathname !== "/menu") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setActiveCategory("signature");
  }, [location.key, location.pathname]);

  const totalVisible = useMemo(() => {
    let count = showSeasonal ? seasonalItems.length : 0;
    for (const cat of MENU_CATEGORIES) {
      let items = itemsByCategory.get(cat.id) ?? [];
      if (showSeasonal) items = items.filter((i) => !i.featured);
      count += items.length;
    }
    return count;
  }, [itemsByCategory, seasonalItems.length, showSeasonal]);

  const categoryMeta = useMemo(
    () =>
      ({
        signature: { icon: Flag },
        lattes: { icon: Coffee },
        "tea-matcha": { icon: Leaf },
        "bakery-dessert": { icon: Croissant },
        breakfast: { icon: UtensilsCrossed },
      }) as const,
    [],
  );

  useEffect(() => {
    const ids = [
      ...(showSeasonal ? ["menu-seasonal"] : []),
      ...MENU_CATEGORIES.map((c) => `menu-${c.id}`),
    ];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0))[0];
        if (!visible?.target?.id) return;
        if (visible.target.id === "menu-seasonal") {
          setActiveCategory("seasonal");
          return;
        }
        const cat = visible.target.id.replace("menu-", "") as MenuCategory;
        setActiveCategory(cat);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0.05, 0.15, 0.3] },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [showSeasonal]);

  function scrollToCategory(cat: MenuToolbarCategory) {
    const id = cat === "seasonal" ? "menu-seasonal" : `menu-${cat}`;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveCategory(cat);
  }

  function clearFilters() {
    setQuery("");
    setFeaturedOnly(false);
    setSort("default");
  }

  return (
    <div className="menu-cb-page bg-white">
      <section className="border-b border-outline-variant/25 bg-cream/50">
        <div className="container-main py-10 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl"
          >
            <p className="text-label-sm text-on-surface-variant">Kafe Eman</p>
            <h1 className="page-heading mt-2 font-display text-4xl font-semibold tracking-tight text-coffee-dark sm:text-5xl">
              Our Menu
            </h1>
            <p className="mt-4 text-body-lg text-muted">
              Find your coffee, discover a favourite, and choose something for the table.
            </p>
            {branchLabel ? (
              <p className="mt-3 inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-sm font-medium text-primary">
                Showing menu for {branchLabel}
              </p>
            ) : null}
            <div className="mt-6">
              <MenuQuickGuide />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container-main">
          <div className="sticky top-[72px] z-20 -mx-5 border-b border-outline-variant/25 bg-white/95 px-5 py-4 backdrop-blur-md sm:top-[88px] sm:-mx-8 sm:px-8 md:top-[96px] lg:-mx-10 lg:px-10">
            <div className="mx-auto max-w-[1200px]">
              <MenuPageToolbar
                activeCategory={activeCategory}
                categoryMeta={categoryMeta}
                showSeasonalNav={showSeasonal}
                cartCount={cartCount}
                query={query}
                featuredOnly={featuredOnly}
                sort={sort}
                resultCount={totalVisible}
                onCategorySelect={scrollToCategory}
                onQueryChange={setQuery}
                onFeaturedOnlyChange={setFeaturedOnly}
                onSortChange={setSort}
                onClearFilters={clearFilters}
                onOpenCart={openCart}
              />
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-[1200px] space-y-14 sm:mt-12 sm:space-y-16">
            {showSeasonal && (
              <section
                id="menu-seasonal"
                className="scroll-mt-[13rem] sm:scroll-mt-[15rem]"
              >
                <SectionHeader
                  title="Guest favourites"
                  hint="Popular picks our guests order again and again."
                />
                <MenuItemGrid
                  items={seasonalItems}
                  branchCurrency={branchCurrency}
                  branchSlug={branchId}
                  onSelect={setSelected}
                />
              </section>
            )}

            {MENU_CATEGORIES.map((cat) => {
              let items = itemsByCategory.get(cat.id) ?? [];
              if (showSeasonal) items = items.filter((i) => !i.featured);
              if (!items.length) return null;
              return (
                <section
                  key={cat.id}
                  id={`menu-${cat.id}`}
                  className="scroll-mt-[13rem] sm:scroll-mt-[15rem]"
                >
                  <SectionHeader title={cat.label} hint={MENU_CATEGORY_HINTS[cat.id]} />
                  <MenuItemGrid
                    items={items}
                    branchCurrency={branchCurrency}
                    branchSlug={branchId}
                    onSelect={setSelected}
                  />
                </section>
              );
            })}

            {totalVisible === 0 && (
              <div className="rounded-xl border border-outline-variant/35 bg-surface px-6 py-14 text-center sm:px-10">
                <p className="text-lg font-semibold text-on-surface">No matches right now</p>
                <p className="mx-auto mt-2 max-w-md text-body-md text-muted">
                  Try a different search word, turn off &ldquo;Favourites only&rdquo;, or reset
                  your filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-container"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {cartCount > 0 && (
        <div className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4 sm:hidden">
          <button
            type="button"
            onClick={openCart}
            className="inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(53,89,39,0.35)]"
          >
            View cart · {cartCount} {cartCount === 1 ? "item" : "items"}
          </button>
        </div>
      )}

      {selected && (
        <MenuItemDetailModal
          item={selected}
          branchCurrency={branchCurrency}
          branchSlug={branchId}
          onClose={() => setSelected(null)}
          onAddToCart={() => {
            addItem({
              menuItemId: selected._id,
              name: selected.name,
              price: selected.price,
            });
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <header className="max-w-2xl">
      <h2 className="menu-cb-section-title">{title}</h2>
      <p className="mt-2 text-body-md text-muted">{hint}</p>
    </header>
  );
}

function MenuItemGrid({
  items,
  branchCurrency,
  branchSlug,
  onSelect,
}: {
  items: MenuItem[];
  branchCurrency: string;
  branchSlug: string;
  onSelect: (item: MenuItem) => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3.5 sm:mt-8 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {items.map((item, index) => (
        <MenuCard
          key={item._id}
          menuItem={item}
          branchSlug={branchSlug}
          showFavorite
          name={item.name}
          description={item.description}
          price={item.price}
          currency={branchCurrency}
          imageUrl={item.imageUrl}
          category={item.category}
          featured={item.featured}
          index={index}
          priority={index < 4}
          onOpen={() => onSelect(item)}
        />
      ))}
    </div>
  );
}
