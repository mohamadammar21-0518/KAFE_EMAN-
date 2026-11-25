import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ParallaxMouse } from "@/components/motion/ParallaxMouse";
import { REF_AMBIENCE_IMAGES } from "@/data/refAssets";

export function AmbienceGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section id="ambience" ref={ref} className="section-pad bg-warm overflow-hidden">
      <div className="container-main">
        <SectionTitle
          eyebrow="Refined ambience"
          title="Moments Captured in Our Beautiful Café"
          align="center"
          titleColor="green"
          className="mb-12 mx-auto"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {[REF_AMBIENCE_IMAGES.slice(0, 3), REF_AMBIENCE_IMAGES.slice(3)].map(
            (row, rowIndex) => (
              <div key={rowIndex} className="grid gap-6 sm:grid-cols-3">
                {row.map((item, i) => {
                  const globalIndex = rowIndex * 3 + i;
                  return (
                    <ParallaxMouse key={item.src} strength={12 + (globalIndex % 3) * 4}>
                      <motion.figure
                        style={{ y: globalIndex % 2 === 0 ? y1 : y2 }}
                        initial={{ opacity: 0, scale: 0.7, x: item.x * 0.3, rotate: item.rotate }}
                        whileInView={{ opacity: 1, scale: 1, x: 0, rotate: item.rotate * 0.3 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ delay: globalIndex * 0.06, duration: 0.6 }}
                        className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/50 shadow-card"
                      >
                        <img
                          src={item.src}
                          alt=""
                          width={item.width}
                          height={item.height}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-1 rounded-lg border border-white/40 pointer-events-none" />
                      </motion.figure>
                    </ParallaxMouse>
                  );
                })}
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
