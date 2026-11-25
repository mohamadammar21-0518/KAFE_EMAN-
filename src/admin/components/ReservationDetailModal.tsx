import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AdminModal } from "@/admin/components/AdminModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { formatDateTime, resolveBranchSlug, useFormatBranchLabel } from "@/admin/lib/format";
import { useAdminToken } from "@/admin/useAdminToken";
import {
  normalizeReservationStatus,
  RESERVATION_CLOSURE_OPTIONS,
  reservationClosureLabel,
  type ReservationClosureOutcome,
} from "@/lib/reservationStatusFlow";
import { cn } from "@/lib/utils";

export function ReservationDetailModal({
  reservation,
  onClose,
}: {
  reservation: Doc<"reservations"> | null;
  onClose: () => void;
}) {
  const adminToken = useAdminToken();
  const updateStatus = useMutation(api.reservations.updateStatus);
  const formatBranch = useFormatBranchLabel();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [closureOutcome, setClosureOutcome] = useState<ReservationClosureOutcome>("followed_up");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);

  const normalized = reservation ? normalizeReservationStatus(reservation.status) : null;

  async function applyUpdate(args: {
    status: "pending" | "progressing" | "cancelled" | "closed";
    statusReason?: string;
    closureOutcome?: ReservationClosureOutcome;
  }) {
    if (!adminToken || !reservation) return;
    setBusy(true);
    setError(null);
    try {
      await updateStatus({
        adminToken,
        reservationId: reservation._id,
        ...args,
      });
      setShowCancelForm(false);
      setShowCloseForm(false);
      setCancelReason("");
      setCloseNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update reservation.");
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    setShowCancelForm(false);
    setShowCloseForm(false);
    setError(null);
    onClose();
  }

  return (
    <AdminModal
      open={reservation !== null}
      onClose={handleClose}
      title={reservation?.name ?? "Reservation"}
      subtitle={reservation ? formatDateTime(reservation.createdAt) : undefined}
      wide
      softBackdrop
    >
      {reservation && (
        <div className="space-y-6">
          <StatusBadge label={reservation.status} variant="reservation" />

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4">
              <dt className="text-xs text-muted">Guest</dt>
              <dd className="mt-1 font-semibold text-coffee-dark">{reservation.name}</dd>
            </div>
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4">
              <dt className="text-xs text-muted">Guests</dt>
              <dd className="mt-1 font-semibold text-coffee-dark">{reservation.guests}</dd>
            </div>
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4 sm:col-span-2">
              <dt className="text-xs text-muted">Contact</dt>
              <dd className="mt-1 text-sm">
                {reservation.email}
                <br />
                {reservation.phone}
              </dd>
            </div>
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4">
              <dt className="text-xs text-muted">Branch</dt>
              <dd className="mt-1 text-sm">
                {resolveBranchSlug(reservation)
                  ? formatBranch(resolveBranchSlug(reservation))
                  : "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-outline/40 bg-cream/30 p-4">
              <dt className="text-xs text-muted">Date & time</dt>
              <dd className="mt-1 text-sm">
                {reservation.date} · {reservation.time}
              </dd>
            </div>
          </dl>

          {reservation.notes && (
            <div className="rounded-xl border border-outline/40 bg-white p-4 text-sm">
              <p className="text-xs font-medium text-muted">Guest notes</p>
              <p className="mt-2">{reservation.notes}</p>
            </div>
          )}

          {reservation.statusReason && (
            <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 text-sm">
              <p className="text-xs font-medium text-red-800">Cancellation reason</p>
              <p className="mt-2 text-red-900">{reservation.statusReason}</p>
            </div>
          )}

          {reservation.closureOutcome && (
            <div className="rounded-xl border border-brand-green/25 bg-brand-green/8 p-4 text-sm">
              <p className="text-xs font-medium text-brand-green">Closed as</p>
              <p className="mt-2 font-medium text-coffee-dark">
                {reservationClosureLabel(reservation.closureOutcome)}
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {normalized === "pending" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-coffee-dark">Update status</p>
              {!showCancelForm ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void applyUpdate({ status: "progressing" })}
                    className="rounded-full border border-primary/30 bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Mark as in progress
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowCancelForm(true)}
                    className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                  >
                    Cancel reservation
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-outline/40 bg-cream/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-coffee-dark">Reason for cancellation *</p>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full resize-none rounded-xl border border-outline/40 bg-white px-3 py-2 text-sm"
                    placeholder="e.g. Fully booked, invalid contact…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void applyUpdate({ status: "cancelled", statusReason: cancelReason })
                      }
                      className="rounded-full border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Confirm cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelForm(false)}
                      className="rounded-full px-4 py-2 text-sm text-muted hover:bg-cream"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {normalized === "progressing" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-coffee-dark">Update status</p>
              {!showCancelForm && !showCloseForm && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setShowCloseForm(true);
                      setShowCancelForm(false);
                    }}
                    className="rounded-full border border-primary/30 bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Close deal
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setShowCancelForm(true);
                      setShowCloseForm(false);
                    }}
                    className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                  >
                    Cancel reservation
                  </button>
                </div>
              )}

              {showCancelForm && (
                <div className="rounded-xl border border-outline/40 bg-cream/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-coffee-dark">Reason for cancellation *</p>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full resize-none rounded-xl border border-outline/40 bg-white px-3 py-2 text-sm"
                    placeholder="e.g. Guest requested another date, fully booked…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void applyUpdate({ status: "cancelled", statusReason: cancelReason })
                      }
                      className="rounded-full border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Confirm cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelForm(false)}
                      className="rounded-full px-4 py-2 text-sm text-muted hover:bg-cream"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {showCloseForm && (
                <div className="rounded-xl border border-outline/40 bg-cream/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-coffee-dark">How was this resolved? *</p>
                  <div className="flex flex-wrap gap-2">
                    {RESERVATION_CLOSURE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setClosureOutcome(opt.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          closureOutcome === opt.value
                            ? "border-brand-green/30 bg-brand-green text-white"
                            : "border-outline/40 bg-white hover:bg-cream",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <label className="block text-sm text-muted">
                    Note (optional)
                    <textarea
                      rows={2}
                      value={closeNote}
                      onChange={(e) => setCloseNote(e.target.value)}
                      className="mt-1 w-full resize-none rounded-xl border border-outline/40 bg-white px-3 py-2 text-sm"
                      placeholder="e.g. Called guest, table confirmed for Friday…"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void applyUpdate({
                          status: "closed",
                          closureOutcome,
                          statusReason: closeNote || undefined,
                        })
                      }
                      className="rounded-full border border-primary/30 bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Mark closed
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCloseForm(false)}
                      className="rounded-full px-4 py-2 text-sm text-muted hover:bg-cream"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(normalized === "cancelled" || normalized === "closed") && (
            <p className="text-sm text-muted">
              This reservation is in the{" "}
              <span className="font-medium text-coffee-dark">
                {normalized === "closed" ? "closed" : "cancelled"}
              </span>{" "}
              list. No further status changes are available.
            </p>
          )}
        </div>
      )}
    </AdminModal>
  );
}
