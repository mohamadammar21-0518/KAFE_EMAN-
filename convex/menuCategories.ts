import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireCanDelete } from "./lib/adminAuth";

const adminToken = v.string();

export const listByBranch = query({
  args: {
    branchSlug: v.string(),
    adminToken: v.optional(adminToken),
  },
  handler: async (ctx, args) => {
    if (args.adminToken) {
      await requireAdmin(ctx, args.adminToken);
    }

    const categories = await ctx.db
      .query("menuCategories")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", args.branchSlug))
      .collect();

    return categories
      .filter((c) => (args.adminToken ? true : c.active))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    adminToken,
    branchSlug: v.string(),
    label: v.string(),
    sortOrder: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const existing = await ctx.db
      .query("menuCategories")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", args.branchSlug))
      .collect();

    const now = Date.now();
    const sortOrder =
      args.sortOrder ?? (existing.length ? Math.max(...existing.map((c) => c.sortOrder)) + 1 : 0);

    return await ctx.db.insert("menuCategories", {
      branchSlug: args.branchSlug,
      label: args.label.trim(),
      sortOrder,
      active: args.active ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    adminToken,
    id: v.id("menuCategories"),
    label: v.string(),
    sortOrder: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const cat = await ctx.db.get(args.id);
    if (!cat) throw new Error("Category not found.");

    await ctx.db.patch(args.id, {
      label: args.label.trim(),
      sortOrder: args.sortOrder,
      active: args.active,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { adminToken, id: v.id("menuCategories") },
  handler: async (ctx, args) => {
    await requireCanDelete(ctx, args.adminToken);
    const cat = await ctx.db.get(args.id);
    if (!cat) throw new Error("Category not found.");

    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_category_id_sort", (q) => q.eq("categoryId", cat._id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
    return { ok: true };
  },
});
