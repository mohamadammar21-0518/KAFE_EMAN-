import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface StatsCardProps {
  value: number;
  suffix: string;
  label: string;
  index?: number;
}

export function StatsCard({ value, suffix, label, index = 0 }: StatsCardProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, delay: index * 0.1 });
    return controls.stop;
  }, [count, value, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="detail-card rounded-xl border border-white/50 bg-white p-6 md:p-8 shadow-card"
    >
      <p className="text-display-lg text-primary">
        <motion.span>{rounded}</motion.span>
        {suffix}
      </p>
      <p className="text-body-md text-primary mt-2">{label}</p>
    </motion.div>
  );
}
