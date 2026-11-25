import { FadeInView } from "@/components/motion/FadeInView";
import { ParallaxScroll } from "@/components/motion/ParallaxScroll";
import { ParallaxFloating } from "@/components/motion/ParallaxFloating";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { REF_HERITAGE_IMAGE, REF_HERITAGE_SIZE } from "@/data/refAssets";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { Stat } from "@/data/content";

type AboutStat = Pick<Stat, "value" | "suffix" | "label">;

interface AboutSectionProps {
  stats: AboutStat[];
}

function formatStatDisplay(stat: AboutStat): string {
  if (stat.value === 8 && stat.suffix === "+") {
    return "8+ Years";
  }
  return `${stat.value}${stat.suffix}`;
}

export function AboutSection({ stats }: AboutSectionProps) {
  return (
    <section id="about" className="section-pad">
      <div className="container-main flex flex-col gap-20">
        <FadeInView y={20} className="mx-auto">
          <SectionTitle
            eyebrow="Our Heritage"
            title="Inspired by heritage Crafted with precision"
            align="center"
            titleColor="green"
            className="mx-auto max-w-[520px]"
          />
        </FadeInView>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-10">
          {/* Ref: left heritage image, 482px height, inner border */}
          <FadeInView y={40} delay={0.05}>
            <ParallaxScroll distance={42} range={[0, 0.9]}>
              <ParallaxFloating distance={22} smoothing={55} className="relative">
                <div className="group relative min-h-[420px] overflow-hidden rounded-xl lg:min-h-[482px] lg:max-h-[482px]">
                  <OptimizedImage
                    src={REF_HERITAGE_IMAGE}
                    alt="Café interior heritage"
                    priority
                    width={REF_HERITAGE_SIZE.width}
                    height={REF_HERITAGE_SIZE.height}
                    className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
                  />
                  <div className="pointer-events-none absolute inset-4 rounded-md border border-cream opacity-55" />
                </div>
              </ParallaxFloating>
            </ParallaxScroll>
          </FadeInView>

          {/* Ref: right content + horizontal stats with dividers */}
          <div className="flex flex-col justify-between gap-10">
            <ParallaxScroll distance={28} range={[0.1, 1]}>
              <FadeInView y={26} delay={0.1} className="flex flex-col gap-6">
                <h4 className="text-headline-md text-coffee-dark leading-snug">
                  Our café combines exceptional coffee with comfort. Every detail, from
                  our beans to our interiors, reflects our commitment to more than just
                  a beverage — it&apos;s about creating a space where guests can
                  relax, connect, and enjoy meaningful moments.
                </h4>
                <Button to="/about">Know More</Button>
              </FadeInView>
            </ParallaxScroll>

            <FadeInView y={22} delay={0.18}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="flex flex-1 items-stretch gap-3">
                    {index > 0 && (
                      <div className="hidden w-px shrink-0 self-stretch bg-[#d6d6d6] sm:block" />
                    )}
                    <div className="flex flex-1 flex-col gap-1 py-2">
                      <h5 className="text-headline-md text-black">
                        {formatStatDisplay(stat)}
                      </h5>
                      <p className="text-body-md text-on-surface-variant">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInView>
          </div>
        </div>
      </div>
    </section>
  );
}
