import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { dividerSpring } from "@/motion/presets";
import { ScaleInView } from "@/components/motion/ScaleInView";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleColor?: "default" | "green";
  className?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  titleColor = "default",
  className,
}: SectionTitleProps) {
  return (
    <ScaleInView
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "mb-4 flex items-center gap-5",
            align === "center" && "justify-center",
          )}
        >
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={dividerSpring}
            className="h-px flex-1 max-w-[120px] origin-right bg-sand-muted"
          />
          <p className="text-eyebrow shrink-0 tracking-[0.12em]">{eyebrow}</p>
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={dividerSpring}
            className="h-px flex-1 max-w-[120px] origin-left bg-sand-muted"
          />
        </div>
      )}
      <h2
        className={cn(
          "section-heading text-headline-lg",
          titleColor === "green" ? "text-primary" : "text-coffee-dark",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className="text-body-md text-muted mt-4">{description}</p>
      )}
    </ScaleInView>
  );
}
