import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { lineGrowSpring, scrollCardSpring } from "@/motion/presets";

interface HighlightCardProps {
  title: string;
  image: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  priority?: boolean;
  objectPosition?: string;
  stickyTop: number;
  progress: MotionValue<number>;
  scaleTo: number;
  range: readonly [number, number];
  fadeIn?: boolean;
  zIndex?: number;
  titleDelay?: number;
}

export function HighlightCard({
  title,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  priority = false,
  objectPosition = "center",
  stickyTop,
  progress,
  scaleTo,
  range,
  fadeIn = true,
  zIndex,
  titleDelay = 0,
}: HighlightCardProps) {
  const [start, end] = range;
  const local = useTransform(progress, [start, end], [0, 1], { clamp: true });

  const scale = useSpring(
    useTransform(local, fadeIn ? [0, 0.2, 1] : [0, 1], fadeIn ? [0.98, 1, scaleTo] : [1, scaleTo]),
    scrollCardSpring,
  );
  const y = useSpring(
    useTransform(local, fadeIn ? [0, 0.2, 1] : [0, 1], fadeIn ? [40, 0, -40] : [0, -40]),
    scrollCardSpring,
  );
  // Smooth handoff:
  // - fade in early
  // - stay visible through the middle
  // - fade out before the end so the next card can take over
  const opacity = useTransform(
    local,
    fadeIn ? [0, 0.08, 0.55, 0.78, 1] : [0, 0.65, 0.82, 1],
    fadeIn ? [0, 1, 1, 0.55, 0] : [1, 1, 0.55, 0],
  );

  return (
    <motion.div
      className="sticky flex h-[80vh] items-center justify-center"
      style={{ top: stickyTop, zIndex }}
    >
      <motion.article
        style={{ scale, y, opacity }}
        className="relative h-full w-full overflow-hidden rounded-[10px] border border-white/50"
      >
        <OptimizedImage
          src={image}
          alt={imageAlt ?? title}
          priority={priority}
          width={imageWidth}
          height={imageHeight}
          objectPosition={objectPosition}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute left-0 top-0 h-[38%] w-full bg-[linear-gradient(180deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.62)_52%,rgba(0,0,0,0)_100%)]" />
        <div className="pointer-events-none absolute inset-2 rounded-[8px] border border-white/50" />
        <div className="absolute left-6 right-6 top-[52px] z-10 px-4 text-white">
          <div className="flex flex-col gap-2 overflow-hidden">
            <motion.h3
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ delay: titleDelay + 0.1, duration: 0.5 }}
              className="text-headline-md text-center drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)]"
            >
              {title}
            </motion.h3>
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ ...lineGrowSpring, delay: titleDelay }}
              className="h-px bg-white/50"
            />
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}
