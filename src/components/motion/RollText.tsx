import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Ref Framer roll hover: spring 0.8s, bounce 0, stacked labels with 13px gap */
export const rollHoverSpring = {
  type: "spring" as const,
  bounce: 0,
  duration: 0.8,
};

interface RollTextProps {
  children: ReactNode;
  className?: string;
  textClassName?: string;
  /** Visible clip height — ref nav: 25px, button label: 22px */
  height?: number;
  gap?: number;
  hovered?: boolean;
  capitalize?: boolean;
}

export function RollText({
  children,
  className,
  textClassName,
  height = 25,
  gap = 13,
  hovered = false,
  capitalize = true,
}: RollTextProps) {
  const lineHeight = height - 2;
  const shift = lineHeight + gap;

  return (
    <span className={cn("block overflow-hidden", className)} style={{ height }}>
      <motion.span
        className="flex flex-col"
        style={{ gap }}
        animate={{ y: hovered ? -shift : 0 }}
        transition={rollHoverSpring}
      >
        <span className={cn("whitespace-pre", capitalize && "capitalize", textClassName)}>{children}</span>
        <span aria-hidden="true" className={cn("whitespace-pre", capitalize && "capitalize", textClassName)}>{children}</span>
      </motion.span>
    </span>
  );
}

interface RollIconProps {
  children: ReactNode;
  className?: string;
  hovered?: boolean;
}

/** Ref primary button icon slot — 24px clip, rolls on hover */
export function RollIcon({ children, className, hovered = false }: RollIconProps) {
  return (
    <span aria-hidden="true" className={cn("block h-6 w-6 overflow-hidden", className)}>
      <motion.span
        className="flex flex-col"
        animate={{ y: hovered ? -24 : 0 }}
        transition={rollHoverSpring}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">{children}</span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">{children}</span>
      </motion.span>
    </span>
  );
}
