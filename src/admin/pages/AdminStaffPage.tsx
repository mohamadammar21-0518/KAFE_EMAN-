import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { Mail, Plus, Shield, Trash2, UserCog } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatDateTime } from "@/admin/lib/format";
import { cn } from "@/lib/utils";

export function AdminStaffPage() {
  const adminToken = useAdminToken();
  const { canManageStaff } = useAdminPermissions();
  const staff = useQuery(api.admins.listStaff, adminToken ? { adminToken } : "skip");
  const createStaff = useMutation(api.admins.createStaff);
  const setStaffActive = useMutation(api.admins.setStaffActive);
  const removeStaff = useMutation(api.admins.removeStaff);
  const { busy, run: runSave, isLocked: saveLocked } = useSubmitGuard();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    displayName: string;
    email: string;
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"admins">; name: string } | null>(
    null,
  );

  function closeInviteModal() {
    setInviteOpen(false);
    setDisplayName("");
    setEmail("");
    setError(null);
    setInviteResult(null);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || saveLocked() || !canManageStaff) return;
    setError(null);
    try {
      const ok = await runSave(async () => {
        const result = await createStaff({ adminToken, displayName, email });
        setInviteResult({
          displayName: result.displayName,
          email: result.email,
          username: result.username,
          temporaryPassword: result.temporaryPassword,
        });
      });
      if (!ok) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add staff.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-coffee-dark">Staff</h1>
          <p className="mt-1 text-sm text-muted">
            People who can sign in to this admin panel. Clients who use the website are listed
            under Clients.
          </p>
        </div>
        {canManageStaff && (
          <button
            type="button"
            onClick={() => {
              setInviteOpen(true);
              setInviteResult(null);
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Add staff
          </button>
        )}
      </div>

      {!staff ? (
        <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
          Loading staff…
        </p>
      ) : staff.length === 0 ? (
        <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
          No staff accounts yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {staff.map((member) => (
            <article
              key={member._id}
              className="flex flex-col rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {member.role === "superadmin" ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <UserCog className="h-5 w-5" />
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {member.isSelf && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      You
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                      member.role === "superadmin"
                        ? "border-violet-200 bg-violet-50 text-violet-800"
                        : "border-blue-200 bg-blue-50 text-blue-800",
                      !member.active && "opacity-60",
                    )}
                  >
                    {member.role === "superadmin" ? "Super admin" : "Staff"}
                    {!member.active ? " · inactive" : ""}
                  </span>
                </div>
              </div>
              <h2 className="mt-3 font-semibold text-coffee-dark">{member.displayName}</h2>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {member.email || "No email"}
              </p>
              <p className="mt-1 text-xs text-muted">Username: {member.username}</p>
              <p className="mt-2 text-xs text-muted">Added {formatDateTime(member.createdAt)}</p>

              {member.isSelf ? (
                <div className="mt-4 border-t border-outline/30 pt-4">
                  <Link
                    to="/admin/account"
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-outline/40 text-sm font-medium hover:bg-cream"
                  >
                    Edit my account
                  </Link>
                </div>
              ) : (
                canManageStaff &&
                member.role === "staff" && (
                  <div className="mt-4 flex gap-1 border-t border-outline/30 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        void setStaffActive({
                          adminToken: adminToken!,
                          staffId: member._id,
                          active: !member.active,
                        })
                      }
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-outline/40 text-sm hover:bg-cream"
                    >
                      {member.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ id: member._id, name: member.displayName })
                      }
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Remove staff"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              )}
            </article>
          ))}
        </div>
      )}

      <AdminDeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ""}
        entityLabel="staff member"
        confirmMode="checkbox"
        onConfirm={async () => {
          if (!adminToken || !deleteTarget) return;
          await removeStaff({ adminToken, staffId: deleteTarget.id });
        }}
      />

      <AdminModal
        open={inviteOpen}
        onClose={closeInviteModal}
        title={inviteResult ? "Staff account created" : "Invite staff"}
        subtitle={
          inviteResult
            ? "Share these login details securely with your team member."
            : "They will sign in with username and password."
        }
      >
        {inviteResult ? (
          <div className="space-y-4 text-sm">
            <dl className="space-y-3 rounded-xl border border-outline/40 bg-cream/30 p-4">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="mt-1 font-medium text-on-surface">{inviteResult.displayName}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="mt-1 text-on-surface">{inviteResult.email}</dd>
              </div>
              <div>
                <dt className="text-muted">Username</dt>
                <dd className="mt-1 font-mono text-on-surface">{inviteResult.username}</dd>
              </div>
              <div>
                <dt className="text-muted">Temporary password</dt>
                <dd className="mt-1 font-mono font-semibold text-coffee-dark">
                  {inviteResult.temporaryPassword}
                </dd>
              </div>
            </dl>
            <p className="text-muted">
              Ask them to sign in at the admin login page and change their password when you add
              that feature. For now, keep this password private.
            </p>
            <button
              type="button"
              onClick={closeInviteModal}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4" aria-busy={busy}>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <AdminFormField label="Full name *">
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={adminInputClass}
                placeholder="e.g. Sarah Ahmad"
              />
            </AdminFormField>
            <AdminFormField label="Work email *">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={adminInputClass}
                placeholder="name@kafeeman.com"
              />
            </AdminFormField>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeInviteModal}
                className="rounded-full px-4 py-2 text-sm text-muted hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create staff account"}
              </button>
            </div>
          </form>
        )}
      </AdminModal>
    </div>
  );
}
