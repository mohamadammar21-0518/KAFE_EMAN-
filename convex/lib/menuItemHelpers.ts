import type { Doc } from "../_generated/dataModel";

/** Admin + storefront catalog row (per branch, linked to menuCategories). */
export function isCatalogMenuItem(item: Doc<"menuItems">) {
  return Boolean(item.categoryId && item.branchSlug && !item.isLegacy);
}

/** Seed-era row kept for history only — hidden from menu UIs after migration. */
export function isLegacyMenuItem(item: Doc<"menuItems">) {
  return item.isLegacy === true || (Boolean(item.category) && !item.categoryId);
}
