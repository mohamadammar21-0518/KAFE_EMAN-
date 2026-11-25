import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BlurWords } from "@/components/motion/BlurWords";
import { SlowMotionVideo } from "@/components/ui/SlowMotionVideo";
import { REF_CONVERSION_VIDEO } from "@/data/refAssets";
import { heroMediaEase } from "@/motion/presets";

export function ConversionCta() {
  return (
    <section className="relative overflow-hidden section-pad">
      <motion.div
        initial={{ scale: 1.2 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: heroMediaEase }}
        className="absolute inset-0"
      >
        <SlowMotionVideo
          src={REF_CONVERSION_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-coffee-dark/55" />
      </motion.div>

      <div className="container-main relative max-w-3xl">
        <BlurWords
          as="h2"
          text="Begin Your Coffee Experience with Us"
          className="text-headline-lg text-white mb-8 text-center md:text-left"
        />

        <div className="rounded-xl border border-white/50 bg-white/50 p-1 backdrop-blur-[15px] shadow-card">
          <div className="rounded-lg border border-white/50 bg-gradient-to-b from-white to-[#fff9f2] p-8 md:p-10">
            <h4 className="text-headline-md text-coffee-dark mb-3">
              Reserve Your Moment of Indulgence
            </h4>
            <p className="text-body-md text-muted mb-6">
              Step into a space where refined ambiance, masterfully crafted coffee,
              and impeccable hospitality await you.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button to="/reservation">Reserve Your Table</Button>
              <Button to="/menu" variant="ghost">
                View Menu
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
