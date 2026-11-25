import { useEffect, useMemo, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

type Direction = "toward" | "away";

interface ParallaxFloatingProps {
  children: ReactNode;
  /**
   * Ref behavior: global viewport-centered mouse parallax.
   * This is the distance (px) at screen edges.
   */
  distance?: number;
  /**
   * 0..100 where higher = smoother (lower stiffness).
   * Matches the ref component's intent.
   */
  smoothing?: number;
  direction?: Direction;
  enabled?: boolean;
  className?: string;
}

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function useStableId(length = 13) {
  return useMemo(() => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
    }
    return result;
  }, [length]);
}

function mapRange(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number) {
  if (fromLow === fromHigh) return toLow;
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

export function ParallaxFloating({
  children,
  distance = 25,
  smoothing = 50,
  direction = "away",
  enabled = true,
  className,
}: ParallaxFloatingProps) {
  const reducedMotion = useReducedMotion();
  const id = useStableId();
  const offset = distance * (direction === "away" ? -1 : 1);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = {
    damping: 100,
    stiffness: mapRange(smoothing, 0, 100, 2000, 50),
  };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      x.set(0);
      y.set(0);
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const normalizedX = ((event.clientX - centerX) / centerX) * offset;
      const normalizedY = ((event.clientY - centerY) / centerY) * offset;
      x.set(normalizedX);
      y.set(normalizedY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, reducedMotion, offset, x, y]);

  if (!enabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      data-parallaxfloating={id}
      className={className}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}

