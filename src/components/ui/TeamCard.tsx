import { motion } from "framer-motion";

interface TeamCardProps {
  name: string;
  role: string;
  index?: number;
}

export function TeamCard({ name, role, index = 0 }: TeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="text-center"
    >
      <div className="mx-auto mb-4 aspect-square w-full max-w-[200px] overflow-hidden rounded-full bg-gradient-to-br from-secondary-container to-parchment" />
      <h3 className="text-headline-md text-on-surface">{name}</h3>
      <p className="text-body-md text-on-surface-variant mt-1">{role}</p>
    </motion.div>
  );
}
