import { useEffect, useState, type ReactNode } from "react";
import { CafeLoadingSplash } from "./CafeLoadingSplash";

const MIN_SPLASH_MS = 2600;
const EXIT_MS = 750;

interface AppSplashGateProps {
  children: ReactNode;
}

export function AppSplashGate({ children }: AppSplashGateProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "exiting" | "done">("loading");

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    let loadReady: (() => void) | undefined;
    let minTimer: ReturnType<typeof setTimeout>;
    let maxTimer: ReturnType<typeof setTimeout>;
    let raf = 0;
    const start = performance.now();
    const duration = MIN_SPLASH_MS;

    const tick = (now: number) => {
      const elapsed = now - start;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 2.2);
      setProgress(Math.min(98, eased * 98));
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    const minTime = new Promise<void>((resolve) => {
      minTimer = setTimeout(resolve, MIN_SPLASH_MS);
    });

    const fontsReady =
      typeof document !== "undefined" && document.fonts?.ready
        ? document.fonts.ready.then(() => undefined)
        : Promise.resolve();

    const windowLoaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      loadReady = () => resolve();
      window.addEventListener("load", loadReady, { once: true });
    });

    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    const ready = Promise.race([
      Promise.all([minTime, fontsReady, windowLoaded]),
      new Promise<void>((resolve) => { maxTimer = setTimeout(resolve, 5000); }),
    ]);
    ready.then(() => {
      if (cancelled) return;
      setProgress(100);
      setPhase("exiting");
      exitTimer = setTimeout(() => setPhase("done"), EXIT_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      if (loadReady) window.removeEventListener("load", loadReady);
      cancelAnimationFrame(raf);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, []);

  return (
    <>
      {children}
      {phase !== "done" && (
        <CafeLoadingSplash exiting={phase === "exiting"} progress={progress} />
      )}
    </>
  );
}
