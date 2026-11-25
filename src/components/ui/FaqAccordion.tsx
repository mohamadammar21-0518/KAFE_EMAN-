import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/data/content";
import { navSpring } from "@/motion/presets";
import { cn } from "@/lib/utils";

interface FaqAccordionProps {
  items: Faq[];
  className?: string;
}

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const id = useId();
  const [openId, setOpenId] = useState<string | null>(items[0]?._id ?? null);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-primary/15 bg-secondary-container/40 px-6 py-8 text-center text-sm text-muted">
        No questions available yet.
      </p>
    );
  }

  return (
    <div className={cn("faq-card", className)}>
      {items.map((item, index) => {
        const isOpen = openId === item._id;
        return (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className={cn(index > 0 && "faq-divider")}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item._id)}
              aria-expanded={isOpen}
              aria-controls={`faq-${id}-${index}`}
              id={`faq-trigger-${id}-${index}`}
              className={cn("faq-item-trigger", isOpen && "faq-item-trigger--open")}
            >
              <span className="faq-question">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-primary transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ...navSpring }}
                  className="overflow-hidden"
                  id={`faq-${id}-${index}`} role="region" aria-labelledby={`faq-trigger-${id}-${index}`}
                >
                  <p className="faq-answer">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
