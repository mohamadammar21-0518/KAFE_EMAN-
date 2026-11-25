import { bookingTimes, calendarDate, shopDate } from "../../../convex/lib/branchHours";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ReservationSuccessModal } from "@/components/reservation/ReservationSuccessModal";
import { useBranch, type BranchId } from "@/branch/BranchContext";
import { Clock, MapPin } from "lucide-react";

interface ReservationFormProps {
  onSubmit: (payload: {
    branchId: BranchId;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    depositEnabled: boolean;
    depositPercent?: number;
    consent: boolean;
    notes?: string;
  }) => Promise<void>;
  offlineNote?: string;
}

export function ReservationForm({ onSubmit, offlineNote }: ReservationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { branches, branchId, setBranchId } = useBranch();

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [depositEnabled, setDepositEnabled] = useState<boolean>(false);
  const [depositPercent, setDepositPercent] = useState<number>(30);
  const [consent, setConsent] = useState<boolean>(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const todayIso = useMemo(() => shopDate(), []);
  const minMonthCursor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? branches[0],
    [branches, branchId],
  );

  const availableTimes = useMemo(
    () => bookingTimes(selectedBranch.hours, date),
    [selectedBranch.hours, date],
  );

  const calendar = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay(); // 0=Sun
    const monthLabel = firstDay.toLocaleString(undefined, { month: "long", year: "numeric" });

    const cells: Array<{ iso?: string; day?: number }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({});
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = calendarDate(new Date(year, month, day));
      cells.push({ day, iso });
    }
    // pad to full weeks (6 rows max)
    while (cells.length % 7 !== 0) cells.push({});
    return { monthLabel, cells };
  }, [monthCursor]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y + 1, y + 2];
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      branchId,
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      date: date || String(form.get("date") ?? ""),
      time: availableTimes.includes(time) ? time : "",
      guests: Number(form.get("guests") ?? 1),
      depositEnabled,
      depositPercent: depositEnabled ? depositPercent : undefined,
      consent,
      notes: String(form.get("notes") ?? "") || undefined,
    };

    try {
      if (!payload.consent) throw new Error("Please accept the consent & privacy notice.");
      if (!payload.branchId) throw new Error("Please select a branch.");
      if (!payload.date) throw new Error("Please select a date.");
      if (!payload.time) throw new Error("Please select a time.");
      await onSubmit(payload);
      setStatus("success");
      setShowSuccessModal(true);
      formRef.current?.reset();
      setDate("");
      setTime("");
      setDepositEnabled(false);
      setDepositPercent(30);
      setConsent(false);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="reservation-form space-y-6 rounded-2xl border border-outline-variant/50 bg-white p-8 shadow-card"
    >
      <div>
        <p className="text-headline-md text-primary">Make a reservation for your day</p>
        <p className="text-body-md text-muted mt-1">
          Select your branch, pick a date, then choose an available time slot.
        </p>
      </div>

      <label className="block">
        <span className="text-label-lg text-on-surface mb-2 block">Select branch</span>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <select
            value={branchId}
            onChange={(e) => { setBranchId(e.target.value); setTime(""); }}
            className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-white/60 pl-10 pr-4 py-3.5 text-body-md shadow-soft focus:border-primary-container focus:outline-none"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label} · {b.subtitle}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-muted">{selectedBranch.address}</p>
      </label>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Calendar panel */}
        <div className="rounded-2xl border border-outline-variant/40 bg-white/60 p-5 shadow-soft">
          <div className="flex flex-col items-start justify-between gap-3">
            <p className="text-label-lg text-on-surface">{calendar.monthLabel}</p>
            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
              <select
                value={monthCursor.getMonth()}
                onChange={(e) => {
                  const d = new Date(monthCursor);
                  d.setMonth(Number(e.target.value));
                  if (d < minMonthCursor) return;
                  setMonthCursor(d);
                }}
                className="rounded-full border border-outline-variant/40 bg-white/70 px-3 py-2 text-sm"
                aria-label="Select month"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i, 1).toLocaleString(undefined, { month: "short" })}
                  </option>
                ))}
              </select>
              <select
                value={monthCursor.getFullYear()}
                onChange={(e) => {
                  const d = new Date(monthCursor);
                  d.setFullYear(Number(e.target.value));
                  if (d < minMonthCursor) return;
                  setMonthCursor(d);
                }}
                className="rounded-full border border-outline-variant/40 bg-white/70 px-3 py-2 text-sm"
                aria-label="Select year"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="rounded-full border border-outline-variant/40 bg-white/70 px-3 py-2 text-sm hover:bg-white disabled:opacity-40"
                onClick={() => {
                  const d = new Date(monthCursor);
                  d.setMonth(d.getMonth() - 1);
                  if (d < minMonthCursor) return;
                  setMonthCursor(d);
                }}
                aria-label="Previous month"
                disabled={monthCursor <= minMonthCursor}
              >
                ‹
              </button>
              <button
                type="button"
                className="rounded-full border border-outline-variant/40 bg-white/70 px-3 py-2 text-sm hover:bg-white"
                onClick={() => {
                  const d = new Date(monthCursor);
                  d.setMonth(d.getMonth() + 1);
                  setMonthCursor(d);
                }}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendar.cells.map((c, idx) => {
              if (!c.day || !c.iso) return <div key={idx} className="h-10" />;
              const active = date === c.iso;
              const isPast = c.iso < todayIso;
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => {
                    setDate(c.iso ?? "");
                    setTime("");
                  }}
                  disabled={isPast}
                  aria-label={c.iso}
                  aria-pressed={active}
                  className={`h-10 rounded-xl border text-sm transition-colors ${
                    isPast
                      ? "border-outline-variant/30 bg-white/40 text-muted opacity-40"
                      : active
                      ? "border-brand-green/30 bg-brand-green text-white"
                      : "border-outline-variant/40 bg-white/70 text-on-surface hover:bg-white"
                  }`}
                >
                  {c.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: time + details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-outline-variant/40 bg-white/60 p-5 shadow-soft">
            <p className="text-label-lg text-on-surface">
              {date ? "Select a time" : "Select a date first"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {date && availableTimes.length === 0 && <p role="status" className="col-span-full text-sm text-muted">No booking times are listed for this date. Choose another day.</p>}
            {!date && <p className="col-span-full text-sm text-muted">Choose a date to see booking times.</p>}
            {availableTimes.map((t) => {
                const active = time === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!date}
                    onClick={() => setTime(t)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                      !date
                        ? "border-outline-variant/30 bg-white/40 text-muted opacity-60"
                        : active
                          ? "border-brand-green/30 bg-brand-green text-white"
                          : "border-outline-variant/40 bg-white/70 text-on-surface hover:bg-white"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 rounded-2xl border border-outline-variant/40 bg-white/60 p-5 shadow-soft">
        <label className="block">
          <span className="text-label-lg text-on-surface mb-2 block">Full Name</span>
          <input
            name="name"
            required
            className="w-full rounded-lg border-b border-outline-variant bg-parchment/40 px-4 py-3 text-body-md focus:border-primary-container focus:outline-none"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="text-label-lg text-on-surface mb-2 block">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border-b border-outline-variant bg-parchment/40 px-4 py-3 text-body-md focus:border-primary-container focus:outline-none"
            placeholder="you@email.com"
          />
        </label>
        <label className="block">
          <span className="text-label-lg text-on-surface mb-2 block">Phone</span>
          <input
            name="phone"
            type="tel"
            required
            className="w-full rounded-lg border-b border-outline-variant bg-parchment/40 px-4 py-3 text-body-md focus:border-primary-container focus:outline-none"
            placeholder="+60 12 345 6789"
          />
        </label>
        <label className="block">
          <span className="text-label-lg text-on-surface mb-2 block">Guests</span>
          <input
            name="guests"
            type="number"
            min={1}
            max={20}
            defaultValue={2}
            required
            className="w-full rounded-lg border-b border-outline-variant bg-parchment/40 px-4 py-3 text-body-md focus:border-primary-container focus:outline-none"
          />
        </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/50 bg-white/60 p-5">
        <p className="text-label-lg text-on-surface">Deposit</p>
        <p className="text-body-md text-muted mt-1">
          Would you like to pay a minimum deposit to confirm your reservation?
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDepositEnabled(true)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              depositEnabled
                ? "border-brand-green/30 bg-brand-green text-white"
                : "border-outline-variant/40 bg-white/60 text-on-surface hover:bg-white/80"
            }`}
          >
            Yes, deposit
          </button>
          <button
            type="button"
            onClick={() => setDepositEnabled(false)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              !depositEnabled
                ? "border-brand-green/30 bg-brand-green text-white"
                : "border-outline-variant/40 bg-white/60 text-on-surface hover:bg-white/80"
            }`}
          >
            No, book now
          </button>
        </div>

        {depositEnabled && (
          <div className="mt-4">
            <p className="text-sm text-on-surface">
              Deposit percentage: <span className="font-semibold">{depositPercent}%</span>
            </p>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={depositPercent}
              onChange={(e) => setDepositPercent(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
        )}
      </div>

      <label className="block">
        <span className="text-label-lg text-on-surface mb-2 block">Special Requests</span>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-lg border-b border-outline-variant bg-parchment/40 px-4 py-3 text-body-md focus:border-primary-container focus:outline-none resize-none"
          placeholder="Any dietary requirements or occasion notes..."
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-outline-variant/40 bg-white/60 p-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
          required
        />
        <span className="text-body-md text-on-surface">
          I agree that Kafe Eman may contact me to confirm my reservation and I accept the{" "}
          <Link to="/privacy" className="font-medium text-brand-green underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" className="font-medium text-brand-green underline-offset-2 hover:underline">
            Terms & Conditions
          </Link>
          .
        </span>
      </label>

      {status === "success" && !showSuccessModal && (
        <p className="rounded-xl border border-brand-green/25 bg-brand-green/8 px-4 py-3 text-body-md text-coffee-dark">
          Your reservation was submitted successfully. We will check up on you soon — thanks for
          your patience.
        </p>
      )}
      {status === "error" && (
        <p className="text-body-md text-error">{errorMessage}</p>
      )}

      <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "loading" ? "Submitting..." : "Submit Reservation"}
      </Button>

      <ReservationSuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setStatus("idle");
        }}
        offlineNote={offlineNote}
      />
    </form>
  );
}
