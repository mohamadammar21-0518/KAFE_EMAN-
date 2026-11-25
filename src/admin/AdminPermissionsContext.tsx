import { createContext, useContext } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import type { AdminRole } from "@/admin/auth";

type AdminPermissions = {
  adminId: Id<"admins">;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
  isSuperAdmin: boolean;
  canDelete: boolean;
  canManageStaff: boolean;
};

const AdminPermissionsContext = createContext<AdminPermissions | null>(null);

export function AdminPermissionsProvider({
  adminId,
  username,
  displayName,
  email,
  role,
  children,
}: {
  adminId: Id<"admins">;
  username: string;
  displayName: string;
  email?: string;
  role: AdminRole;
  children: React.ReactNode;
}) {
  const isSuperAdmin = role === "superadmin";
  const value: AdminPermissions = {
    adminId,
    username,
    displayName,
    email: email ?? "",
    role,
    isSuperAdmin,
    canDelete: isSuperAdmin,
    canManageStaff: isSuperAdmin,
  };
  return (
    <AdminPermissionsContext.Provider value={value}>{children}</AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions(): AdminPermissions {
  const ctx = useContext(AdminPermissionsContext);
  if (!ctx) {
    throw new Error("useAdminPermissions must be used within AdminPermissionsProvider");
  }
  return ctx;
}
