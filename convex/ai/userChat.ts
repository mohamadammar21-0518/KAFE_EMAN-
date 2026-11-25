import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getUserByClerkId } from "../lib/users";

/**
 * Public-facing AI chat queries and mutations for the storefront UI
 */

/** Get the latest thread for the signed-in user */
export const getMyThread = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) return null;

    const thread = await ctx.db
      .query("aiThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return thread;
  },
});

/** Get all threads for the signed-in user (for history sidebar) */
export const getAllMyThreads = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) return [];

    const threads = await ctx.db
      .query("aiThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // For each thread get the first user message as a preview title
    const threadsWithPreview = await Promise.all(
      threads.map(async (thread) => {
        if (thread.messageCount !== undefined && thread.preview !== undefined) {
          return { _id: thread._id, createdAt: thread.createdAt, updatedAt: thread.updatedAt,
            preview: thread.preview, messageCount: thread.messageCount };
        }
        const firstMsg = await ctx.db
          .query("aiMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .order("asc")
          .first();
        const msgCount = await ctx.db
          .query("aiMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .collect();
        return {
          _id: thread._id,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          preview: firstMsg?.content?.slice(0, 60) ?? "New conversation",
          messageCount: msgCount.length,
        };
      })
    );

    return threadsWithPreview.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/** Get messages for a specific thread */
export const getThreadMessages = query({
  args: {
    threadId: v.id("aiThreads"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) return [];

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== user._id) return [];

    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    return messages;
  },
});

/** Delete a single thread and all its messages */
export const deleteThread = mutation({
  args: { threadId: v.id("aiThreads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) throw new Error("User not found");

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== user._id) throw new Error("Thread not found");

    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.threadId);

    return { success: true };
  },
});

/** Clear all chat history */
export const clearMyChat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) throw new Error("User not found");

    const threads = await ctx.db
      .query("aiThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const thread of threads) {
      const messages = await ctx.db
        .query("aiMessages")
        .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(thread._id);
    }

    return { success: true };
  },
});
