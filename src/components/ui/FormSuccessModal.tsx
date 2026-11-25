import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FormSuccessModal({
  open,
  onClose,
  title,
  message,
  titleId,
  offlineNote,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  titleId: string;
  offlineNote?: string;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            aria-label="Close success message"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-md rounded-2xl border border-brand-green/25 bg-white p-6 text-center shadow-xl sm:p-8"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-cream"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/12 text-brand-green">
              <PartyPopper className="h-7 w-7" aria-hidden />
            </div>

            <h2 id={titleId} className="mt-5 text-headline-md text-coffee-dark">
              {title}
            </h2>

            <p className="mt-3 flex items-start justify-center gap-2 text-left text-body-md text-on-surface sm:text-center sm:items-center">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-brand-green sm:mt-0"
                aria-hidden
              />
              <span>{message}</span>
            </p>

            {offlineNote ? <p className="mt-3 text-sm text-muted">{offlineNote}</p> : null}

            <Button type="button" onClick={onClose} className="mt-6 w-full sm:w-auto">
              Got it, thank you
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
