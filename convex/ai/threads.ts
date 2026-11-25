import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * AI chat threads - one thread per user conversation
 */

export const create = internalMutation({
  args: {
    userId: v.id("users"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const threadId = await ctx.db.insert("aiThreads", {
      userId: args.userId,
      clerkUserId: args.clerkUserId,
      createdAt: now,
      updatedAt: now,
    });
    return threadId;
  },
});

export const getByUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query("aiThreads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);
    return threads;
  },
});

export const getLatestByUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("aiThreads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
    return thread;
  },
});
