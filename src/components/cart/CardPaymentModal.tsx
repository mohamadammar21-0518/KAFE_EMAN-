import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CreditCard, X } from "lucide-react";

export type CardPaymentResult = {
  cardLast4: string;
  cardBrand: string;
};

type CardPaymentModalProps = {
  open: boolean;
  totalLabel: string;
  onClose: () => void;
  onSubmit: (result: CardPaymentResult) => void;
};

export function CardPaymentModal({ open, totalLabel, onClose, onSubmit }: CardPaymentModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[92] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close card form"
        onClick={onClose}
      />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label="Demo card checkout"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ cardLast4: "4242", cardBrand: "Demo" });
        }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-outline/40 bg-white p-6 shadow-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-coffee-dark">Demo card payment</p>
              <p className="text-xs text-muted">Total {totalLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-cream"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          This checkout uses a test card ending in 4242. Placing the order simulates payment.
        </p>
        <button
          type="submit"
          className="btn-ref-primary mt-5 w-full rounded-full px-6 py-3.5 text-sm font-semibold"
        >
          Place order with test card
        </button>
      </motion.form>
    </div>,
    document.body,
  );
}
