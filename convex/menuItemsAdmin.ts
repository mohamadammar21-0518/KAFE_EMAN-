import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireCanDelete } from "./lib/adminAuth";

const adminToken = v.string();

export const listByCategory = query({
  args: {
    adminToken,
    categoryId: v.id("menuCategories"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_category_id_sort", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    adminToken,
    branchSlug: v.string(),
    categoryId: v.id("menuCategories"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    outOfStock: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.branchSlug !== args.branchSlug) {
      throw new Error("Category does not belong to this branch.");
    }

    const siblings = await ctx.db
      .query("menuItems")
      .withIndex("by_category_id_sort", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    const sortOrder =
      args.sortOrder ??
      (siblings.length ? Math.max(...siblings.map((i) => i.sortOrder)) + 1 : 0);

    const now = Date.now();
    return await ctx.db.insert("menuItems", {
      name: args.name.trim(),
      description: args.description?.trim() || undefined,
      price: args.price,
      branchSlug: args.branchSlug,
      categoryId: args.categoryId,
      imageUrl: args.imageUrl?.trim() || undefined,
      outOfStock: args.outOfStock ?? false,
      featured: args.featured ?? false,
      sortOrder,
      isLegacy: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    adminToken,
    id: v.id("menuItems"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    outOfStock: v.boolean(),
    featured: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Menu item not found.");

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      description: args.description?.trim() || undefined,
      price: args.price,
      imageUrl: args.imageUrl?.trim() || undefined,
      outOfStock: args.outOfStock,
      featured: args.featured,
      sortOrder: args.sortOrder,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { adminToken, id: v.id("menuItems") },
  handler: async (ctx, args) => {
    await requireCanDelete(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});
