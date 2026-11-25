import { internalMutation } from "../_generated/server";
import { stepAlignAppData } from "./lib/steps";

/**
 * Branches, menu catalog, site settings, slugs, contact refs, users.
 * Prefer `migrations/runAll:run` for a full sync after many schema changes.
 *
 * ```bash
 * npx convex run migrations/alignAppData:run
 * ```
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => ({ ok: true, report: await stepAlignAppData(ctx) }),
});
