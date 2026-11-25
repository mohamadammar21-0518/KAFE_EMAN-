import { internalMutation } from "../_generated/server";
import { stepBackfillCouponCodes } from "./lib/steps";

/**
 * Adds missing `code` on coupon rows (e.g. KE-A3B7C9).
 *
 * ```bash
 * npx convex run migrations/backfillCouponCodes:run
 * ```
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => stepBackfillCouponCodes(ctx),
});
