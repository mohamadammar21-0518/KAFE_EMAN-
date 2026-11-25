import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CalendarClock, Eye, Trash2, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { ReservationDetailModal } from "@/admin/components/ReservationDetailModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import {
  reservationAdminTab,
  reservationMatchesTab,
  type ReservationAdminTab,
} from "@/lib/reservationStatusFlow";
import { cn } from "@/lib/utils";

const TABS: { id: ReservationAdminTab; label: string; description: string }[] = [
  {
    id: "in_progress",
    label: "In progress",
    description: "Pending and actively being handled",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    description: "Cancelled with a reason",
  },
  {
    id: "closed",
    label: "Closed deals",
    description: "Followed up and resolved",
  },
];

export function AdminReservationsPage() {
  const adminToken = useAdminToken();
  const { canDelete } = useAdminPermissions();
  const reservations = useQuery(
    api.reservations.list,
    adminToken ? { adminToken } : "skip",
  );
  const removeReservation = useMutation(api.reservations.remove);
  const [viewReservation, setViewReservation] = useState<Doc<"reservations"> | null>(null);
  const [deleteReservation, setDeleteReservation] = useState<Doc<"reservations"> | null>(null);
  const [tab, setTab] = useState<ReservationAdminTab>("in_progress");
  const formatBranch = useFormatBranchLabel();

  const viewOpen = viewReservation !== null;

  const counts = useMemo(() => {
    const base = { in_progress: 0, cancelled: 0, closed: 0 };
    if (!reservations) return base;
    for (const row of reservations) {
      base[reservationAdminTab(row.status)] += 1;
    }
    return base;
  }, [reservations]);

  const filtered = useMemo(() => {
    if (!reservations) return [];
    return reservations.filter((row) => reservationMatchesTab(row, tab));
  }, [reservations, tab]);

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "space-y-6 transition-[filter,opacity] duration-200",
          viewOpen && "pointer-events-none blur-[2px] opacity-90",
        )}
        aria-hidden={viewOpen}
      >
        <div>
          <h1 className="text-headline-lg text-coffee-dark">Reservations</h1>
          <p className="mt-1 text-sm text-muted">
            New requests start as pending. Move to in progress, then close the deal or cancel with
            a reason.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-primary/30 bg-primary text-white"
                  : "border-outline/40 bg-white/70 text-on-surface hover:bg-cream",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-xs",
                  tab === t.id ? "bg-white/20" : "bg-cream text-muted",
                )}
              >
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{TABS.find((t) => t.id === tab)?.description}</p>

        {reservations === undefined && (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            Loading reservations…
          </p>
        )}

        {reservations && reservations.length === 0 && (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            No reservations yet.
          </p>
        )}

        {reservations && reservations.length > 0 && filtered.length === 0 && (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            No reservations in this section.
          </p>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((row) => (
              <article
                key={row._id}
                className="flex flex-col rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card transition-shadow hover:shadow-soft"
              >
                <div className="min-h-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 font-semibold text-coffee-dark">{row.name}</h2>
                    <StatusBadge label={row.status} variant="reservation" />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{row.email}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-on-surface">
                    <CalendarClock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    {row.date} · {row.time}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {resolveBranchSlug(row)
                      ? formatBranch(resolveBranchSlug(row))
                      : "No branch"}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {row.guests} guest{row.guests === 1 ? "" : "s"} · Submitted{" "}
                    {formatDateTime(row.createdAt)}
                  </p>
                </div>
                <div className="mt-4 flex gap-1 border-t border-outline/30 pt-4">
                  <button
                    type="button"
                    onClick={() => setViewReservation(row)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline/40 text-sm hover:bg-cream"
                    title="View reservation"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteReservation(row)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete reservation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <AdminDeleteConfirmModal
        open={deleteReservation !== null}
        onClose={() => setDeleteReservation(null)}
        itemName={
          deleteReservation
            ? `${deleteReservation.name} · ${deleteReservation.date} ${deleteReservation.time}`
            : ""
        }
        entityLabel="reservation"
        confirmMode="checkbox"
        onConfirm={async () => {
          if (!adminToken || !deleteReservation) return;
          await removeReservation({
            adminToken,
            reservationId: deleteReservation._id,
          });
          if (viewReservation?._id === deleteReservation._id) {
            setViewReservation(null);
          }
        }}
      />

      <ReservationDetailModal
        reservation={viewReservation}
        onClose={() => setViewReservation(null)}
      />
    </div>
  );
}
