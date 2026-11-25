import { internalMutation } from "../_generated/server";
import { stepNormalizeOrderLineItemIds } from "./lib/steps";

/**
 * Rewrites legacy numeric menu ids on order line snapshots.
 *
 * ```bash
 * npx convex run migrations/normalizeOrderLineItemIds:run
 * ```
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => stepNormalizeOrderLineItemIds(ctx),
});
