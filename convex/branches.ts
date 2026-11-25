import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireCanDelete } from "./lib/adminAuth";
import { slugify } from "./lib/slug";
import { DEFAULT_BRANCHES, DEFAULT_MENU_CATEGORY_LABELS } from "./lib/branchDefaults";
import { currencyOrDefault, normalizeCurrencyCode } from "./lib/currency";

const adminToken = v.string();

const branchFields = {
  label: v.string(),
  subtitle: v.optional(v.string()),
  address: v.string(),
  concept: v.optional(v.string()),
  hours: v.array(v.string()),
  active: v.boolean(),
  sortOrder: v.number(),
  currency: v.optional(v.string()),
};

export async function branchCurrencyForSlug(ctx: QueryCtx | MutationCtx, slug: string) {
  const branch = await ctx.db
    .query("branches")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  return currencyOrDefault(branch?.currency);
}

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const branches = await ctx.db
      .query("branches")
      .withIndex("by_active_sort", (q) => q.eq("active", true))
      .collect();
    return branches.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const listAll = query({
  args: { adminToken },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const branches = await ctx.db.query("branches").collect();
    return branches.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("branches")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const create = mutation({
  args: {
    adminToken,
    slug: v.optional(v.string()),
    ...branchFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const slug = (args.slug?.trim() || slugify(args.label)).toLowerCase();
    if (!slug) throw new Error("Branch slug is required.");

    const existing = await ctx.db
      .query("branches")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) throw new Error("A branch with this slug already exists.");

    const now = Date.now();
    const currency = normalizeCurrencyCode(args.currency);
    const id = await ctx.db.insert("branches", {
      slug,
      label: args.label.trim(),
      subtitle: args.subtitle?.trim() || undefined,
      address: args.address.trim(),
      concept: args.concept?.trim() || undefined,
      hours: args.hours.map((h) => h.trim()).filter(Boolean),
      active: args.active,
      sortOrder: args.sortOrder,
      currency,
      createdAt: now,
      updatedAt: now,
    });

    return { id, slug };
  },
});

export const update = mutation({
  args: {
    adminToken,
    id: v.id("branches"),
    ...branchFields,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const branch = await ctx.db.get(args.id);
    if (!branch) throw new Error("Branch not found.");

    const currency = normalizeCurrencyCode(args.currency ?? branch.currency);
    await ctx.db.patch(args.id, {
      label: args.label.trim(),
      subtitle: args.subtitle?.trim() || undefined,
      address: args.address.trim(),
      concept: args.concept?.trim() || undefined,
      hours: args.hours.map((h) => h.trim()).filter(Boolean),
      active: args.active,
      sortOrder: args.sortOrder,
      currency,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/** Inserts default branches + categories when table is empty (admin one-time setup). */
export const ensureDefaults = mutation({
  args: { adminToken },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
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
        active: true,
        sortOrder: b.sortOrder,
        currency: b.currency,
        createdAt: now,
        updatedAt: now,
      });

      for (let i = 0; i < DEFAULT_MENU_CATEGORY_LABELS.length; i++) {
        await ctx.db.insert("menuCategories", {
          branchSlug: b.slug,
          label: DEFAULT_MENU_CATEGORY_LABELS[i],
          sortOrder: i,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { seeded: true };
  },
});

export const remove = mutation({
  args: { adminToken, id: v.id("branches") },
  handler: async (ctx, args) => {
    await requireCanDelete(ctx, args.adminToken);
    const branch = await ctx.db.get(args.id);
    if (!branch) throw new Error("Branch not found.");

    const categories = await ctx.db
      .query("menuCategories")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", branch.slug))
      .collect();

    for (const cat of categories) {
      const items = await ctx.db
        .query("menuItems")
        .withIndex("by_category_id_sort", (q) => q.eq("categoryId", cat._id))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(cat._id);
    }

    await ctx.db.delete(args.id);
    return { ok: true };
  },
});
