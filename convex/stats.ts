import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("stats").withIndex("by_sort").collect();
    return stats.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
