import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireCanDelete } from "./lib/adminAuth";

const adminToken = v.string();

export const listAll = query({
  args: { adminToken },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const faqs = await ctx.db.query("faqs").withIndex("by_sort").collect();
    return faqs.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    adminToken,
    question: v.string(),
    answer: v.string(),
    sortOrder: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const all = await ctx.db.query("faqs").collect();
    const sortOrder =
      args.sortOrder ?? (all.length ? Math.max(...all.map((f) => f.sortOrder)) + 1 : 0);

    const now = Date.now();
    return await ctx.db.insert("faqs", {
      question: args.question.trim(),
      answer: args.answer.trim(),
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
    id: v.id("faqs"),
    question: v.string(),
    answer: v.string(),
    sortOrder: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.id, {
      question: args.question.trim(),
      answer: args.answer.trim(),
      sortOrder: args.sortOrder,
      active: args.active,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { adminToken, id: v.id("faqs") },
  handler: async (ctx, args) => {
    await requireCanDelete(ctx, args.adminToken);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});
