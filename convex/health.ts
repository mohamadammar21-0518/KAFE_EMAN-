import { query } from "./_generated/server";
import {
  APP_TABLE_GROUP_LABELS,
  APP_TABLE_NAMES,
  APP_TABLES,
  tablesByGroup,
} from "./lib/tableRegistry";

/** Public health check — no auth required. */
export const ping = query({
  args: {},
  handler: async (ctx) => {
    const inventory = await Promise.all(
      APP_TABLE_NAMES.map(async (name) => ({
        name,
        count: (await ctx.db.query(name).collect()).length,
      })),
    );

    return {
      ok: true,
      tableCount: APP_TABLE_NAMES.length,
      tables: Object.fromEntries(inventory.map((t) => [t.name, t.count])),
    };
  },
});

/**
 * Full inventory: every Convex table in schema.ts, document counts, and which app area uses it.
 * Compare this list to tables in the Convex dashboard — names must match exactly.
 */
export const tableInventory = query({
  args: {},
  handler: async (ctx) => {
    const rows = await Promise.all(
      APP_TABLE_NAMES.map(async (name) => {
        const meta = APP_TABLES[name];
        const count = (await ctx.db.query(name).collect()).length;
        return {
          table: name,
          label: meta.label,
          group: meta.group,
          groupLabel: APP_TABLE_GROUP_LABELS[meta.group],
          area: meta.area,
          modules: meta.modules,
          adminRoute: meta.adminRoute,
          features: meta.features,
          documentCount: count,
        };
      }),
    );

    rows.sort((a, b) => a.group.localeCompare(b.group) || a.table.localeCompare(b.table));

    const areaLabels: Record<(typeof rows)[number]["area"], string> = {
      storefront: "Website",
      admin: "Admin only",
      auth: "Login & security",
      both: "Website & admin",
    };

    return {
      totalTables: APP_TABLE_NAMES.length,
      groups: tablesByGroup(),
      rows: rows.map((row) => ({
        ...row,
        areaLabel: areaLabels[row.area],
      })),
      notes: [
        "Website customers (Clerk) live in `users` — not `admins`.",
        "Run `npm run convex:sync` after schema changes to backfill existing rows.",
        "See convex/SCHEMA.md for the full module and table map.",
      ],
    };
  },
});
