import { query } from "./_generated/server";
import { v } from "convex/values";
import { isCatalogMenuItem, isLegacyMenuItem } from "./lib/menuItemHelpers";

export const list = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("signature"),
        v.literal("lattes"),
        v.literal("tea-matcha"),
        v.literal("bakery-dessert"),
        v.literal("breakfast"),
      ),
    ),
    featuredOnly: v.optional(v.boolean()),
    branchSlug: v.optional(v.string()),
    /** @deprecated Use branchSlug */
    branchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      const items = await ctx.db
        .query("menuItems")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
      let featured = args.featuredOnly ? items.filter((item) => item.featured) : items;
      featured = featured.filter((item) => !item.isLegacy);
      const slug = args.branchSlug ?? args.branchId;
      if (!slug) return featured;
      return featured.filter(
        (item) =>
          (item.branchSlug === slug && isCatalogMenuItem(item)) ||
          (isLegacyMenuItem(item) &&
            (!item.availableIn || item.availableIn.includes(slug))),
      );
    }

    let items = await ctx.db.query("menuItems").collect();
    items = items.filter((item) => !item.isLegacy);
    const sorted = items.sort((a, b) => a.sortOrder - b.sortOrder);
    const slug = args.branchSlug ?? args.branchId;
    if (!slug) return sorted;
    return sorted.filter(
      (item) =>
        (item.branchSlug === slug && isCatalogMenuItem(item)) ||
        (isLegacyMenuItem(item) &&
          (!item.availableIn || item.availableIn.includes(slug))),
    );
  },
});
