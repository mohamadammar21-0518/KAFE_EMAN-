import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { insertCouponForUser } from "./coupons";

/** Points earned when an order is successfully paid or marked completed (once per order). */
export const POINTS_PER_SUCCESSFUL_ORDER = 10;
/** One free-drink coupon per this many points (auto when threshold reached, or manual convert). */
export const POINTS_REDEEM_THRESHOLD = 40;
/** Granted once when a new customer account is created (first sign-in). */
export const POINTS_WELCOME_BONUS = 20;

/** @deprecated Use POINTS_PER_SUCCESSFUL_ORDER */
export const POINTS_FIRST_ORDER = POINTS_PER_SUCCESSFUL_ORDER;
/** @deprecated Use POINTS_PER_SUCCESSFUL_ORDER */
export const POINTS_REPEAT_ORDER = POINTS_PER_SUCCESSFUL_ORDER;

export function pointsForSuccessfulOrder(): number {
  return POINTS_PER_SUCCESSFUL_ORDER;
}

/** @deprecated Use pointsForSuccessfulOrder */
export function pointsForOrderNumber(completedOrderCount: number): number;
export function pointsForOrderNumber() {
  return POINTS_PER_SUCCESSFUL_ORDER;
}

export function applyPointsAndCoupons(currentPoints: number, earned: number) {
  let points = currentPoints + earned;
  let couponsEarned = 0;
  while (points >= POINTS_REDEEM_THRESHOLD) {
    points -= POINTS_REDEEM_THRESHOLD;
    couponsEarned += 1;
  }
  return { points, couponsEarned };
}

/**
 * Awards loyalty for a successful order (idempotent via order.pointsEarned).
 * Call when checkout is paid or when admin marks the order completed.
 */
export async function awardLoyaltyForOrder(
  ctx: MutationCtx,
  order: Doc<"orders">,
): Promise<{
  pointsEarned: number;
  couponsEarned: number;
  newPointsBalance: number;
} | null> {
  if (order.pointsEarned != null) {
    return null;
  }
  if (!order.userId || order.status === "cancelled") {
    return null;
  }

  const user = await ctx.db.get(order.userId);
  if (!user) return null;

  const pointsEarned = POINTS_PER_SUCCESSFUL_ORDER;
  const { points, couponsEarned } = applyPointsAndCoupons(user.points, pointsEarned);
  const now = Date.now();

  for (let i = 0; i < couponsEarned; i++) {
    await insertCouponForUser(ctx, user._id, "free_drink", now);
  }

  const slug = order.branchSlug ?? order.branchId;
  const userPatch: {
    totalOrders: number;
    points: number;
    updatedAt: number;
    branchSlug?: string;
  } = {
    totalOrders: user.totalOrders + 1,
    points,
    updatedAt: now,
  };
  if (!user.branchSlug && slug) {
    userPatch.branchSlug = slug;
  }
  await ctx.db.patch(user._id, userPatch);

  return { pointsEarned, couponsEarned, newPointsBalance: points };
}

/** Welcome bonus points applied to a new account balance (coupons issued after user id exists). */
export function welcomeBonusBalance(currentPoints: number) {
  return applyPointsAndCoupons(currentPoints, POINTS_WELCOME_BONUS);
}

export async function issueCouponsEarned(
  ctx: MutationCtx,
  userId: Id<"users">,
  count: number,
  createdAt = Date.now(),
) {
  for (let i = 0; i < count; i++) {
    await insertCouponForUser(ctx, userId, "free_drink", createdAt);
  }
}
