import type { MutationCtx, QueryCtx } from "../_generated/server";
import { buildOrderNumber } from "./referenceIds";

type Ctx = QueryCtx | MutationCtx;

function startOfUtcDayMs(now: number) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Human-readable order id: ORD-YYYYMMDD-### (sequential per UTC day). */
export async function nextOrderNumber(ctx: Ctx, now = Date.now()) {
  const prefix = buildOrderNumber(0, now).replace(/-\d{3}$/, "");
  const dayStart = startOfUtcDayMs(now);

  const recent = await ctx.db
    .query("orders")
    .withIndex("by_created", (q) => q.gte("createdAt", dayStart))
    .collect();

  const todayCount = recent.filter((o) => o.orderNumber.startsWith(prefix)).length;
  return buildOrderNumber(todayCount, now);
}
