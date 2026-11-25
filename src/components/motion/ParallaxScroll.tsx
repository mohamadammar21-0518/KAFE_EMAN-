import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface ParallaxScrollProps {
  children: ReactNode;
  /**
   * Vertical travel distance (px) across the scroll range.
   * Positive values move the element upward as you scroll down.
   */
  distance?: number;
  /**
   * Scroll progress range (0-1) to map transforms across.
   * Using a narrower range makes the motion feel more "alive".
   */
  range?: [number, number];
  className?: string;
}

export function ParallaxScroll({
  children,
  distance = 36,
  range = [0, 1] as [number, number],
  className,
}: ParallaxScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, range, [distance, -distance]);
  const scale = useTransform(scrollYProgress, range, [1.02, 1]);

  if (reducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ y, scale }} className={className}>
      {children}
    </motion.div>
  );
}

