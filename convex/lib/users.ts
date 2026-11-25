import type { UserIdentity } from "convex/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { profileFromIdentity } from "./identity";
import { issueCouponsEarned, welcomeBonusBalance } from "./loyalty";

type Ctx = QueryCtx | MutationCtx;

export async function requireIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in to continue.");
  }
  return identity;
}

export async function getUserByClerkId(ctx: Ctx, clerkUserId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

export async function getOrCreateUser(
  ctx: MutationCtx,
  identity: UserIdentity,
): Promise<Doc<"users">> {
  const existing = await getUserByClerkId(ctx, identity.subject);
  if (existing) return existing;

  const now = Date.now();
  const profile = profileFromIdentity(identity);
  const welcome = welcomeBonusBalance(0);

  const id = await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    email: profile.email ?? "",
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    active: true,
    points: welcome.points,
    totalOrders: 0,
    welcomeBonusGranted: true,
    createdAt: now,
    updatedAt: now,
  });

  await issueCouponsEarned(ctx, id, welcome.couponsEarned, now);

  const user = await ctx.db.get(id);
  if (!user) throw new Error("Failed to create user profile.");
  return user;
}

export async function listActiveCoupons(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("coupons")
    .withIndex("by_user_redeemed", (q) => q.eq("userId", userId).eq("redeemed", false))
    .collect();
}
