import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Clock, Eye, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import {
  BranchHoursEditor,
  hoursRulesFromForm,
} from "@/admin/components/BranchHoursEditor";
import {
  newHoursRule,
  parseHoursLines,
  validateHoursRules,
  type HoursRule,
} from "@/admin/lib/branchHours";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { useAdminToken } from "@/admin/useAdminToken";
import {
  DEFAULT_CURRENCY,
  getCurrencyLabel,
  OTHER_CURRENCY_CODES,
  POPULAR_CURRENCIES,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

/** Matches storefront branch card: name, tagline, location, hours. */
type BranchForm = {
  name: string;
  tagline: string;
  address: string;
  currency: string;
  hoursRules: HoursRule[];
};

const emptyForm = (): BranchForm => ({
  name: "",
  tagline: "",
  address: "",
  currency: DEFAULT_CURRENCY,
  hoursRules: [
    newHoursRule({ dayFrom: "sunday", dayTo: "friday", openTime: "11:00", closeTime: "23:00" }),
    newHoursRule({
      type: "open",
      dayFrom: "saturday",
      dayTo: "saturday",
      openTime: "15:00",
      closeTime: "22:00",
    }),
  ],
});

function branchToForm(b: Doc<"branches">): BranchForm {
  const name =
    b.subtitle && !b.label.includes("·") ? `${b.label} · ${b.subtitle}` : b.label;
  return {
    name,
    tagline: b.concept ?? "",
    address: b.address,
    currency: b.currency ?? DEFAULT_CURRENCY,
    hoursRules: parseHoursLines(b.hours),
  };
}

function formToPayload(
  form: BranchForm,
  sortOrder: number,
  active = true,
) {
  return {
    label: form.name.trim(),
    concept: form.tagline.trim() || undefined,
    address: form.address.trim(),
    hours: hoursRulesFromForm(form.hoursRules),
    currency: form.currency,
    active,
    sortOrder,
  };
}

export function AdminBranchesPage() {
  const adminToken = useAdminToken();
  const { canDelete } = useAdminPermissions();
  const branches = useQuery(api.branches.listAll, adminToken ? { adminToken } : "skip");
  const ensureDefaults = useMutation(api.branches.ensureDefaults);
  const createBranch = useMutation(api.branches.create);
  const updateBranch = useMutation(api.branches.update);
  const removeBranch = useMutation(api.branches.remove);

  const [modal, setModal] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Doc<"branches"> | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const { busy, run: runSave, isLocked: saveLocked } = useSubmitGuard();
  const [deleteBranch, setDeleteBranch] = useState<Doc<"branches"> | null>(null);

  useEffect(() => {
    if (!adminToken || branches === undefined) return;
    if (branches.length === 0) {
      void ensureDefaults({ adminToken });
    }
  }, [adminToken, branches, ensureDefaults]);

  function closeModal() {
    setModal(null);
    setSelected(null);
    setError(null);
  }

  function openAdd() {
    setSelected(null);
    setForm(emptyForm());
    setError(null);
    setModal("add");
  }

  function openView(b: Doc<"branches">) {
    setSelected(b);
    setError(null);
    setModal("view");
  }

  function openEdit(b: Doc<"branches">) {
    setSelected(b);
    setForm(branchToForm(b));
    setError(null);
    setModal("edit");
  }

  function displayName(b: Doc<"branches">) {
    if (b.subtitle && !b.label.includes("·")) return `${b.label} · ${b.subtitle}`;
    return b.label;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || saveLocked()) return;

    const hoursError = validateHoursRules(form.hoursRules);
    if (hoursError) {
      setError(hoursError);
      return;
    }

    setError(null);
    try {
      const ok = await runSave(async () => {
        const sortOrder = branches?.length ?? 0;
        if (modal === "add") {
          await createBranch({
            adminToken,
            ...formToPayload(form, sortOrder, true),
          });
        } else if (modal === "edit" && selected) {
          await updateBranch({
            adminToken,
            id: selected._id,
            ...formToPayload(form, selected.sortOrder, selected.active),
          });
        }
        closeModal();
      });
      if (!ok) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save branch.");
    }
  }

  function openDeleteConfirm(b: Doc<"branches">) {
    setDeleteBranch(b);
  }

  const viewOpen = modal === "view";

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
          <h1 className="text-headline-lg text-coffee-dark">Branches</h1>
          <p className="mt-1 text-sm text-muted">
            Add each location with branch name, tagline, address, and opening hours.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Add branch
        </button>
      </div>

      {!branches ? (
        <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
          Loading branches…
        </p>
      ) : branches.length === 0 ? (
        <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
          No branches yet. Click &quot;Add branch&quot; to create your first location.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {branches.map((b) => (
            <article
              key={b._id}
              className="flex flex-col rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card transition-shadow hover:shadow-soft"
            >
              <div className="min-h-0 flex-1">
                <h2 className="line-clamp-2 font-semibold text-coffee-dark">{displayName(b)}</h2>
                {b.concept ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{b.concept}</p>
                ) : null}
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                  Currency
                </p>
                <p className="mt-0.5 text-sm text-on-surface">
                  {getCurrencyLabel(b.currency ?? DEFAULT_CURRENCY)}
                </p>
                <p className="mt-3 flex items-start gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Location
                </p>
                <p className="mt-0.5 line-clamp-3 text-sm text-muted">{b.address}</p>
                <p className="mt-3 flex items-start gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Hours
                </p>
                <p className="mt-0.5 text-sm text-muted">{b.hours[0]}</p>
                {b.hours.length > 1 ? (
                  <p className="text-xs text-muted">+{b.hours.length - 1} more</p>
                ) : null}
              </div>
              <div className="mt-4 flex gap-1 border-t border-outline/30 pt-4">
                <button
                  type="button"
                  onClick={() => openView(b)}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline/40 text-sm hover:bg-cream"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline/40 hover:bg-cream"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => openDeleteConfirm(b)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete"
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
        open={deleteBranch !== null}
        onClose={() => setDeleteBranch(null)}
        itemName={deleteBranch ? displayName(deleteBranch) : ""}
        entityLabel="branch"
        warning="All menu categories and products for this branch will be removed."
        onConfirm={async () => {
          if (!adminToken || !deleteBranch) return;
          await removeBranch({ adminToken, id: deleteBranch._id });
        }}
      />

      <AdminModal
        open={modal === "view"}
        onClose={closeModal}
        title={selected ? displayName(selected) : "Branch"}
        subtitle="Branch details"
        softBackdrop
      >
        {selected && (
          <dl className="space-y-4 text-sm">
            {selected.concept && (
              <div>
                <dt className="text-muted">About</dt>
                <dd className="mt-1 text-on-surface">{selected.concept}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Currency</dt>
              <dd className="mt-1 text-on-surface">
                {getCurrencyLabel(selected.currency ?? DEFAULT_CURRENCY)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="mt-1 text-on-surface">{selected.address}</dd>
            </div>
            <div>
              <dt className="text-muted">Hours</dt>
              <dd className="mt-1 space-y-1 text-on-surface">
                {selected.hours.map((h) => (
                  <p key={h}>{h}</p>
                ))}
              </dd>
            </div>
          </dl>
        )}
      </AdminModal>

      <AdminModal
        open={modal === "add" || modal === "edit"}
        onClose={closeModal}
        title={modal === "add" ? "Add branch" : "Edit branch"}
        subtitle={
          modal === "edit" && selected
            ? `Editing ${displayName(selected)}`
            : "Example: Alor Setar · Main · Barber Concept"
        }
        wide
      >
        <form
          key={modal === "edit" && selected ? `edit-${selected._id}` : "add"}
          onSubmit={handleSave}
          className="space-y-4"
          aria-busy={busy}
        >
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <AdminFormField label="Branch name *">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Alor Setar · Main · Barber Concept"
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Tagline (short description)">
            <input
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              placeholder="A unique 2-in-1 coffee shop and barbershop."
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Location & address *">
            <textarea
              required
              rows={3}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="22-A Bawah, Taman Koperasi, Jalan Tun Razak, Taman Mutiara, 05200 Alor Setar, Kedah."
              className={cn(adminInputClass, "resize-none")}
            />
          </AdminFormField>
          <AdminFormField label="Currency *">
            <select
              required
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className={adminInputClass}
            >
              <optgroup label="Popular">
                {POPULAR_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {getCurrencyLabel(code)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All currencies">
                {OTHER_CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {getCurrencyLabel(code)}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-muted">
              Menu prices, checkout, and finance for this branch use this currency.
            </p>
          </AdminFormField>

          <BranchHoursEditor
            rules={form.hoursRules}
            onChange={(hoursRules) => setForm((f) => ({ ...f, hoursRules }))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full px-4 py-2 text-sm text-muted hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              aria-disabled={busy}
              className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save branch"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
