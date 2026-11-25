import { internalMutation } from "../_generated/server";
import { runAllMigrationSteps } from "./lib/steps";

/**
 * Runs every data migration in the correct order (safe to re-run).
 *
 * ```bash
 * npx convex run migrations/runAll:run
 * ```
 *
 * Steps (in order):
 * 1. adminRoles — legacy admin role → staff, admin emails
 * 2. alignAppData — branches, menu, site settings, branch slugs
 * 3–4. reservations — status + field backfills
 * 5. couponCodes — KE-XXXXXX on loyalty coupons
 * 6. users — active flag, expired suspensions
 * 7. loyaltyUsers — welcomeBonusGranted, totalOrders defaults
 * 8. orders — orderNumber, currency, coupon snapshots
 * 9. loyaltyOrders — pointsEarned: 0 on old paid orders (no retroactive points)
 * 10–11. orderLineItemIds, menuImages
 * 12. testimonials — sortOrder / acceptedAt / updatedAt on feedback rows
 * 13. verify — integrity report (all tables)
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => runAllMigrationSteps(ctx),
});
