import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/adminAuth";
import { DEFAULT_SITE_SETTINGS } from "./lib/branchDefaults";

const adminToken = v.string();

export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();

    if (!row) return { ...DEFAULT_SITE_SETTINGS, key: "global" as const };

    return row;
  },
});

export const upsert = mutation({
  args: {
    adminToken,
    location: v.string(),
    phone: v.string(),
    email: v.string(),
    hours: v.string(),
    instagramUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    xUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();

    const payload = {
      location: args.location.trim(),
      phone: args.phone.trim(),
      email: args.email.trim(),
      hours: args.hours.trim(),
      instagramUrl: args.instagramUrl?.trim() || undefined,
      facebookUrl: args.facebookUrl?.trim() || undefined,
      xUrl: args.xUrl?.trim() || undefined,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("siteSettings", {
      key: "global",
      ...payload,
    });
  },
});
