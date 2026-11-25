import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { getAdminSession, setAdminSession } from "@/admin/auth";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatDateTime } from "@/admin/lib/format";
import { cn } from "@/lib/utils";

export function AdminAccountPage() {
  const adminToken = useAdminToken();
  const { role, isSuperAdmin, canManageStaff } = useAdminPermissions();
  const account = useQuery(api.admins.getMyAccount, adminToken ? { adminToken } : "skip");
  const updateAccount = useMutation(api.admins.updateMyAccount);
  const changePassword = useMutation(api.admins.changeMyPassword);
  const { busy: profileBusy, run: runProfile, isLocked: profileLocked } = useSubmitGuard();
  const { busy: passwordBusy, run: runPassword, isLocked: passwordLocked } = useSubmitGuard();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    setDisplayName(account.displayName);
    setEmail(account.email);
  }, [account]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || profileLocked()) return;
    setProfileError(null);
    setProfileSaved(false);
    try {
      const ok = await runProfile(async () => {
        await updateAccount({ adminToken, displayName, email });
        const session = getAdminSession();
        if (session) {
          setAdminSession({ ...session, name: displayName.trim() });
        }
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2000);
      });
      if (!ok) return;
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save profile.");
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || passwordLocked()) return;
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    try {
      const ok = await runPassword(async () => {
        await changePassword({ adminToken, currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 2000);
      });
      if (!ok) return;
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change password.");
    }
  }

  if (!account) {
    return (
      <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
        Loading your account…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg text-coffee-dark">My account</h1>
        <p className="mt-1 text-sm text-muted">
          Update your name, email, and password. You cannot delete your own account — use this page
          to manage your details.
        </p>
      </div>

      <div className="rounded-2xl border border-outline/40 bg-white/70 p-6 shadow-card md:p-8">
        <div className="flex flex-wrap items-center gap-3 border-b border-outline/30 pb-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
            {displayName.trim().charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-semibold text-coffee-dark">{account.displayName}</p>
            <p className="text-sm text-muted">@{account.username}</p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                isSuperAdmin
                  ? "border-violet-200 bg-violet-50 text-violet-800"
                  : "border-blue-200 bg-blue-50 text-blue-800",
              )}
            >
              {isSuperAdmin ? "Super admin" : "Staff"}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="mt-6 space-y-6" aria-busy={profileBusy}>
          <h2 className="text-sm font-semibold text-coffee-dark">Basic information</h2>
          {profileError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminFormField label="Full name *">
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={adminInputClass}
              />
            </AdminFormField>
            <AdminFormField label="Work email *">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={adminInputClass}
              />
            </AdminFormField>
            <AdminFormField label="Username">
              <input
                value={account.username}
                readOnly
                disabled
                className={cn(adminInputClass, "cursor-not-allowed bg-cream/50 text-muted")}
              />
            </AdminFormField>
            <AdminFormField label="Role">
              <input
                value={role === "superadmin" ? "Super admin" : "Staff"}
                readOnly
                disabled
                className={cn(adminInputClass, "cursor-not-allowed bg-cream/50 text-muted")}
              />
            </AdminFormField>
          </div>
          <p className="text-xs text-muted">
            Member since {formatDateTime(account.createdAt)} · Last updated{" "}
            {formatDateTime(account.updatedAt)}
          </p>
          <button
            type="submit"
            disabled={profileBusy}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {profileBusy ? "Saving…" : profileSaved ? "Saved" : "Save profile"}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSave}
          className="mt-10 space-y-4 border-t border-outline/30 pt-8"
          aria-busy={passwordBusy}
        >
          <h2 className="text-sm font-semibold text-coffee-dark">Change password</h2>
          {passwordError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminFormField label="Current password *" className="sm:col-span-2">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={adminInputClass}
              />
            </AdminFormField>
            <AdminFormField label="New password *">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={adminInputClass}
              />
            </AdminFormField>
            <AdminFormField label="Confirm new password *">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={adminInputClass}
              />
            </AdminFormField>
          </div>
          <p className="text-xs text-muted">Use at least 8 characters.</p>
          <button
            type="submit"
            disabled={passwordBusy}
            className="rounded-full border border-outline/40 bg-white px-6 py-2.5 text-sm font-medium text-coffee-dark hover:bg-cream disabled:opacity-50"
          >
            {passwordBusy ? "Updating…" : passwordSaved ? "Password updated" : "Update password"}
          </button>
        </form>
      </div>

      {canManageStaff && (
        <p className="text-sm text-muted">
          To manage other team members, go to{" "}
          <Link to="/admin/staff" className="font-medium text-primary hover:underline">
            Staff
          </Link>
          .
        </p>
      )}
    </div>
  );
}
