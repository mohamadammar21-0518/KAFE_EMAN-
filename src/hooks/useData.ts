import { hasConvex as isConvexConfigured } from "@/providers/AppProviders";
import * as convexHooks from "./useConvexData";
import * as staticHooks from "./useStaticData";

const hooks = isConvexConfigured() ? convexHooks : staticHooks;

/** True when `VITE_CONVEX_URL` is set and Convex client is active. */
export const hasConvex = isConvexConfigured();

export const useMenuItems = hooks.useMenuItems;
export const useTeamMembers = hooks.useTeamMembers;
export const useAboutStats = hooks.useAboutStats;
export const useHomeStats = hooks.useHomeStats;
export const useFaqs = hooks.useFaqs;
