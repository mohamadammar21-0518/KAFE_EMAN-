import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { insertCouponForUser } from "./lib/coupons";
import {
  POINTS_REDEEM_THRESHOLD,
  POINTS_WELCOME_BONUS,
  issueCouponsEarned,
  welcomeBonusBalance,
} from "./lib/loyalty";
import { profileFromIdentity } from "./lib/identity";
import { branchSlug } from "./lib/validators";
import { compareOrdersByStatusThenCreated } from "./lib/orderStatusFlow";
import { getOrCreateUser, getUserByClerkId, listActiveCoupons, requireIdentity } from "./lib/users";

async function assertActiveBranch(ctx: Pick<MutationCtx, "db">, slug: string) {
  const branch = await ctx.db
    .query("branches")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!branch || !branch.active) {
    throw new Error("Please select a valid branch.");
  }
  return branch;
}

const PHONE_CODE_TTL_MS = 10 * 60 * 1000;

function generatePhoneCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function userNeedsOnboarding(user: {
  onboardingComplete?: boolean;
  dateOfBirth?: string;
  country?: string;
  phone?: string;
  phoneVerified?: boolean;
}) {
  if (user.onboardingComplete) return false;
  if (user.dateOfBirth && user.country && user.phone && user.phoneVerified) return false;
  return true;
}

export const syncProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);
    const profile = profileFromIdentity(identity);
    const now = Date.now();

    await ctx.db.patch(user._id, {
      email: profile.email ?? user.email,
      firstName: profile.firstName ?? user.firstName,
      lastName: profile.lastName ?? user.lastName,
      phone: profile.phone ?? user.phone,
      phoneVerified: profile.phone && profile.phone !== user.phone ? identity.phoneNumberVerified === true : user.phoneVerified,
      verifiedContactPhone: identity.phoneNumberVerified === true ? profile.phone : undefined,
      avatarUrl: profile.avatarUrl || user.avatarUrl,
      updatedAt: now,
    });

    const updated = await ctx.db.get(user._id);
    if (!updated) throw new Error("Failed to sync profile.");
    return updated;
  },
});

/** Persists the customer's selected home branch (menu, profile, admin Users filter). */
export const setHomeBranch = mutation({
  args: { branchSlug },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);
    const slug = args.branchSlug.trim();
    await assertActiveBranch(ctx, slug);
    const now = Date.now();
    await ctx.db.patch(user._id, { branchSlug: slug, updatedAt: now });
    return { branchSlug: slug };
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) return null;

    const coupons = await listActiveCoupons(ctx, user._id);

    return {
      ...user,
      activeCoupons: coupons.length,
      pointsToNextCoupon: Math.max(0, POINTS_REDEEM_THRESHOLD - user.points),
      canConvertPointsToCoupon: user.points >= POINTS_REDEEM_THRESHOLD,
      pointsRedeemThreshold: POINTS_REDEEM_THRESHOLD,
      activeCouponList: coupons.map((c) => ({
        _id: c._id,
        code: c.code,
        type: c.type,
        createdAt: c.createdAt,
      })),
      needsOnboarding: userNeedsOnboarding(user),
    };
  },
});

/** Spend 40 points to create one free-drink coupon with a checkout code. */
export const convertPointsToCoupon = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);

    if (user.points < POINTS_REDEEM_THRESHOLD) {
      throw new Error(
        `You need at least ${POINTS_REDEEM_THRESHOLD} points to convert a reward.`,
      );
    }

    const now = Date.now();
    const couponId = await insertCouponForUser(
      ctx,
      user._id,
      "free_drink",
      now,
    );
    const coupon = await ctx.db.get(couponId);
    if (!coupon) throw new Error("Failed to create coupon.");

    await ctx.db.patch(user._id, {
      points: user.points - POINTS_REDEEM_THRESHOLD,
      updatedAt: now,
    });

    if (!coupon.code) {
      throw new Error("Coupon was created without a code. Run migrations/backfillCouponCodes:run.");
    }

    return {
      couponId: coupon._id,
      code: coupon.code,
      pointsRemaining: user.points - POINTS_REDEEM_THRESHOLD,
    };
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);

    await ctx.db.patch(user._id, {
      firstName: args.firstName?.trim() || user.firstName,
      lastName: args.lastName?.trim() || user.lastName,
      phone: args.phone?.trim() || user.phone,
      ...(args.phone?.trim() && args.phone.trim() !== user.phone
        ? { phoneVerified: false, verifiedContactPhone: undefined } : {}),
      dateOfBirth: args.dateOfBirth?.trim() || user.dateOfBirth,
      country: args.country?.trim() || user.country,
      region: args.region?.trim() || user.region,
      city: args.city?.trim() || user.city,
      address: args.address?.trim() || user.address,
      email: args.email?.trim() || user.email,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

function orderBelongsToCustomer(
  order: { clerkUserId?: string; userId?: Id<"users"> },
  clerkSubject: string,
  userId: Id<"users"> | undefined,
) {
  if (order.clerkUserId === clerkSubject) return true;
  if (userId && order.userId === userId) return true;
  return false;
}

export const getMyOrderDetail = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!orderBelongsToCustomer(order, identity.subject, user?._id)) {
      return null;
    }

    return { order };
  },
});

export const myOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByClerkId(ctx, identity.subject);
    const byClerk = await ctx.db
      .query("orders")
      .withIndex("by_clerk_created", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    const byUser =
      user === null
        ? []
        : await ctx.db
            .query("orders")
            .withIndex("by_user_created", (q) => q.eq("userId", user._id))
            .collect();

    const seen = new Set<string>();
    const orders = [...byClerk, ...byUser].filter((o) => {
      if (seen.has(o._id)) return false;
      seen.add(o._id);
      return true;
    });

    return orders.sort((a, b) => {
      const aDone = a.status === "completed" || a.status === "cancelled";
      const bDone = b.status === "completed" || b.status === "cancelled";
      if (!aDone && !bDone) return compareOrdersByStatusThenCreated(a, b);
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return b.createdAt - a.createdAt;
    });
  },
});

export const sendPhoneCode = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await getOrCreateUser(ctx, identity);
    const phone = args.phone.trim();
    if (phone.length < 8) {
      throw new Error("Enter a valid phone number.");
    }

    const code = generatePhoneCode();
    const now = Date.now();

    const existing = await ctx.db
      .query("phoneVerifications")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    await ctx.db.insert("phoneVerifications", {
      clerkUserId: identity.subject,
      phone,
      code,
      expiresAt: now + PHONE_CODE_TTL_MS,
      createdAt: now,
    });

    return { sent: true, devCode: code };
  },
});

/** Saves profile fields between onboarding steps (does not mark onboarding complete). */
export const saveOnboardingProgress = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    branchSlug: v.optional(branchSlug),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);
    const now = Date.now();

    if (args.branchSlug?.trim()) {
      await assertActiveBranch(ctx, args.branchSlug.trim());
    }

    await ctx.db.patch(user._id, {
      firstName: args.firstName?.trim() || user.firstName,
      lastName: args.lastName?.trim() || user.lastName,
      email: args.email?.trim() || user.email,
      dateOfBirth: args.dateOfBirth?.trim() || user.dateOfBirth,
      country: args.country?.trim() || user.country,
      region: args.region?.trim() || user.region,
      city: args.city?.trim() || user.city,
      address: args.address?.trim() || user.address,
      branchSlug: args.branchSlug?.trim() || user.branchSlug,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const verifyPhoneCode = mutation({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);
    const phone = args.phone.trim();
    const code = args.code.trim();

    const pending = await ctx.db
      .query("phoneVerifications")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    const match = pending.find(
      (p) => p.phone === phone && p.code === code && p.expiresAt > Date.now(),
    );

    if (!match) {
      throw new Error("Invalid or expired verification code.");
    }

    await ctx.db.delete(match._id);

    await ctx.db.patch(user._id, {
      phone,
      phoneVerified: true,
      updatedAt: Date.now(),
    });

    return { verified: true };
  },
});

export const completeOnboarding = mutation({
  args: {
    firstName: v.string(),
    lastName: v.optional(v.string()),
    email: v.string(),
    dateOfBirth: v.string(),
    country: v.string(),
    region: v.string(),
    city: v.string(),
    address: v.string(),
    phone: v.string(),
    branchSlug,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);

    if (!user.phoneVerified || user.phone !== args.phone.trim()) {
      throw new Error("Verify your phone number before continuing.");
    }

    const slug = args.branchSlug.trim();
    await assertActiveBranch(ctx, slug);

    const now = Date.now();
    let points = user.points;
    const alreadyGranted = user.welcomeBonusGranted ?? false;
    let welcomeBonusPoints = 0;

    if (!alreadyGranted) {
      const applied = welcomeBonusBalance(points);
      points = applied.points;
      welcomeBonusPoints = POINTS_WELCOME_BONUS;
      await issueCouponsEarned(ctx, user._id, applied.couponsEarned, now);
    }

    const identityProfile = profileFromIdentity(identity);

    await ctx.db.patch(user._id, {
      firstName: args.firstName.trim(),
      lastName: args.lastName?.trim() || undefined,
      email: args.email.trim(),
      dateOfBirth: args.dateOfBirth.trim(),
      country: args.country.trim(),
      region: args.region.trim(),
      city: args.city.trim(),
      address: args.address.trim(),
      phone: args.phone.trim(),
      branchSlug: slug,
      avatarUrl: identityProfile.avatarUrl || user.avatarUrl,
      onboardingComplete: true,
      welcomeBonusGranted: true,
      points,
      updatedAt: now,
    });

    return {
      welcomeBonusPoints,
      points,
    };
  },
});

export const myCoupons = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) return [];

    const coupons = await ctx.db
      .query("coupons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return coupons.sort((a, b) => b.createdAt - a.createdAt);
  },
});
