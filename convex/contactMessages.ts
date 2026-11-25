import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireCanDelete } from "./lib/adminAuth";
import { buildMessageReference } from "./lib/referenceIds";

const adminToken = v.string();

const messageStatus = v.union(
  v.literal("pending"),
  v.literal("read"),
  v.literal("archived"),
);

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim() || !args.email.trim() || !args.message.trim()) {
      throw new Error("Name, email, and message are required.");
    }

    const now = Date.now();
    const prefix = buildMessageReference(0, now).replace(/-\d{3}$/, "");
    const existing = await ctx.db.query("contactMessages").collect();
    const todayCount = existing.filter((m) => m.referenceId?.startsWith(prefix)).length;
    const referenceId = buildMessageReference(todayCount, now);

    return await ctx.db.insert("contactMessages", {
      referenceId,
      name: args.name.trim(),
      email: args.email.trim(),
      phone: args.phone?.trim() || undefined,
      subject: args.subject?.trim() || undefined,
      message: args.message.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const list = query({
  args: { adminToken },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const rows = await ctx.db.query("contactMessages").withIndex("by_created").order("desc").collect();
    return rows;
  },
});

export const updateStatus = mutation({
  args: {
    adminToken,
    messageId: v.id("contactMessages"),
    status: messageStatus,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const row = await ctx.db.get(args.messageId);
    if (!row) throw new Error("Message not found.");
    await ctx.db.patch(args.messageId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    adminToken,
    messageId: v.id("contactMessages"),
  },
  handler: async (ctx, args) => {
    await requireCanDelete(ctx, args.adminToken);
    const row = await ctx.db.get(args.messageId);
    if (!row) throw new Error("Message not found.");
    await ctx.db.delete(args.messageId);
    return { ok: true };
  },
});
