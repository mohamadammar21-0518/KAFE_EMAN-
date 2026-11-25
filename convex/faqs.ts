import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const faqs = await ctx.db.query("faqs").withIndex("by_sort").collect();
    return faqs
      .filter((f) => f.active !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
