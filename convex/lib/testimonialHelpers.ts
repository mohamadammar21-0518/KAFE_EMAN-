import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { getMenuStockImageUrl } from "./menuStockImages";
import { isCatalogMenuItem } from "./menuItemHelpers";

type Ctx = QueryCtx | MutationCtx;

const DEFAULT_TESTIMONIAL_IMAGE =
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=1000&q=80&auto=format&fit=crop";

export function displayNameFromUser(user: Pick<Doc<"users">, "firstName" | "lastName" | "email">) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  const local = user.email.split("@")[0]?.trim();
  return local || "Guest";
}

export async function resolveTestimonialImageUrl(
  ctx: Ctx,
  args: {
    targetType: "all" | "category" | "menuItem";
    categoryId?: Id<"menuCategories">;
    menuItemId?: Id<"menuItems">;
    branchSlug?: string;
    imageStorageId?: Id<"_storage">;
  },
): Promise<string> {
  if (args.imageStorageId) {
    const uploaded = await ctx.storage.getUrl(args.imageStorageId);
    if (uploaded) return uploaded;
  }

  if (args.targetType === "menuItem" && args.menuItemId) {
    const item = await ctx.db.get(args.menuItemId);
    if (item?.imageUrl?.trim()) return item.imageUrl.trim();
    if (item?.name) return getMenuStockImageUrl(item.name);
  }

  if (args.targetType === "category" && args.categoryId) {
    const slug = args.branchSlug?.trim();
    const items = slug
      ? await ctx.db
          .query("menuItems")
          .withIndex("by_branch_sort", (q) => q.eq("branchSlug", slug))
          .collect()
      : await ctx.db.query("menuItems").collect();

    const match = items
      .filter((i) => i.categoryId === args.categoryId && isCatalogMenuItem(i))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .find((i) => i.imageUrl?.trim());

    if (match?.imageUrl?.trim()) return match.imageUrl.trim();
    if (match?.name) return getMenuStockImageUrl(match.name);
  }

  if (args.branchSlug) {
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", args.branchSlug!))
      .collect();
    const withImage = items
      .filter((i) => isCatalogMenuItem(i) && i.imageUrl?.trim())
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (withImage?.imageUrl?.trim()) return withImage.imageUrl.trim();
  }

  return DEFAULT_TESTIMONIAL_IMAGE;
}
