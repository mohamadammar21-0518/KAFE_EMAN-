import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Star, Upload, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { useBranch } from "@/branch/BranchContext";
import { useBranchMenuCatalog } from "@/hooks/useConvexData";
import { hasConvex } from "@/providers/AppProviders";
import { cn } from "@/lib/utils";

type TargetType = "all" | "category" | "menuItem";

export function FeedbackSubmitModal({
  open,
  onClose,
  authorName,
}: {
  open: boolean;
  onClose: () => void;
  authorName: string;
}) {
  const { branchId } = useBranch();
  const catalog = useBranchMenuCatalog(branchId);
  const submitFeedback = useMutation(api.testimonials.submit);
  const generateUploadUrl = useMutation(api.testimonials.generateUploadUrl);

  const [targetType, setTargetType] = useState<TargetType>("all");
  const [categoryKey, setCategoryKey] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageStorageId, setImageStorageId] = useState<Id<"_storage"> | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = useMemo(() => catalog?.categories ?? [], [catalog]);

  const menuItemsFlat = useMemo(() => {
    const items: Array<{
      _id: string;
      name: string;
      imageUrl?: string;
      categoryLabel: string;
    }> = [];
    for (const group of categories) {
      for (const item of group.items) {
        items.push({
          _id: item._id,
          name: item.name,
          imageUrl: item.imageUrl,
          categoryLabel: group.label,
        });
      }
    }
    return items;
  }, [categories]);

  const defaultPreview = useMemo(() => {
    if (targetType === "menuItem" && menuItemId) {
      return menuItemsFlat.find((i) => i._id === menuItemId)?.imageUrl;
    }
    if (targetType === "category" && categoryKey) {
      const group = categories.find((c) => c._id === categoryKey);
      return group?.items.find((i) => i.imageUrl)?.imageUrl;
    }
    return categories[0]?.items.find((i) => i.imageUrl)?.imageUrl;
  }, [targetType, menuItemId, categoryKey, categories, menuItemsFlat]);

  const previewSrc = imagePreview ?? defaultPreview ?? undefined;

  useEffect(() => {
    if (!open) {
      setTargetType("all");
      setCategoryKey("");
      setMenuItemId("");
      setRating(5);
      setText("");
      setSubtitle("");
      setImagePreview(null);
      setImageStorageId(undefined);
      setError(null);
      setSuccess(false);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (targetType === "category" && categories.length > 0 && !categoryKey) {
      setCategoryKey(String(categories[0]._id));
    }
  }, [targetType, categories, categoryKey]);

  useEffect(() => {
    if (targetType === "menuItem" && menuItemsFlat.length > 0 && !menuItemId) {
      setMenuItemId(menuItemsFlat[0]._id);
    }
  }, [targetType, menuItemsFlat, menuItemId]);

  async function handleImageChange(file: File | null) {
    if (!file) {
      setImagePreview(null);
      setImageStorageId(undefined);
      return;
    }
    if (!hasConvex()) return;

    setBusy(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Image upload failed.");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      setImageStorageId(storageId);
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasConvex()) {
      setError("Feedback is unavailable right now.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await submitFeedback({
        rating,
        text,
        subtitle: subtitle.trim() || undefined,
        targetType,
        branchSlug: branchId,
        categoryId:
          targetType === "category" && categoryKey
            ? (categoryKey as Id<"menuCategories">)
            : undefined,
        menuItemId:
          targetType === "menuItem" && menuItemId
            ? (menuItemId as Id<"menuItems">)
            : undefined,
        imageStorageId,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit feedback.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Share your experience"
      subtitle={`Posting as ${authorName}`}
      compact
      panelClassName="max-w-2xl"
      softBackdrop
    >
      {success ? (
        <div className="space-y-4 text-sm">
          <p className="text-on-surface">
            Thank you! Your feedback was sent to our team. Once approved, it may appear on our
            website for other guests.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-coffee-dark px-6 py-2.5 text-sm font-medium text-white hover:bg-coffee-dark/90"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <AdminFormField label="What are you rating?" className="sm:col-span-2">
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className={adminInputClass}
              >
                <option value="all">Overall café experience</option>
                <option value="category">A menu category</option>
                <option value="menuItem">A specific menu item</option>
              </select>
            </AdminFormField>

            {targetType === "category" && (
              <AdminFormField label="Menu category" className="sm:col-span-2">
                <select
                  value={categoryKey}
                  onChange={(e) => setCategoryKey(e.target.value)}
                  className={adminInputClass}
                  required
                >
                  {categories.map((cat) => (
                    <option key={String(cat._id)} value={String(cat._id)}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </AdminFormField>
            )}

            {targetType === "menuItem" && (
              <AdminFormField label="Menu item" className="sm:col-span-2">
                <select
                  value={menuItemId}
                  onChange={(e) => setMenuItemId(e.target.value)}
                  className={adminInputClass}
                  required
                >
                  {menuItemsFlat.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} · {item.categoryLabel}
                    </option>
                  ))}
                </select>
              </AdminFormField>
            )}

            <AdminFormField label="Your rating">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="rounded p-0.5 transition-colors hover:bg-cream"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          value <= rating ? "fill-sand text-sand" : "text-outline/60",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </AdminFormField>

            <AdminFormField label="Title (optional)">
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className={adminInputClass}
                placeholder="Guest"
              />
            </AdminFormField>
          </div>

          <AdminFormField label="Your feedback (min. 10 characters)">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={cn(adminInputClass, "min-h-[4.5rem] resize-y py-2")}
              rows={3}
              required
              minLength={10}
              placeholder="Tell us about your visit…"
            />
          </AdminFormField>

          <AdminFormField label="Photo (optional)">
            <div className="flex flex-wrap items-center gap-2.5">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-cream text-xs text-muted">
                  Preview
                </div>
              )}
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-outline/40 px-3.5 py-2 text-sm hover:bg-cream">
                <Upload className="h-4 w-4 shrink-0" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleImageChange(e.target.files?.[0] ?? null)}
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => void handleImageChange(null)}
                  className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-outline/40 px-3.5 py-2 text-sm text-muted hover:bg-cream hover:text-on-surface"
                >
                  <X className="h-4 w-4 shrink-0" />
                  Remove
                </button>
              )}
            </div>
          </AdminFormField>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-nowrap items-center justify-end gap-2.5 border-t border-outline/30 pt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-outline/40 px-5 py-2 text-sm hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="shrink-0 rounded-full bg-coffee-dark px-5 py-2 text-sm font-medium text-white hover:bg-coffee-dark/90 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Submit feedback"}
            </button>
          </div>
        </form>
      )}
    </AdminModal>
  );
}
