import { useMemo, useRef } from "react";
import { useScroll } from "framer-motion";
import { HighlightCard } from "@/components/sections/HighlightCard";
import { HIGHLIGHTS } from "@/data/content";
import { REF_HIGHLIGHT_CARDS } from "@/data/refAssets";
import { SectionTitle } from "@/components/ui/SectionTitle";

const STICKY_TOP = 110;
const SCALE_TARGETS = [0.98, 0.98, 0.98] as const;
const RANGES = [
  [0.0, 0.42],
  [0.29, 0.71],
  [0.58, 1.0],
] as const;

export function HighlightsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const cards = useMemo(() => {
    // Match the ref section: Elegant Ambience, Skilled Baristas, Seasonal Specials
    // (skip "Handcrafted Coffee")
    const indices = [0, 2, 3] as const;
    return indices.map((i) => ({
      title: HIGHLIGHTS[i]?.title ?? "",
      image: REF_HIGHLIGHT_CARDS[i].src,
      alt: REF_HIGHLIGHT_CARDS[i].alt,
      objectPosition: REF_HIGHLIGHT_CARDS[i].objectPosition,
      width: REF_HIGHLIGHT_CARDS[i].width,
      height: REF_HIGHLIGHT_CARDS[i].height,
    }));
  }, []);

  return (
    <section id="highlights" className="section-pad">
      <div className="container-main">
        <div className="sticky top-[84px] z-30 mb-12 flex justify-center">
          <SectionTitle
            eyebrow="Our Highlights"
            title="Moments and Details That Set Us Apart"
            align="center"
            titleColor="green"
            className="mx-auto w-full max-w-[860px]"
          />
        </div>

        <div ref={sectionRef} className="relative w-full">
          {/* Extra scroll space so cards can handoff */}
          <div className="relative min-h-[280vh] w-full pb-24">
            <div className="relative mx-auto w-full max-w-[1320px]">
              {cards.map((card, idx) => (
                <HighlightCard
                  key={card.title || idx}
                  title={card.title}
                  image={card.image}
                  imageAlt={card.alt}
                  objectPosition={card.objectPosition}
                  imageWidth={card.width}
                  imageHeight={card.height}
                  priority={idx === 0}
                  stickyTop={STICKY_TOP}
                  progress={scrollYProgress}
                  scaleTo={SCALE_TARGETS[idx]}
                  range={RANGES[idx]}
                  fadeIn={idx !== 0}
                  zIndex={30 - idx}
                  titleDelay={idx * 0.03}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
