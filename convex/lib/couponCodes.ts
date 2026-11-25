import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

function randomSegment(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Customer-facing coupon code, e.g. KE-A3B7C9 */
export function formatCouponCode() {
  return `KE-${randomSegment(6)}`;
}

export async function generateUniqueCouponCode(ctx: Ctx) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = formatCouponCode();
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique coupon code. Please try again.");
}
