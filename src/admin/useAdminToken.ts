import { useAdminAuthToken } from "@/admin/AdminAuthContext";

/** Verified admin session token for Convex admin APIs (admin layout only). */
export function useAdminToken(): string | undefined {
  return useAdminAuthToken();
}
