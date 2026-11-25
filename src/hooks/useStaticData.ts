import {
  BRANCHES,
  STATIC_FAQS,
  STATIC_MENU_ITEMS,
  STATIC_TEAM,
  STATIC_ABOUT_STATS,
  HOME_STATS,
  type MenuCategory,
  type MenuItem,
} from "@/data/content";
import type { BranchId } from "@/branch/BranchContext";

type BranchSlug = (typeof BRANCHES)[number]["id"];

function menuAvailableAtBranch(availableIn: MenuItem["availableIn"], branchId: BranchId) {
  if (!availableIn) return true;
  return (availableIn as readonly BranchSlug[]).includes(branchId as BranchSlug);
}

export const hasConvex = false;

export function useMenuItems(options?: {
  category?: MenuCategory;
  featuredOnly?: boolean;
  branchId?: BranchId;
}): MenuItem[] {
  let items: MenuItem[] = STATIC_MENU_ITEMS;
  if (options?.category) {
    items = items.filter((item) => item.category === options.category);
  }
  if (options?.featuredOnly) {
    items = items.filter((item) => item.featured);
  }
  if (options?.branchId) {
    items = items.filter((item) =>
      menuAvailableAtBranch(item.availableIn, options.branchId!),
    );
  }
  return items;
}

export function useTeamMembers() {
  return STATIC_TEAM;
}

export function useAboutStats() {
  return STATIC_ABOUT_STATS;
}

export function useHomeStats() {
  return HOME_STATS;
}

export function useFaqs() {
  return STATIC_FAQS;
}
