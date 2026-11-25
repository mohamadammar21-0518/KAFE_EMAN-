import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";
import { useAdminToken } from "@/admin/useAdminToken";
import { cn } from "@/lib/utils";

type Unit = "hours" | "days";

export function AdminUserSuspendModal({
  userId,
  userName,
  onClose,
}: {
  userId: Id<"users"> | null;
  userName: string;
  onClose: () => void;
}) {
  const adminToken = useAdminToken();
  const suspendCustomer = useMutation(api.admins.suspendCustomer);
  const { busy, run } = useSubmitGuard();

  const [duration, setDuration] = useState(24);
  const [unit, setUnit] = useState<Unit>("hours");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setDuration(24);
      setUnit("hours");
      setReason("");
      setError(null);
    }
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || !userId) return;
    setError(null);
    try {
      const ok = await run(async () => {
        await suspendCustomer({
          adminToken,
          userId,
          duration,
          unit,
          reason: reason.trim() || undefined,
        });
        onClose();
      });
      if (!ok) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not suspend user.");
    }
  }

  return (
    <AdminModal
      open={userId !== null}
      onClose={onClose}
      title="Suspend customer"
      subtitle={userName ? `Restrict checkout for ${userName}` : undefined}
      softBackdrop
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          While suspended, this Clerk customer cannot place new orders. They will see when their
          account becomes active again.
        </p>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { u: "hours" as const, label: "Hours" },
              { u: "days" as const, label: "Days" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.u}
              type="button"
              onClick={() => setUnit(opt.u)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium",
                unit === opt.u
                  ? "border-primary/30 bg-primary text-white"
                  : "border-outline/40 bg-white hover:bg-cream",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <AdminFormField label={`Duration (${unit})`}>
          <input
            type="number"
            min={1}
            max={unit === "hours" ? 720 : 365}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
            className={adminInputClass}
            required
          />
        </AdminFormField>

        <AdminFormField label="Reason (optional, internal)">
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={cn(adminInputClass, "resize-none")}
            placeholder="e.g. Payment dispute, policy violation…"
          />
        </AdminFormField>

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
            className="rounded-full px-4 py-2 text-sm text-muted hover:bg-cream"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-amber-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Suspending…" : "Suspend account"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
