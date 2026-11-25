import { internalMutation } from "../_generated/server";
import { stepBackfillUsers } from "./lib/steps";

/**
 * Ensures user rows match admin suspension / active flags.
 *
 * ```bash
 * npx convex run migrations/backfillUsers:run
 * ```
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => stepBackfillUsers(ctx),
});
