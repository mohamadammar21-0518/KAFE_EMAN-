import { motion, type HTMLMotionProps } from "framer-motion";
import { appearTween } from "@/motion/presets";
import { cn } from "@/lib/utils";

interface ScaleInViewProps extends HTMLMotionProps<"div"> {
  delay?: number;
}

/** Matches ref section headings: opacity 0 + scale(0.9) on enter */
export function ScaleInView({
  children,
  className,
  delay = 0,
  ...props
}: ScaleInViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5, margin: "-80px" }}
      transition={{ ...appearTween, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
