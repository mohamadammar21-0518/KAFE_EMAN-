import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  HOME_STATS,
  STATIC_ABOUT_STATS,
  STATIC_FAQS,
  STATIC_MENU_ITEMS,
  STATIC_TEAM,
  type MenuCategory,
  type MenuItem,
} from "@/data/content";
import type { BranchId } from "@/branch/BranchContext";
import { BRANCHES } from "@/data/content";
import { CATEGORY_LABEL_TO_LEGACY } from "@/lib/menuCategories";
import { hasConvex as isConvexConfigured } from "@/providers/AppProviders";

type BranchSlug = (typeof BRANCHES)[number]["id"];

function menuAvailableAtBranch(availableIn: MenuItem["availableIn"], branchId: BranchId) {
  if (!availableIn) return true;
  return (availableIn as readonly BranchSlug[]).includes(branchId as BranchSlug);
}

export const hasConvex = isConvexConfigured();

type BranchCatalog = {
  mode: "catalog" | "legacy";
  categories: Array<{
    _id: string;
    label: string;
    items: Array<{
      _id: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      featured: boolean;
      sortOrder: number;
    }>;
  }>;
};

function catalogToMenuItems(catalog: BranchCatalog): MenuItem[] {


  const items: MenuItem[] = [];
  for (const group of catalog.categories) {
    const legacyCategory = (catalog.mode === "legacy" ? group._id :
      CATEGORY_LABEL_TO_LEGACY[group.label] ?? "signature") as MenuCategory;

    for (const item of group.items) {
      items.push({
        _id: item._id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        category: legacyCategory,
        featured: item.featured,
        sortOrder: item.sortOrder,
        availableIn: undefined,
      });
    }
  }
  return items;
}

function legacyDocToMenuItem(item: Doc<"menuItems">): MenuItem {
  return {
    _id: item._id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    category: (item.category ?? "signature") as MenuCategory,
    featured: item.featured,
    sortOrder: item.sortOrder,
    availableIn: item.availableIn as MenuItem["availableIn"],
  };
}

export function useMenuItems(options?: {
  category?: MenuCategory;
  featuredOnly?: boolean;
  branchId?: BranchId;
}): MenuItem[] {
  const catalog = useBranchMenuCatalog(options?.branchId);
  const legacy = useQuery(
    api.menuItems.list,
    hasConvex && !options?.branchId
      ? {
          category: options?.category,
          featuredOnly: options?.featuredOnly,
          branchId: options?.branchId,
        }
      : "skip",
  );

  let items: MenuItem[];
  if (catalog) {
    items = catalogToMenuItems(catalog);
  } else if (hasConvex) {
    items = (legacy ?? []).map(legacyDocToMenuItem);
  } else {
    items = [...STATIC_MENU_ITEMS];
  }

  if (options?.category) {
    items = items.filter((i) => i.category === options.category);
  }
  if (options?.featuredOnly) {
    items = items.filter((i) => i.featured);
  }
  if (options?.branchId && catalog?.mode !== "catalog") {
    items = items.filter((i) => menuAvailableAtBranch(i.availableIn, options.branchId!));
  }

  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function useTeamMembers() {
  const data = useQuery(api.teamMembers.list, hasConvex ? {} : "skip");
  return data ?? STATIC_TEAM;
}

export function useAboutStats() {
  const data = useQuery(api.stats.list, hasConvex ? {} : "skip");
  const all = data ?? STATIC_ABOUT_STATS;
  return all.filter((stat: { sortOrder: number }) => stat.sortOrder >= 4);
}

export function useHomeStats() {
  const data = useQuery(api.stats.list, hasConvex ? {} : "skip");
  if (!data) return HOME_STATS;
  return data
    .filter((stat: { sortOrder: number }) => stat.sortOrder <= 3)
    .map((stat: { value: number; suffix: string; label: string }) => ({
      value: stat.value,
      suffix: stat.suffix,
      label: stat.label,
    }));
}

export function useFaqs() {
  const data = useQuery(api.faqs.list, hasConvex ? {} : "skip");
  return data ?? STATIC_FAQS;
}

export function useBranchMenuCatalog(branchSlug: string | undefined) {
  return useQuery(
    api.menuCatalog.byBranch,
    hasConvex && branchSlug ? { branchSlug } : "skip",
  );
}
