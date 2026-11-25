import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useBranch } from "@/branch/BranchContext";

export function BranchPickerModal() {
  const {
    branches,
    branchId,
    setBranchId,
    showBranchPicker,
    closeBranchPicker,
  } = useBranch();

  return (
    <AnimatePresence>
      {showBranchPicker && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeBranchPicker}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-[860px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-outline-variant/40 bg-surface/95 shadow-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-picker-title"
          >
            <div className="border-b border-outline-variant/40 px-6 py-5 md:px-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sand/25 text-coffee-dark">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="branch-picker-title" className="text-headline-md text-coffee-dark">Select your branch</h2>
                  <p className="text-body-md text-muted">
                    We’ll show the correct hours and available menu for your location.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
              {branches.map((b, index) => {
                const active = b.id === branchId;
                return (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index, 3) * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={active}
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBranchId(b.id);
                      closeBranchPicker();
                    }}
                    className={`rounded-2xl border p-5 text-left transition-all ${
                      active
                        ? "border-brand-green/30 bg-brand-green text-white shadow-soft"
                        : "border-outline-variant/40 bg-white/60 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-soft"
                    }`}
                  >
                    <p className="text-label-lg font-semibold">{b.label}</p>
                    <p className={`${active ? "text-white/85" : "text-muted"} mt-1 text-sm`}>
                      {b.subtitle}
                    </p>
                    <p className={`${active ? "text-white/85" : "text-on-surface"} mt-4 text-sm`}>
                      {b.address}
                    </p>
                    <ul className={`mt-3 space-y-1 text-sm ${active ? "text-white/85" : "text-muted"}`}>
                      {b.hours.map((hours) => <li key={hours}>{hours}</li>)}
                    </ul>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

