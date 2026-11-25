import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { CouponTypeValue } from "./validators";
import { generateUniqueCouponCode } from "./couponCodes";

export async function insertCouponForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  type: CouponTypeValue,
  createdAt = Date.now(),
) {
  const code = await generateUniqueCouponCode(ctx);
  return await ctx.db.insert("coupons", {
    userId,
    type,
    code,
    redeemed: false,
    createdAt,
  });
}
