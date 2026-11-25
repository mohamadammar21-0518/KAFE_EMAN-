import { motion } from "framer-motion";
import { heroEase } from "@/motion/presets";
import { cn } from "@/lib/utils";

interface BlurWordsProps {
  text: string;
  as?: "h1" | "h2";
  className?: string;
  delay?: number;
}

export function BlurWords({
  text,
  as: Tag = "h1",
  className,
  delay = 0,
}: BlurWordsProps) {
  const words = text.split(" ");

  return (
    <Tag className={cn("capitalize", className)}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{
            opacity: 0.001,
            filter: "blur(10px)",
            y: 10,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            scale: 1,
          }}
          transition={{
            delay: delay + index * 0.08,
            duration: 0.6,
            ease: heroEase,
          }}
          className="inline-block mr-[0.28em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
