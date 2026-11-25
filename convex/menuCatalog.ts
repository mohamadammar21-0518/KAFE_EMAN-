import { query } from "./_generated/server";
import { v } from "convex/values";
import { readBranchMenu } from "./lib/branchMenu";

/** Grouped menu for a branch: categories with their products (storefront). */
export const byBranch = query({
  args: { branchSlug: v.string() },
  handler: async (ctx, args) => {
    return readBranchMenu(ctx, args.branchSlug);
  },
});
