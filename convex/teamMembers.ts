import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_sort")
      .collect();
    return members.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
