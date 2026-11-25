import { useState } from "react";
import { motion } from "framer-motion";
import { SITE } from "@/data/content";

const SPLASH_LOGO_SRC = "/logos/logo.jpg";

function SteamWisp({ delay }: { delay: number }) {
  return (
    <span
      className="splash-steam absolute bottom-[62%] h-14 w-3 rounded-full bg-cream/25 blur-md"
      style={{ animationDelay: `${delay}s`, left: `${42 + delay * 8}%` }}
    />
  );
}

interface CafeLoadingSplashProps {
  exiting?: boolean;
  progress: number;
}

export function CafeLoadingSplash({ exiting = false, progress }: CafeLoadingSplashProps) {
  const letters = SITE.name.split("");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const steppedProgress = Math.floor(progress / 5) * 5; // 0, 5, 10, 15... like "walking" steps
  const logoScale = 0.08 + 0.92 * (Math.min(100, Math.max(0, steppedProgress)) / 100);

  return (
    <motion.div
      className="splash-screen fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-coffee-dark"
      initial={{ opacity: 1 }}
      animate={
        exiting
          ? { opacity: 0, scale: 1.04 }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      aria-busy={!exiting}
      aria-label="Loading Kafe Eman"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="splash-glow absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green/20 blur-[100px]" />
        <div className="splash-glow-delay absolute left-[20%] top-[30%] h-64 w-64 rounded-full bg-sand/25 blur-[80px]" />
        <div className="splash-glow-delay-2 absolute right-[15%] bottom-[20%] h-72 w-72 rounded-full bg-cream/10 blur-[90px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Orbit + cup */}
        <div className="relative mb-10 flex h-[220px] w-[220px] items-center justify-center md:h-[240px] md:w-[240px]">
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative">
              <SteamWisp delay={0} />
              <SteamWisp delay={0.45} />
              <SteamWisp delay={0.9} />
              <motion.div
                className="relative h-[140px] w-[140px] md:h-[168px] md:w-[168px]"
                initial={{ scale: 0.08, opacity: 0 }}
                animate={exiting ? { scale: 1.03, opacity: 0 } : { scale: logoScale, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.9 }}
              >
                {/* Always-visible growing placeholder (prevents “pop in”) */}
                <div className="absolute inset-0 rounded-full bg-cream/10 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/15" />

                {/* Real logo fades in smoothly once loaded */}
                <motion.img
                  src={SPLASH_LOGO_SRC}
                  alt=""
                  className="absolute inset-0 h-full w-full rounded-full object-cover"
                  onLoad={() => setLogoLoaded(true)}
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={
                    exiting
                      ? { opacity: 0, filter: "blur(8px)" }
                      : { opacity: logoLoaded ? 1 : 0, filter: logoLoaded ? "blur(0px)" : "blur(10px)" }
                  }
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Progress ring */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 220 220"
            aria-hidden
          >
            <circle
              cx="110"
              cy="110"
              r="102"
              fill="none"
              stroke="rgba(255,249,242,0.08)"
              strokeWidth="2"
            />
            <motion.circle
              cx="110"
              cy="110"
              r="102"
              fill="none"
              stroke="rgba(164,137,97,0.75)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 102}
              animate={{
                strokeDashoffset: 2 * Math.PI * 102 * (1 - progress / 100),
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </svg>
        </div>

        {/* Brand */}
        <motion.h1
          className="font-display flex gap-[0.02em] text-[2rem] font-semibold tracking-[-0.04em] text-cream md:text-[2.75rem]"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.045, delayChildren: 0.25 } },
          }}
        >
          {letters.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              variants={{
                hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
                show: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="mt-3 max-w-[28ch] text-center text-sm text-cream/70 md:text-base"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          Brewing something special…
        </motion.p>

        {/* Bar progress */}
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-cream/10 md:w-56">
          <motion.div
            className="splash-progress-bar h-full rounded-full bg-gradient-to-r from-sand via-cream to-brand-green"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        <motion.p
          className="mt-3 text-xs font-medium tabular-nums tracking-[0.2em] text-sand/80 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.p>
      </div>
    </motion.div>
  );
}
