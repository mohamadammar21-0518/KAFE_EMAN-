import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { clearAdminSession, getAdminSession, normalizeAdminRole, setAdminSession } from "@/admin/auth";
import { ConvexSetupNotice } from "@/components/convex/ConvexSetupNotice";
import { hasConvex } from "@/providers/AppProviders";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

function AdminLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useMutation(api.admins.login);

  const [localSession, setLocalSession] = useState(() => getAdminSession());
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validated = useQuery(
    api.admins.validateSession,
    localSession?.token ? { adminToken: localSession.token } : "skip",
  );

  useEffect(() => {
    setLocalSession(getAdminSession());
  }, [location.key]);

  useEffect(() => {
    if (validated !== null || !localSession) return;
    clearAdminSession();
    setLocalSession(null);
  }, [validated, localSession]);

  if (localSession && validated === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-b from-cream to-surface text-sm text-muted">
        Checking session…
      </div>
    );
  }

  if (localSession && validated) {
    return <Navigate to="/admin" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-surface">
      <div className="container-main flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md rounded-3xl border border-outline-variant/40 bg-white/70 p-7 shadow-card backdrop-blur-md">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl border border-outline-variant/40 bg-cream text-coffee-title shadow-card">
              <span className="text-base font-semibold">KE</span>
            </div>
            <h1 className="mt-4 text-headline-md text-coffee-dark">Admin login</h1>
            <p className="mt-1 text-sm text-muted">
              Sign in with your staff admin account for Kafe Eman.
            </p>
          </div>

          <form
            className="grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              try {
                const result = await login({ username, password });
                const session = {
                  token: result.token,
                  name: result.admin.displayName,
                  username: result.admin.username,
                  role: normalizeAdminRole(result.admin.role),
                  expiresAt: result.expiresAt,
                  createdAt: Date.now(),
                };
                setAdminSession(session);
                setLocalSession(session);
                navigate(from, { replace: true });
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Invalid username or password.";
                setError(message);
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="grid gap-2">
              <label htmlFor="admin-username" className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Username
              </label>
              <input id="admin-username"
                className="w-full rounded-2xl border border-outline-variant/40 bg-white/80 px-4 py-3 text-sm outline-none transition-colors hover:border-outline/50 focus:border-brand-green/40"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="admin-password" className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Password
              </label>
              <div className="relative">
                <input id="admin-password"
                  className="w-full rounded-2xl border border-outline-variant/40 bg-white/80 px-4 py-3 pr-12 text-sm outline-none transition-colors hover:border-outline/50 focus:border-brand-green/40"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-outline-variant/40 bg-white/70 text-coffee-dark transition hover:bg-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full justify-center" disabled={loading}>
                {loading ? "Signing in…" : "Login"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminLoginPage() {
  if (!hasConvex()) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-b from-cream to-surface p-8">
        <ConvexSetupNotice context="Admin login" />
      </div>
    );
  }

  return <AdminLoginForm />;
}
