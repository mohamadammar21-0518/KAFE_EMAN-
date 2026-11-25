import { internalMutation } from "./_generated/server";

import { DEFAULT_BRANCHES, DEFAULT_MENU_CATEGORY_LABELS } from "./lib/branchDefaults";

/** Seeds branches + per-branch categories when the branches table is empty. */
export const seedBranchesAndCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("branches").first();
    if (existing) return { seeded: false };

    const now = Date.now();
    for (const b of DEFAULT_BRANCHES) {
      await ctx.db.insert("branches", {
        slug: b.slug,
        label: b.label,
        subtitle: "subtitle" in b ? b.subtitle : undefined,
        address: b.address,
        concept: "concept" in b ? b.concept : undefined,
        hours: [...b.hours],
        currency: b.currency,
        active: true,
        sortOrder: b.sortOrder,
        createdAt: now,
        updatedAt: now,
      });

      for (const [sortOrder, label] of DEFAULT_MENU_CATEGORY_LABELS.entries()) {
        await ctx.db.insert("menuCategories", {
          branchSlug: b.slug,
          label,
          sortOrder,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { seeded: true, branchCount: DEFAULT_BRANCHES.length };
  },
});


// Apply the confirmed shop details to existing branches without altering orders or prices.
export const syncShopBranches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const updated: string[] = [];
    for (const { slug, label, address, hours, currency, ...details } of DEFAULT_BRANCHES) {
      const branch = await ctx.db.query("branches").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
      if (!branch) continue;
      await ctx.db.patch(branch._id, {
        label, address, hours: [...hours], currency,
        subtitle: details.subtitle,
        concept: "concept" in details ? details.concept : undefined,
        updatedAt: Date.now(),
      });
      updated.push(slug);
    }
    return { updated };
  },
});
