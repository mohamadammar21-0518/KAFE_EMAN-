import { useEffect, useState } from "react";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { buildDeleteConfirmPhrase } from "@/admin/lib/adminCrud";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";

export function AdminDeleteConfirmModal({
  open,
  onClose,
  itemName,
  entityLabel,
  warning,
  onConfirm,
  confirmMode = "phrase",
}: {
  open: boolean;
  onClose: () => void;
  itemName: string;
  entityLabel: string;
  warning?: string;
  onConfirm: () => Promise<void>;
  /** `checkbox` — check to confirm; `phrase` — type the generated sentence */
  confirmMode?: "phrase" | "checkbox";
}) {
  const phrase = buildDeleteConfirmPhrase(itemName);
  const [confirmText, setConfirmText] = useState("");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { busy, run } = useSubmitGuard();

  const canConfirm =
    confirmMode === "checkbox" ? checked : confirmText.trim() === phrase;

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setChecked(false);
      setError(null);
    }
  }, [open]);

  async function handleConfirm() {
    if (confirmMode === "phrase" && confirmText.trim() !== phrase) {
      setError(`Type exactly: ${phrase}`);
      return;
    }
    if (confirmMode === "checkbox" && !checked) {
      setError("Please check the box to confirm deletion.");
      return;
    }
    setError(null);
    try {
      const ok = await run(async () => {
        await onConfirm();
      });
      if (ok) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`Delete ${entityLabel}?`}
      subtitle="This cannot be undone"
    >
      <div className="space-y-4 text-sm">
        <p className="text-on-surface">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-coffee-dark">{itemName}</span>?
          {warning ? ` ${warning}` : null}
        </p>
        {confirmMode === "checkbox" ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/40 bg-cream/30 p-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                setChecked(e.target.checked);
                setError(null);
              }}
              className="mt-0.5"
            />
            <span className="text-on-surface">
              Yes, I am sure I want to permanently delete this {entityLabel}.
            </span>
          </label>
        ) : (
          <AdminFormField label="Type the sentence below to confirm">
            <p className="mb-2 rounded-lg bg-cream/60 px-3 py-2 font-mono text-xs text-coffee-dark">
              {phrase}
            </p>
            <input
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              placeholder={phrase}
              className={adminInputClass}
              autoComplete="off"
            />
          </AdminFormField>
        )}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2 text-sm text-muted hover:bg-cream disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || !canConfirm}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Deleting…" : `Yes, delete ${entityLabel}`}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
