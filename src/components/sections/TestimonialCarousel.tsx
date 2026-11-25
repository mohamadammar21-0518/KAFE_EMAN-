import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { FeedbackCtaStrip } from "@/components/sections/FeedbackCtaStrip";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TESTIMONIALS } from "@/data/content";
import { carouselSpring } from "@/motion/presets";
import { hasConvex } from "@/providers/AppProviders";
import { cn } from "@/lib/utils";

const AUTO_INTERVAL_MS = 10_000;

type CarouselItem = {
  text: string;
  author: string;
  role: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  rating: number;
};

export function TestimonialCarousel() {
  const published = useQuery(
    api.testimonials.listPublished,
    hasConvex() ? {} : "skip",
  );

  const items: CarouselItem[] = useMemo(() => {
    if (published && published.length > 0) {
      return published.map((row) => ({
        text: row.text,
        author: row.author,
        role: row.role,
        image: row.image,
        rating: row.rating,
      }));
    }
    return TESTIMONIALS.map((t) => ({
      text: t.text,
      author: t.author,
      role: t.role,
      image: t.image,
      imageWidth: t.imageWidth,
      imageHeight: t.imageHeight,
      rating: 5,
    }));
  }, [published]);

  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = items.length;
  const current = items[index];

  useEffect(() => {
    setIndex((i) => (count > 0 ? Math.min(i, count - 1) : 0));
  }, [count]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (reduceMotion || paused || count < 2) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_INTERVAL_MS);
  }, [clearTimer, reduceMotion, paused, count]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      const wrapped = ((next % count) + count) % count;
      setIndex(wrapped);
      startTimer();
    },
    [startTimer, count],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  if (!current) return null;

  const slideTransition = reduceMotion ? { duration: 0 } : carouselSpring;
  const copyTransition = reduceMotion ? { duration: 0 } : { duration: 0.35 };

  return (
    <section
      id="testimonial"
      className="section-pad bg-cream"
      aria-roledescription="carousel"
      aria-label="Guest testimonials"
    >
      <div className="container-main">
        <SectionTitle
          eyebrow="Guest Experience"
          title="Words That Reflect Our Guests' Experiences"
          align="center"
          titleColor="green"
          className="mx-auto mb-12"
        />

        <div
          className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center"
          onMouseEnter={() => {
            setPaused(true);
            clearTimer();
          }}
          onMouseLeave={() => {
            setPaused(false);
          }}
          onFocusCapture={() => {
            setPaused(true);
            clearTimer();
          }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setPaused(false);
            }
          }}
        >
          <div className="relative mx-auto h-[330px] w-full max-w-[390px] overflow-hidden rounded-xl md:h-[461px] md:max-w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`slide-img-${index}`}
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                transition={slideTransition}
                className="absolute inset-0 overflow-hidden rounded-xl"
              >
                {current.image ? (
                  <img
                    src={current.image}
                    alt=""
                    width={current.imageWidth}
                    height={current.imageHeight}
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="rounded-xl bg-sand/40 p-8 md:p-10">
            <div className="mb-4 flex gap-1" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < current.rating ? "fill-sand text-sand" : "text-outline/40",
                  )}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`slide-copy-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={copyTransition}
              >
                <blockquote className="mb-6 text-body-lg text-on-surface">{current.text}</blockquote>
                <p className="text-headline-md text-on-surface">{current.author}</p>
                <p className="text-body-md text-muted">{current.role}</p>
              </motion.div>
            </AnimatePresence>

            {count > 1 && (
              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={count <= 1}
                  className={cn(
                    "rounded-full border border-outline-variant/50 p-3 transition-opacity",
                    count <= 1 ? "opacity-30" : "opacity-100 hover:bg-white/50",
                  )}
                  aria-label="Previous testimonial"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(i)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        i === index ? "w-6 bg-coffee-dark" : "w-2 bg-sand",
                      )}
                      aria-label={`Go to testimonial ${i + 1}`}
                      aria-current={i === index ? "true" : undefined}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={count <= 1}
                  className={cn(
                    "rounded-full border border-outline-variant/50 p-3 transition-opacity",
                    count <= 1 ? "opacity-30" : "opacity-100 hover:bg-white/50",
                  )}
                  aria-label="Next testimonial"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <FeedbackCtaStrip />
      </div>
    </section>
  );
}
