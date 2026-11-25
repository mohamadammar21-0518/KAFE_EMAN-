import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useBranch } from "@/branch/BranchContext";
import { hasConvex } from "@/providers/AppProviders";

/** Syncs home branch between Clerk profile (Convex) and BranchContext. */
export function BranchConvexSync() {
  const { isSignedIn, userId } = useAuth();
  const { branchId, branches, setBranchIdLocal } = useBranch();
  const profile = useQuery(api.users.getMe, hasConvex() && isSignedIn ? {} : "skip");
  const setHomeBranch = useMutation(api.users.setHomeBranch);
  const initializedFor = useRef<string | null>(null);
  const lastSelection = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      initializedFor.current = null;
      lastSelection.current = null;
      return;
    }
    // Wait for this user's profile before choosing between local and saved preferences.
    if (!profile || profile.clerkUserId !== userId) return;
    if (initializedFor.current !== userId) {
      initializedFor.current = userId;
      if (profile.branchSlug && branches.some((branch) => branch.id === profile.branchSlug)) {
        lastSelection.current = profile.branchSlug;
        setBranchIdLocal(profile.branchSlug);
        return;
      }
    }
    if (!branchId || lastSelection.current === branchId) return;
    lastSelection.current = branchId;
    void setHomeBranch({ branchSlug: branchId }).catch(() => {
      if (initializedFor.current === userId && lastSelection.current === branchId) {
        lastSelection.current = null;
      }
    });
  }, [isSignedIn, userId, profile, branches, branchId, setBranchIdLocal, setHomeBranch]);

  return null;
}
