import { createContext, useContext } from "react";

/** Set only after Convex confirms the admin session (see AdminLayout). */
const AdminAuthContext = createContext<string | undefined>(undefined);

export function AdminAuthProvider({
  adminToken,
  children,
}: {
  adminToken: string;
  children: React.ReactNode;
}) {
  return (
    <AdminAuthContext.Provider value={adminToken}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuthToken(): string | undefined {
  return useContext(AdminAuthContext);
}
