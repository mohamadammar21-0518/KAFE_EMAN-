import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface ParallaxMouseProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function ParallaxMouse({
  children,
  strength = 18,
  className,
}: ParallaxMouseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 100, stiffness: 200 });
  const springY = useSpring(y, { damping: 100, stiffness: 200 });
  const translateX = useTransform(springX, (v) => v * strength);
  const translateY = useTransform(springY, (v) => v * strength);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(-px);
    y.set(-py);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div style={{ x: translateX, y: translateY }}>{children}</motion.div>
    </div>
  );
}
