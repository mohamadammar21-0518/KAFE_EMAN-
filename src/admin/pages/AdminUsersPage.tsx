import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Ban, Eye, Trash2, User } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { AdminUserSuspendModal } from "@/admin/components/AdminUserSuspendModal";
import { UserDetailModal } from "@/admin/components/UserDetailModal";
import { useAdminBranchOptions } from "@/admin/hooks/useAdminBranchOptions";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatShortId, useFormatBranchLabel } from "@/admin/lib/format";
import { formatSuspensionEnd, isSuspendedNow } from "@/lib/userAccess";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { cn } from "@/lib/utils";

type BranchFilter = "all" | "__none__" | string;

export function AdminUsersPage() {
  const adminToken = useAdminToken();
  const { canDelete } = useAdminPermissions();
  const branchOptions = useAdminBranchOptions();
  const formatBranch = useFormatBranchLabel();
  const deleteCustomer = useMutation(api.admins.deleteCustomer);

  const [branchFilter, setBranchFilter] = useState<BranchFilter>("all");
  const [viewUserId, setViewUserId] = useState<Id<"users"> | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<Id<"users"> | null>(null);
  const [suspendUserName, setSuspendUserName] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<Id<"users"> | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");

  const customers = useQuery(
    api.admins.listCustomers,
    adminToken
      ? {
          adminToken,
          branchSlug: branchFilter === "all" ? undefined : branchFilter,
        }
      : "skip",
  );

  const viewOpen = viewUserId !== null;

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "space-y-6 transition-[filter,opacity] duration-200",
          viewOpen && "pointer-events-none blur-[2px] opacity-90",
        )}
        aria-hidden={viewOpen}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-headline-lg text-coffee-dark">Clients</h1>
            <p className="mt-1 text-sm text-muted">
              Customers who sign in on the website — not staff admin accounts. Suspend, view, or
              remove accounts from here.
            </p>
          </div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as BranchFilter)}
            className="rounded-xl border border-outline/40 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            aria-label="Filter by branch"
          >
            <option value="all">All branches</option>
            <option value="__none__">No branch assigned</option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {customers === undefined && (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            Loading customers…
          </p>
        )}

        {customers && customers.length === 0 && (
          <div className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-sm text-muted shadow-card space-y-2">
            <p>No customers match this filter yet.</p>
            <p>
              A profile is created when someone signs in on the storefront with Clerk. Ask them to
              sign in once, then refresh this page.
            </p>
          </div>
        )}

        {customers && customers.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customers.map((user) => {
              const name =
                [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
              const suspended = isSuspendedNow(user);
              return (
                <article
                  key={user._id}
                  className="flex flex-col rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card transition-shadow hover:shadow-soft"
                >
                  <div className="min-h-0 flex-1">
                    <div className="flex items-start gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream text-muted">
                          <User className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 font-semibold text-coffee-dark">{name}</h2>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                    <p className="mt-3 font-mono text-[0.65rem] text-muted" title={user._id}>
                      {formatShortId(user._id)}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {user.branchSlug ? formatBranch(user.branchSlug) : "No home branch"}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {user.points} pts · {user.totalOrders} orders
                    </p>
                    <p className="mt-2 text-xs">
                      {!user.active ? (
                        <span className="font-medium text-red-600">Deactivated</span>
                      ) : suspended ? (
                        <span className="font-medium text-amber-700">
                          Suspended until {formatSuspensionEnd(user.suspendedUntil!)}
                        </span>
                      ) : (
                        <span className="font-medium text-brand-green">Active</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-1 border-t border-outline/30 pt-4">
                    <button
                      type="button"
                      onClick={() => setViewUserId(user._id)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline/40 text-sm hover:bg-cream"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuspendUserId(user._id);
                        setSuspendUserName(name === "—" ? user.email : name);
                      }}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                      title="Suspend"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteUserId(user._id);
                          setDeleteUserName(name === "—" ? user.email : name);
                        }}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <AdminDeleteConfirmModal
        open={deleteUserId !== null}
        onClose={() => {
          setDeleteUserId(null);
          setDeleteUserName("");
        }}
        itemName={deleteUserName}
        entityLabel="user"
        confirmMode="checkbox"
        warning="Their Clerk login will no longer link to this profile."
        onConfirm={async () => {
          if (!adminToken || !deleteUserId) return;
          await deleteCustomer({ adminToken, userId: deleteUserId });
          if (viewUserId === deleteUserId) setViewUserId(null);
        }}
      />

      <AdminUserSuspendModal
        userId={suspendUserId}
        userName={suspendUserName}
        onClose={() => {
          setSuspendUserId(null);
          setSuspendUserName("");
        }}
      />

      <UserDetailModal userId={viewUserId} onClose={() => setViewUserId(null)} />
    </div>
  );
}
