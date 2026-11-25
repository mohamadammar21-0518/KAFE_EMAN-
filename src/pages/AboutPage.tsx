import { motion } from "framer-motion";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatsCard } from "@/components/ui/StatsCard";
import { AboutMosaic } from "@/components/sections/AboutMosaic";
import { ABOUT_COPY, type Stat } from "@/data/content";
import {
  REF_COFFEE_BEANS_IMAGE,
  REF_COFFEE_BEANS_SIZE,
  REF_WORKSPACE_IMAGE,
  REF_WORKSPACE_SIZE,
} from "@/data/refAssets";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useAboutStats } from "@/hooks/useData";

export function AboutPage() {
  const stats = useAboutStats();

  return (
    <>
      <section className="page-intro section-pad bg-gradient-to-b from-cream to-surface">
        <div className="container-main max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="page-heading text-display-lg text-primary mb-6">{ABOUT_COPY.heroTitle}</h1>
            <p className="text-body-lg text-muted">{ABOUT_COPY.heroSubtitle}</p>
          </motion.div>
        </div>
        <img className="page-intro-image" src="/Images/eman-espresso.webp" alt="Espresso at the café counter" decoding="async" />
      </section>

      <section className="section-pad pt-0">
        <div className="container-main max-w-3xl text-center">
          <h2 className="text-headline-lg text-coffee-dark">{ABOUT_COPY.intro}</h2>
        </div>
      </section>

      <section className="pb-10 md:pb-14">
        <div className="container-main">
          <AboutMosaic />
        </div>
      </section>

      <section className="section-pad bg-cream">
        <div className="container-main">
          <SectionTitle
            eyebrow={ABOUT_COPY.statsEyebrow}
            title={ABOUT_COPY.statsTitle}
            align="center"
            titleColor="green"
            className="mb-12 mx-auto"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat: Stat, index: number) => (
              <StatsCard
                key={stat._id}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-main grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionTitle
            eyebrow={ABOUT_COPY.visionTitle}
            title="Creating a refined experience"
            titleColor="green"
            description={ABOUT_COPY.visionText}
          />
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              aspectRatio: `${REF_WORKSPACE_SIZE.width} / ${REF_WORKSPACE_SIZE.height}`,
            }}
          >
            <img
              src={REF_WORKSPACE_IMAGE}
              alt="Kafe Eman interior"
              width={REF_WORKSPACE_SIZE.width}
              height={REF_WORKSPACE_SIZE.height}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="section-pad bg-warm">
        <div className="container-main grid gap-12 lg:grid-cols-2 lg:items-center">
          <div
            className="overflow-hidden rounded-2xl border border-outline-variant/40 shadow-card"
            style={{
              aspectRatio: `${REF_COFFEE_BEANS_SIZE.width} / ${REF_COFFEE_BEANS_SIZE.height}`,
            }}
          >
            <OptimizedImage
              src={REF_COFFEE_BEANS_IMAGE}
              alt="Premium coffee beans at Kafe Eman"
              width={REF_COFFEE_BEANS_SIZE.width}
              height={REF_COFFEE_BEANS_SIZE.height}
              className="h-full w-full"
            />
          </div>
          <div>
            <SectionTitle
              title={ABOUT_COPY.beansTitle}
              description={ABOUT_COPY.beansText}
              titleColor="green"
              className="mb-8"
            />
            <div className="flex flex-wrap gap-3">
              {ABOUT_COPY.beansTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sand/25 px-4 py-2 text-label-sm text-coffee-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
