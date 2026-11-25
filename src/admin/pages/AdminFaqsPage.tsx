import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { useAdminToken } from "@/admin/useAdminToken";
import { cn } from "@/lib/utils";

export function AdminFaqsPage() {
  const adminToken = useAdminToken();
  const { canDelete } = useAdminPermissions();
  const faqs = useQuery(api.faqsAdmin.listAll, adminToken ? { adminToken } : "skip");
  const createFaq = useMutation(api.faqsAdmin.create);
  const updateFaq = useMutation(api.faqsAdmin.update);
  const removeFaq = useMutation(api.faqsAdmin.remove);
  const { busy, run: runSave, isLocked: saveLocked } = useSubmitGuard();

  const [modal, setModal] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Doc<"faqs"> | null>(null);
  const [editId, setEditId] = useState<Id<"faqs"> | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteFaq, setDeleteFaq] = useState<Doc<"faqs"> | null>(null);

  const viewOpen = modal === "view";

  function closeModal() {
    setModal(null);
    setSelected(null);
    setEditId(null);
    setError(null);
  }

  function openAdd() {
    setQuestion("");
    setAnswer("");
    setSortOrder(faqs?.length ?? 0);
    setActive(true);
    setEditId(null);
    setSelected(null);
    setError(null);
    setModal("add");
  }

  function openView(faq: Doc<"faqs">) {
    setSelected(faq);
    setError(null);
    setModal("view");
  }

  function openEdit(faq: Doc<"faqs">) {
    setEditId(faq._id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setSortOrder(faq.sortOrder);
    setActive(faq.active !== false);
    setSelected(null);
    setError(null);
    setModal("edit");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || saveLocked()) return;
    setError(null);
    try {
      const ok = await runSave(async () => {
        if (modal === "add") {
          await createFaq({ adminToken, question, answer, sortOrder, active });
        } else if (modal === "edit" && editId) {
          await updateFaq({ adminToken, id: editId, question, answer, sortOrder, active });
        }
        closeModal();
      });
      if (!ok) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save FAQ.");
    }
  }

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
            <h1 className="text-headline-lg text-coffee-dark">FAQ</h1>
            <p className="mt-1 text-sm text-muted">Add, edit, or remove questions shown on the website.</p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>

        {!faqs ? (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            Loading…
          </p>
        ) : faqs.length === 0 ? (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            No FAQs yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {faqs.map((faq) => (
              <article
                key={faq._id}
                className="flex flex-col rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card transition-shadow hover:shadow-soft"
              >
                <div className="min-h-0 flex-1">
                  <h2 className="line-clamp-3 font-semibold text-coffee-dark">{faq.question}</h2>
                  <p className="mt-2 line-clamp-4 text-sm text-muted">{faq.answer}</p>
                  <p className="mt-3 text-xs text-muted">
                    Order {faq.sortOrder}
                    {faq.active === false && " · Hidden"}
                  </p>
                </div>
                <div className="mt-4 flex gap-1 border-t border-outline/30 pt-4">
                  <button
                    type="button"
                    onClick={() => openView(faq)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline/40 text-sm hover:bg-cream"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(faq)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline/40 hover:bg-cream"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteFaq(faq)}
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
        open={deleteFaq !== null}
        onClose={() => setDeleteFaq(null)}
        itemName={deleteFaq?.question ?? ""}
        entityLabel="FAQ"
        onConfirm={async () => {
          if (!adminToken || !deleteFaq) return;
          await removeFaq({ adminToken, id: deleteFaq._id });
        }}
      />

      <AdminModal
        open={modal === "view"}
        onClose={closeModal}
        title={selected?.question ?? "FAQ"}
        subtitle="Question & answer"
        softBackdrop
      >
        {selected && (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted">Question</dt>
              <dd className="mt-1 font-medium text-on-surface">{selected.question}</dd>
            </div>
            <div>
              <dt className="text-muted">Answer</dt>
              <dd className="mt-1 whitespace-pre-wrap text-on-surface">{selected.answer}</dd>
            </div>
            <div>
              <dt className="text-muted">Display order</dt>
              <dd className="mt-1 text-on-surface">{selected.sortOrder}</dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1 text-on-surface">
                {selected.active === false ? "Hidden on website" : "Visible on website"}
              </dd>
            </div>
          </dl>
        )}
      </AdminModal>

      <AdminModal
        open={modal === "add" || modal === "edit"}
        onClose={closeModal}
        title={modal === "add" ? "Add FAQ" : "Edit FAQ"}
        subtitle={modal === "edit" ? "Update question or answer" : undefined}
        wide
      >
        <form
          key={modal === "edit" && editId ? `edit-${editId}` : "add"}
          onSubmit={handleSave}
          className="space-y-4"
          aria-busy={busy}
        >
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <AdminFormField label="Question *">
            <input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Answer *">
            <textarea
              required
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Sort order">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className={adminInputClass}
            />
          </AdminFormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Show on website
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full px-4 py-2 text-sm text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
