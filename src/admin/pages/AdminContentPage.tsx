import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";
import { useAdminToken } from "@/admin/useAdminToken";

export function AdminContentPage() {
  const adminToken = useAdminToken();
  const settings = useQuery(api.siteSettings.get, {});
  const upsert = useMutation(api.siteSettings.upsert);
  const { busy, run: runSave, isLocked: saveLocked } = useSubmitGuard();

  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hours, setHours] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setLocation(settings.location);
    setPhone(settings.phone);
    setEmail(settings.email);
    setHours(settings.hours);
    setInstagramUrl(settings.instagramUrl ?? "");
    setFacebookUrl(settings.facebookUrl ?? "");
    setXUrl(settings.xUrl ?? "");
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || saveLocked()) return;
    setError(null);
    setSaved(false);
    try {
      const ok = await runSave(async () => {
        await upsert({
          adminToken,
          location,
          phone,
          email,
          hours,
          instagramUrl: instagramUrl || undefined,
          facebookUrl: facebookUrl || undefined,
          xUrl: xUrl || undefined,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
      if (!ok) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg text-coffee-dark">Content & contact info</h1>
        <p className="mt-1 text-sm text-muted">
          Manage address, phone, email, hours, and social links shown on the contact page and
          footer.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-6 rounded-2xl border border-outline/40 bg-white/70 p-6 shadow-card md:p-8"
        aria-busy={busy}
      >
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminFormField label="Location / address">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={adminInputClass}
              required
            />
          </AdminFormField>
          <AdminFormField label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={adminInputClass}
              required
            />
          </AdminFormField>
          <AdminFormField label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={adminInputClass}
              required
            />
          </AdminFormField>
          <AdminFormField label="Opening hours">
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 9:00 AM – 11:00 PM"
              className={adminInputClass}
              required
            />
          </AdminFormField>
        </div>

        <div className="space-y-4 border-t border-outline/30 pt-6">
          <p className="text-sm font-semibold text-coffee-dark">Social media links</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminFormField label="Instagram URL">
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className={adminInputClass}
                placeholder="https://instagram.com/…"
              />
            </AdminFormField>
            <AdminFormField label="Facebook URL">
              <input
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className={adminInputClass}
                placeholder="https://facebook.com/…"
              />
            </AdminFormField>
            <AdminFormField label="X (Twitter) URL">
              <input
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                className={adminInputClass}
                placeholder="https://x.com/…"
              />
            </AdminFormField>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-outline/30 pt-6">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
