import { motion, type HTMLMotionProps } from "framer-motion";
import { appearTween } from "@/motion/presets";
import { cn } from "@/lib/utils";

interface FadeInViewProps extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
  scale?: number;
}

export function FadeInView({
  children,
  className,
  delay = 0,
  y = 20,
  scale = 1,
  ...props
}: FadeInViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, scale: scale === 1 ? undefined : scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.5, margin: "-60px" }}
      transition={{ ...appearTween, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
