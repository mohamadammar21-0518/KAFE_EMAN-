import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Eye, Plus, Star, Trash2, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AdminCreateTestimonialModal } from "@/admin/components/AdminCreateTestimonialModal";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { AdminModal } from "@/admin/components/AdminModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatDateTime } from "@/admin/lib/format";
import { cn } from "@/lib/utils";

type TabId = "client" | "staff";
type TestimonialRow = Doc<"testimonials"> & { source: "client" | "staff" };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "fill-amber-400 text-amber-400" : "text-outline/40",
          )}
        />
      ))}
    </div>
  );
}

function TestimonialGrid({
  rows,
  onView,
  onAccept,
  onReject,
  onDelete,
  emptyMessage,
}: {
  rows: TestimonialRow[];
  onView: (row: TestimonialRow) => void;
  onAccept: (row: TestimonialRow) => void;
  onReject: (row: TestimonialRow) => void;
  onDelete: (row: TestimonialRow) => void;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((row) => (
        <article
          key={row._id}
          className="flex flex-col overflow-hidden rounded-2xl border border-outline/40 bg-white/70 shadow-card transition-shadow hover:shadow-soft"
        >
          <div className="relative h-36 w-full bg-cream">
            <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <Stars rating={row.rating} />
              <StatusBadge label={row.status} variant="order" />
            </div>
            <h2 className="mt-2 font-semibold text-coffee-dark">{row.authorName}</h2>
            <p className="text-xs text-muted">{row.subtitle ?? row.targetLabel ?? "Guest"}</p>
            <p className="mt-3 line-clamp-3 text-sm text-muted">{row.text}</p>
            <p className="mt-3 text-xs text-muted">{formatDateTime(row.createdAt)}</p>
            {row.status === "rejected" && row.rejectReason ? (
              <p className="mt-2 line-clamp-2 text-xs text-red-600">
                Rejected: {row.rejectReason}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-1 border-t border-outline/30 pt-4">
              <button
                type="button"
                onClick={() => onView(row)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-outline/40 text-sm hover:bg-cream"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
              {row.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => onAccept(row)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
                    title="Accept and publish"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(row)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50"
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onDelete(row)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                title="Delete testimonial"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminTestimonialsPage() {
  const adminToken = useAdminToken();
  const testimonials = useQuery(
    api.testimonials.listForAdmin,
    adminToken ? { adminToken } : "skip",
  );
  const acceptTestimonial = useMutation(api.testimonials.accept);
  const rejectTestimonial = useMutation(api.testimonials.reject);
  const removeTestimonial = useMutation(api.testimonials.remove);

  const [tab, setTab] = useState<TabId>("client");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewRow, setViewRow] = useState<TestimonialRow | null>(null);
  const [acceptRow, setAcceptRow] = useState<TestimonialRow | null>(null);
  const [rejectRow, setRejectRow] = useState<TestimonialRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<TestimonialRow | null>(null);
  const [acceptChecked, setAcceptChecked] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectChecked, setRejectChecked] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [rejectBusy, setRejectBusy] = useState(false);

  const clientRows = useMemo(
    () => (testimonials ?? []).filter((r) => r.source === "client"),
    [testimonials],
  );
  const staffRows = useMemo(
    () => (testimonials ?? []).filter((r) => r.source === "staff"),
    [testimonials],
  );
  const activeRows = tab === "client" ? clientRows : staffRows;
  const pendingClient = clientRows.filter((r) => r.status === "pending").length;
  const pendingStaff = staffRows.filter((r) => r.status === "pending").length;

  const viewOpen = viewRow !== null;

  async function handleAccept() {
    if (!adminToken || !acceptRow || !acceptChecked) {
      setAcceptError("Please confirm before publishing.");
      return;
    }
    setAcceptBusy(true);
    setAcceptError(null);
    try {
      await acceptTestimonial({ adminToken, testimonialId: acceptRow._id });
      if (viewRow?._id === acceptRow._id) setViewRow(null);
      setAcceptRow(null);
      setAcceptChecked(false);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Could not accept.");
    } finally {
      setAcceptBusy(false);
    }
  }

  async function handleReject() {
    if (!adminToken || !rejectRow) return;
    if (!rejectChecked) {
      setRejectError("Please confirm that you want to reject this testimonial.");
      return;
    }
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setRejectError("Please provide a rejection reason (at least 3 characters).");
      return;
    }
    setRejectBusy(true);
    setRejectError(null);
    try {
      await rejectTestimonial({
        adminToken,
        testimonialId: rejectRow._id,
        reason,
      });
      if (viewRow?._id === rejectRow._id) setViewRow(null);
      setRejectRow(null);
      setRejectReason("");
      setRejectChecked(false);
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : "Could not reject.");
    } finally {
      setRejectBusy(false);
    }
  }

  const deleteWarning =
    deleteRow?.status === "accepted"
      ? "This testimonial is live on the home page and will be removed immediately for all visitors."
      : deleteRow?.status === "pending"
        ? "This pending testimonial will be permanently removed."
        : "This rejected testimonial will be permanently removed from your records.";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "space-y-6 transition-[filter,opacity] duration-200",
          viewOpen && "pointer-events-none blur-[2px] opacity-90",
        )}
        aria-hidden={viewOpen}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-headline-lg text-coffee-dark">Testimonials</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              <strong>From clients</strong> — feedback submitted by signed-in guests (always
              pending first). <strong>Actual</strong> — testimonials you add as staff; also pending
              until you accept. Accepted entries appear on the home page carousel.
            </p>
          </div>
          {tab === "staff" && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-coffee-dark px-5 py-2.5 text-sm font-medium text-white hover:bg-coffee-dark/90"
            >
              <Plus className="h-4 w-4" />
              Add testimonial
            </button>
          )}
        </div>

        <div
          className="flex flex-wrap gap-2 border-b border-outline/30 pb-1"
          role="tablist"
          aria-label="Testimonial categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "client"}
            onClick={() => setTab("client")}
            className={cn(
              "rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "client"
                ? "border-b-2 border-coffee-dark text-coffee-dark"
                : "text-muted hover:text-on-surface",
            )}
          >
            From clients
            {pendingClient > 0 ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                {pendingClient} pending
              </span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "staff"}
            onClick={() => setTab("staff")}
            className={cn(
              "rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "staff"
                ? "border-b-2 border-coffee-dark text-coffee-dark"
                : "text-muted hover:text-on-surface",
            )}
          >
            Actual
            {pendingStaff > 0 ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                {pendingStaff} pending
              </span>
            ) : null}
          </button>
        </div>

        {!testimonials ? (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            Loading testimonials…
          </p>
        ) : (
          <TestimonialGrid
            rows={activeRows}
            emptyMessage={
              tab === "client"
                ? "No client feedback yet."
                : "No staff testimonials yet. Use Add testimonial to create one."
            }
            onView={setViewRow}
            onAccept={(row) => {
              setAcceptRow(row);
              setAcceptChecked(false);
              setAcceptError(null);
            }}
            onReject={(row) => {
              setRejectRow(row);
              setRejectReason("");
              setRejectChecked(false);
              setRejectError(null);
            }}
            onDelete={setDeleteRow}
          />
        )}
      </div>

      <AdminCreateTestimonialModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <AdminDeleteConfirmModal
        open={deleteRow !== null}
        onClose={() => setDeleteRow(null)}
        itemName={deleteRow ? `${deleteRow.authorName} (${deleteRow.source === "client" ? "client" : "actual"})` : ""}
        entityLabel="testimonial"
        warning={deleteWarning}
        confirmMode="checkbox"
        onConfirm={async () => {
          if (!adminToken || !deleteRow) return;
          await removeTestimonial({
            adminToken,
            testimonialId: deleteRow._id,
          });
          if (viewRow?._id === deleteRow._id) setViewRow(null);
        }}
      />

      <AdminModal
        open={acceptRow !== null}
        onClose={() => {
          setAcceptRow(null);
          setAcceptChecked(false);
          setAcceptError(null);
        }}
        title="Publish testimonial?"
        subtitle="This will appear on the website for all visitors."
        softBackdrop
      >
        {acceptRow && (
          <div className="space-y-4 text-sm">
            <p className="text-on-surface">
              Are you sure you want to publish the testimonial from{" "}
              <strong>{acceptRow.authorName}</strong>
              {acceptRow.source === "client" ? " (submitted by a client)" : " (added by staff)"}?
              It will appear in the guest testimonial section on the home page.
            </p>
            <blockquote className="rounded-lg border border-outline/30 bg-cream/50 p-4 text-on-surface">
              {acceptRow.text}
            </blockquote>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptChecked}
                onChange={(e) => setAcceptChecked(e.target.checked)}
                className="mt-1"
              />
              <span>I understand this testimonial will be visible to all website visitors.</span>
            </label>
            {acceptError && <p className="text-red-600">{acceptError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={acceptBusy || !acceptChecked}
                onClick={() => void handleAccept()}
                className="rounded-full bg-coffee-dark px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {acceptBusy ? "Publishing…" : "Accept & publish"}
              </button>
              <button
                type="button"
                onClick={() => setAcceptRow(null)}
                className="rounded-full border border-outline/40 px-6 py-2.5 text-sm hover:bg-cream"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={rejectRow !== null}
        onClose={() => {
          setRejectRow(null);
          setRejectReason("");
          setRejectChecked(false);
          setRejectError(null);
        }}
        title="Reject testimonial?"
        subtitle="It will not appear on the website."
        softBackdrop
      >
        {rejectRow && (
          <div className="space-y-4 text-sm">
            <p className="text-on-surface">
              Are you sure you want to reject feedback from <strong>{rejectRow.authorName}</strong>?
              Please add a reason for your records.
            </p>
            <AdminFormField label="Rejection reason *">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className={cn(adminInputClass, "min-h-[5rem] resize-y")}
                rows={3}
                placeholder="e.g. Does not meet our content guidelines…"
                required
                minLength={3}
              />
            </AdminFormField>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={rejectChecked}
                onChange={(e) => setRejectChecked(e.target.checked)}
                className="mt-1"
              />
              <span>Yes, I want to reject this testimonial.</span>
            </label>
            {rejectError && <p className="text-red-600">{rejectError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={rejectBusy || !rejectChecked || rejectReason.trim().length < 3}
                onClick={() => void handleReject()}
                className="rounded-full bg-amber-800 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {rejectBusy ? "Rejecting…" : "Reject testimonial"}
              </button>
              <button
                type="button"
                onClick={() => setRejectRow(null)}
                className="rounded-full border border-outline/40 px-6 py-2.5 text-sm hover:bg-cream"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={viewRow !== null}
        onClose={() => setViewRow(null)}
        title={viewRow?.authorName ?? "Testimonial"}
        subtitle={
          viewRow
            ? `${viewRow.source === "client" ? "From client" : "Actual"} · ${formatDateTime(viewRow.createdAt)}`
            : undefined
        }
        softBackdrop
      >
        {viewRow && (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted">Category</dt>
              <dd className="mt-1 text-on-surface">
                {viewRow.source === "client" ? "From clients" : "Actual (staff)"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1">
                <StatusBadge label={viewRow.status} variant="order" />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Rating</dt>
              <dd className="mt-1">
                <Stars rating={viewRow.rating} />
              </dd>
            </div>
            {viewRow.subtitle && (
              <div>
                <dt className="text-muted">Title</dt>
                <dd className="mt-1 text-on-surface">{viewRow.subtitle}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Feedback</dt>
              <dd className="mt-1 whitespace-pre-wrap text-on-surface">{viewRow.text}</dd>
            </div>
            {viewRow.rejectReason && (
              <div>
                <dt className="text-muted">Rejection reason</dt>
                <dd className="mt-1 text-red-700">{viewRow.rejectReason}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Image</dt>
              <dd className="mt-2">
                <img src={viewRow.imageUrl} alt="" className="max-h-48 rounded-xl object-cover" />
              </dd>
            </div>
            {viewRow.status === "pending" && (
              <dd className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAcceptRow(viewRow);
                    setAcceptChecked(false);
                    setViewRow(null);
                  }}
                  className="rounded-full bg-coffee-dark px-4 py-2 text-sm text-white hover:bg-coffee-dark/90"
                >
                  Accept & publish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectRow(viewRow);
                    setRejectReason("");
                    setRejectChecked(false);
                    setViewRow(null);
                  }}
                  className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100"
                >
                  Reject…
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteRow(viewRow)}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </dd>
            )}
            {viewRow.status !== "pending" && (
              <dd className="pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteRow(viewRow)}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete testimonial
                </button>
              </dd>
            )}
          </dl>
        )}
      </AdminModal>
    </div>
  );
}
