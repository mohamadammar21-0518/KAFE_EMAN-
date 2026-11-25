import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminToken } from "@/admin/useAdminToken";

/** Branch slug + label pairs for admin filters (orders, users, etc.). */
export function useAdminBranchOptions() {
  const adminToken = useAdminToken();
  const branches = useQuery(
    api.branches.listAll,
    adminToken ? { adminToken } : "skip",
  );
  return (
    branches?.map((b) => ({
      id: b.slug,
      label: b.label,
      convexId: b._id,
      currency: b.currency,
    })) ?? []
  );
}
