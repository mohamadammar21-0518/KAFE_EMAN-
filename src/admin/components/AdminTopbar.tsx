import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { revokeAdminSession, type AdminSession } from "@/admin/auth";
import { hasConvex } from "@/providers/AppProviders";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return letters.join("") || "A";
}

export function AdminTopbar({
  session,
  onOpenMobileNav,
  onLogout,
}: {
  session: AdminSession;
  onOpenMobileNav?: () => void;
  onLogout: () => void;
}) {
  const logoutMutation = useMutation(api.admins.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const avatarText = useMemo(() => initials(session.name), [session.name]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await revokeAdminSession(
        hasConvex() ? logoutMutation : undefined,
        session.token,
      );
      onLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-5">
        <div className="flex min-w-0 items-center gap-2">
          {onOpenMobileNav ? (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-outline-variant/40 bg-white/80 text-coffee-dark md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <p className="truncate text-sm font-semibold text-coffee-dark">Admin Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/account"
            className="flex items-center gap-3 rounded-full border border-outline-variant/40 bg-white/60 px-3 py-1.5 transition hover:border-primary/30 hover:bg-white"
            title="My account"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full border border-outline-variant/40 bg-cream text-sm font-semibold text-coffee-title">
              {avatarText}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-coffee-dark">{session.name}</p>
              <p className="text-[11px] text-muted">
                {session.role === "superadmin" ? "Super admin" : "Staff"} · My account
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            aria-busy={loggingOut}
            aria-label={loggingOut ? "Logging out…" : "Logout"}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-outline-variant/40 bg-white/60 px-4 text-sm text-coffee-title transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{loggingOut ? "Logging out…" : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

