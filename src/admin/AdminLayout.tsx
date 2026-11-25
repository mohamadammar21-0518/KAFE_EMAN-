import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AdminAuthProvider } from "@/admin/AdminAuthContext";
import { AdminPermissionsProvider } from "@/admin/AdminPermissionsContext";
import { clearAdminSession, getAdminSession, normalizeAdminRole } from "@/admin/auth";
import { AdminMobileNav } from "@/admin/components/AdminMobileNav";
import { AdminSidebar } from "@/admin/components/AdminSidebar";
import { AdminTopbar } from "@/admin/components/AdminTopbar";
import { AdminOrderAlert } from "@/admin/components/AdminOrderAlert";
import { ConvexSetupNotice } from "@/components/convex/ConvexSetupNotice";
import { hasConvex } from "@/providers/AppProviders";

const SIDEBAR_KEY = "kafeeman.admin.sidebarCollapsed";

function getInitialCollapsed(): boolean {
  try {
    const raw = localStorage.getItem(SIDEBAR_KEY);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    // ignore
  }
  return window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
}

function AdminLayoutInner() {
  const location = useLocation();
  const navigate = useNavigate();

  const [localSession, setLocalSession] = useState(() => getAdminSession());
  const [collapsed, setCollapsed] = useState<boolean>(() => getInitialCollapsed());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const validated = useQuery(
    api.admins.validateSession,
    localSession?.token ? { adminToken: localSession.token } : "skip",
  );

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (validated === null && localSession) {
      clearAdminSession();
      setLocalSession(null);
    }
  }, [validated, localSession]);

  if (!localSession) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (validated === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-sm text-muted">
        Verifying admin session…
      </div>
    );
  }

  if (validated === null) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const role = normalizeAdminRole(validated.role);

  const session = {
    ...localSession,
    name: validated.displayName,
    username: validated.username,
    role,
  };

  return (
    <div className="admin-workspace min-h-screen bg-surface">
      <div className="flex">
        <div className="sticky top-0 hidden md:block">
          <AdminSidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <AdminMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
          <AdminTopbar
            session={session}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onLogout={() => {
              setLocalSession(null);
              navigate("/admin/login", { replace: true });
            }}
          />
          <main className="p-4 sm:p-5 md:p-7">
            <AdminPermissionsProvider
              adminId={validated.id}
              username={validated.username}
              displayName={validated.displayName}
              email={validated.email}
              role={role}
            >
              <AdminAuthProvider adminToken={localSession.token}>
                <Outlet />
                <AdminOrderAlert />
              </AdminAuthProvider>
            </AdminPermissionsProvider>
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  if (!hasConvex()) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface p-8">
        <ConvexSetupNotice context="The admin dashboard" />
      </div>
    );
  }

  return <AdminLayoutInner />;
}
