import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Star, Upload } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { useAdminToken } from "@/admin/useAdminToken";
import { cn } from "@/lib/utils";

export function AdminCreateTestimonialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const adminToken = useAdminToken();
  const createStaff = useMutation(api.testimonials.createStaff);
  const generateUploadUrl = useMutation(api.testimonials.generateStaffUploadUrl);

  const [authorName, setAuthorName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageStorageId, setImageStorageId] = useState<Id<"_storage"> | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAuthorName("");
      setSubtitle("");
      setRating(5);
      setText("");
      setImageUrl("");
      setImagePreview(null);
      setImageStorageId(undefined);
      setError(null);
      setBusy(false);
    }
  }, [open]);

  async function handleImageUpload(file: File | null) {
    if (!file || !adminToken) return;
    setBusy(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl({ adminToken });
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Image upload failed.");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      setImageStorageId(storageId);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
    setBusy(true);
    setError(null);
    try {
      await createStaff({
        adminToken,
        authorName,
        subtitle: subtitle.trim() || undefined,
        rating,
        text,
        imageUrl: imageUrl.trim() || undefined,
        imageStorageId,
        targetLabel: subtitle.trim() || "Featured guest",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create testimonial.");
    } finally {
      setBusy(false);
    }
  }

  const preview = imagePreview ?? (imageUrl.trim() || undefined);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Add testimonial"
      subtitle="Creates a pending entry in Actual — publish after review."
      softBackdrop
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <AdminFormField label="Guest name *">
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className={adminInputClass}
            required
            placeholder="e.g. Daniel Foster"
          />
        </AdminFormField>

        <AdminFormField label="Title / role (optional)">
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={adminInputClass}
            placeholder="e.g. Remote Designer"
          />
        </AdminFormField>

        <AdminFormField label="Rating *">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded p-1 hover:bg-cream"
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      value <= rating ? "fill-amber-400 text-amber-400" : "text-outline/50",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </AdminFormField>

        <AdminFormField label="Testimonial text (min. 10 characters) *">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={cn(adminInputClass, "min-h-[6rem] resize-y")}
            required
            minLength={10}
            rows={4}
          />
        </AdminFormField>

        <AdminFormField label="Image URL (optional)">
          <input
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImageStorageId(undefined);
              setImagePreview(null);
            }}
            className={adminInputClass}
            placeholder="https://…"
            type="url"
          />
        </AdminFormField>

        <div className="flex flex-wrap items-center gap-3">
          {preview ? (
            <img src={preview} alt="" className="h-24 w-24 rounded-xl object-cover" />
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline/40 px-4 py-2 hover:bg-cream">
            <Upload className="h-4 w-4" />
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-coffee-dark px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save as pending"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-outline/40 px-6 py-2.5 text-sm hover:bg-cream"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
