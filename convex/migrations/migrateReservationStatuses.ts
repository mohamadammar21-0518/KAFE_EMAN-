import { internalMutation } from "../_generated/server";
import { stepMigrateReservationStatuses } from "./lib/steps";

/**
 * Maps legacy reservation statuses (confirmed / rejected) to the new workflow.
 *
 * ```bash
 * npx convex run migrations/migrateReservationStatuses:run
 * ```
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => stepMigrateReservationStatuses(ctx),
});
