import type { QueryCtx } from "../_generated/server";
import { isCatalogMenuItem, isLegacyMenuItem } from "./menuItemHelpers";

export async function readBranchMenu(ctx: QueryCtx, branchSlug: string, includeOutOfStock = false) {
  const categories = await ctx.db
    .query("menuCategories")
    .withIndex("by_branch_sort", (q) => q.eq("branchSlug", branchSlug))
    .collect();

  const activeCategories = categories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);

  const modernItems = await ctx.db
    .query("menuItems")
    .withIndex("by_branch_sort", (q) => q.eq("branchSlug", branchSlug))
    .collect();

  const result = activeCategories.map((cat) => {
    const items = modernItems
      .filter((i) => i.categoryId === cat._id && isCatalogMenuItem(i) && (includeOutOfStock || !i.outOfStock))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      _id: cat._id,
      label: cat.label,
      sortOrder: cat.sortOrder,
      items: items.map((i) => ({
        _id: i._id,
        name: i.name,
        description: i.description,
        price: i.price,
        imageUrl: i.imageUrl,
        featured: i.featured,
        outOfStock: i.outOfStock ?? false,
        sortOrder: i.sortOrder,
      })),
    };
  });

  const hasModern = result.some((g) => g.items.some((item) => !item.outOfStock));
  if (hasModern) {
    return { mode: "catalog" as const, categories: result.filter((g) => g.items.length > 0) };
  }

  // Legacy fallback: fixed categories + availableIn filter
  const legacyCategoryLabels: Record<string, string> = {
    signature: "Signature Coffee",
    lattes: "Speciality Lattes",
    "tea-matcha": "Tea & Matcha",
    "bakery-dessert": "Bakery & Desserts",
    breakfast: "Breakfast & Bites",
  };

  const legacyItems = await ctx.db.query("menuItems").collect();
  const legacyGroups = Object.entries(legacyCategoryLabels).map(([id, label]) => {
    const items = legacyItems
      .filter(
        (i) =>
          isLegacyMenuItem(i) &&
          i.category === id &&
          (!i.availableIn || i.availableIn.includes(branchSlug)) &&
          (includeOutOfStock || !i.outOfStock),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      _id: id,
      label,
      sortOrder: 0,
      items: items.map((i) => ({
        _id: i._id,
        name: i.name,
        description: i.description,
        price: i.price,
        imageUrl: i.imageUrl,
        featured: i.featured,
        outOfStock: i.outOfStock ?? false,
        sortOrder: i.sortOrder,
      })),
    };
  });

  if (
    includeOutOfStock &&
    !legacyGroups.some((g) => g.items.some((item) => !item.outOfStock)) &&
    result.some((g) => g.items.length)
  ) {
    return { mode: "catalog" as const, categories: result.filter((g) => g.items.length) };
  }
  return {
    mode: "legacy" as const,
    categories: legacyGroups.filter((g) => g.items.length > 0),
  };
}
