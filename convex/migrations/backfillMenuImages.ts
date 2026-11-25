import { internalMutation } from "../_generated/server";
import { stepBackfillMenuImages } from "./lib/steps";

/**
 * Sets open-stock `imageUrl` on menu rows (replaces local `/Images/` paths).
 *
 * ```bash
 * npx convex run migrations/backfillMenuImages:run
 * ```
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => stepBackfillMenuImages(ctx),
});
