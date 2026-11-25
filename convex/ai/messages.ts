import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { getUserByClerkId } from "../lib/users";

const threadArg = v.optional(v.id("aiThreads"));

export const beginTurn = internalMutation({
  args: { clerkUserId: v.string(), threadId: threadArg },
  handler: async (ctx, { clerkUserId, threadId }) => {
    const user = await getUserByClerkId(ctx, clerkUserId);
    if (!user) throw new ConvexError("Please finish setting up your café profile.");
    if (threadId && (await ctx.db.get(threadId))?.userId !== user._id) {
      throw new ConvexError("This conversation is unavailable.");
    }
    const now = Date.now();
    const recent = (user.chatRequestTimes ?? []).filter((time) => time > now - 60_000);
    if (recent.length >= 10) throw new ConvexError("Please wait a minute before sending another message.");
    await ctx.db.patch(user._id, { chatRequestTimes: [...recent, now] });
    const history = threadId
      ? await ctx.db
          .query("aiMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", threadId))
          .order("desc")
          .take(6)
      : [];
    return {
      userId: user._id,
      history: history
        .reverse()
        .filter((m) => m.role !== "system")
        .map(({ role, content }) => ({ role, content })),
    };
  },
});

// Commit the pair together so a failed provider call leaves the conversation retryable.
export const saveTurn = internalMutation({
  args: {
    threadId: threadArg,
    userId: v.id("users"),
    clerkUserId: v.string(),
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = args.threadId ? await ctx.db.get(args.threadId) : null;
    if (args.threadId && existing?.userId !== args.userId) {
      throw new ConvexError("This conversation is unavailable.");
    }
    const threadId =
      args.threadId ??
      (await ctx.db.insert("aiThreads", {
        userId: args.userId,
        clerkUserId: args.clerkUserId,
        createdAt: now,
        updatedAt: now,
      }));
    let count = existing?.messageCount ?? 0;
    let preview = existing?.preview;
    if (existing && existing.messageCount === undefined) {
      const prior = await ctx.db
        .query("aiMessages")
        .withIndex("by_thread", (q) => q.eq("threadId", threadId))
        .collect();
      count = prior.length;
      preview = prior[0]?.content.slice(0, 60);
    }
    await ctx.db.insert("aiMessages", { threadId, role: "user", content: args.question, createdAt: now });
    await ctx.db.insert("aiMessages", { threadId, role: "assistant", content: args.answer, createdAt: now });
    await ctx.db.patch(threadId, {
      updatedAt: now,
      preview: preview ?? args.question.slice(0, 60),
      messageCount: count + 2,
    });
    return threadId;
  },
});
