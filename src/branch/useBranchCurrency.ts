import { useMemo } from "react";
import { useBranch } from "@/branch/BranchContext";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

/** ISO 4217 code for the currently selected branch (defaults to USD). */
export function useBranchCurrency() {
  const { branches, branchId } = useBranch();
  return useMemo(() => {
    const branch = branches.find((b) => b.id === branchId);
    return (branch?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  }, [branches, branchId]);
}
