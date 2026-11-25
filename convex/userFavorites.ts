import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { branchSlug } from "./lib/validators";
import { getOrCreateUser, requireIdentity } from "./lib/users";

const menuItemIdArg = v.string();

export const myFavoriteIds = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return [];

    const rows = await ctx.db
      .query("userFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return rows.map((r) => r.menuItemId);
  },
});

export const myFavorites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return [];

    const rows = await ctx.db
      .query("userFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = await Promise.all(
      rows.map(async (row) => {
        let livePrice = row.price;
        let liveName = row.name;
        let outOfStock = false;
        try {
          const doc = await ctx.db.get(row.menuItemId as Id<"menuItems">);
          if (doc) {
            livePrice = doc.price;
            liveName = doc.name;
            outOfStock = doc.outOfStock ?? false;
          }
        } catch {
          // static or removed ids — use snapshot only
        }
        return {
          _id: row._id,
          menuItemId: row.menuItemId,
          branchSlug: row.branchSlug,
          name: liveName,
          price: livePrice,
          imageUrl: row.imageUrl,
          description: row.description,
          category: row.category,
          outOfStock,
          createdAt: row.createdAt,
        };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const toggle = mutation({
  args: {
    menuItemId: menuItemIdArg,
    branchSlug: v.optional(branchSlug),
    name: v.string(),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);
    const menuItemId = args.menuItemId.trim();
    if (!menuItemId) throw new Error("Menu item is required.");

    const existing = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", user._id).eq("menuItemId", menuItemId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false, favoriteCount: await countFavorites(ctx, user._id) };
    }

    const now = Date.now();
    await ctx.db.insert("userFavorites", {
      userId: user._id,
      menuItemId,
      branchSlug: args.branchSlug?.trim() || user.branchSlug,
      name: args.name.trim(),
      price: args.price,
      imageUrl: args.imageUrl?.trim() || undefined,
      description: args.description?.trim() || undefined,
      category: args.category?.trim() || undefined,
      createdAt: now,
    });

    return { favorited: true, favoriteCount: await countFavorites(ctx, user._id) };
  },
});

async function countFavorites(ctx: MutationCtx, userId: Id<"users">) {
  const rows = await ctx.db
    .query("userFavorites")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return rows.length;
}
