import { internalMutation } from "../_generated/server";
import { stepBackfillOrders } from "./lib/steps";

/**
 * Backfills orderNumber, currency, couponCode on orders, and updatedAt.
 *
 * ```bash
 * npx convex run migrations/backfillOrders:run
 * ```
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => stepBackfillOrders(ctx),
});
