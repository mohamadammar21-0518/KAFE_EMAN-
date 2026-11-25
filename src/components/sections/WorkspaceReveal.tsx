import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { WORKSPACE_FEATURES } from "@/data/content";
import { REF_WORKSPACE_IMAGE, REF_WORKSPACE_SIZE } from "@/data/refAssets";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { workspaceSpring } from "@/motion/presets";

export function WorkspaceReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const rotateY = useTransform(scrollYProgress, [0, 1], [-70, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.3, 1]);
  const x = useTransform(scrollYProgress, [0, 1], [112, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.5, 1]);

  return (
    <section id="workspace" ref={ref} className="section-pad overflow-hidden">
      <div className="container-main">
        <SectionTitle
          eyebrow="Café workspace"
          title="Designed for Work, Comfort & Inspiration"
          titleColor="green"
          className="mb-12"
        />

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            style={{
              rotateY,
              scale,
              x,
              opacity,
              transformPerspective: 1200,
              aspectRatio: `${REF_WORKSPACE_SIZE.width} / ${REF_WORKSPACE_SIZE.height}`,
            }}
            transition={workspaceSpring}
            className="relative overflow-hidden rounded-xl border border-outline-variant/40 shadow-card"
          >
            <OptimizedImage
              src={REF_WORKSPACE_IMAGE}
              alt="Café workspace"
              width={REF_WORKSPACE_SIZE.width}
              height={REF_WORKSPACE_SIZE.height}
              className="h-full w-full"
            />
          </motion.div>

          <div className="space-y-8">
            {WORKSPACE_FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.15, ...workspaceSpring }}
                className="rounded-xl border border-outline-variant/40 bg-white p-8 shadow-card"
              >
                <p className="text-label-sm text-sand mb-2">
                  {feature.title} · {feature.subtitle}
                </p>
                <h3 className="text-headline-md text-on-surface mb-3">{feature.heading}</h3>
                <p className="text-body-md text-muted">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
