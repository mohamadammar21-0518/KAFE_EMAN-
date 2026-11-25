import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { REF_HERO_FLOATS } from "@/data/refAssets";
import { heroEase } from "@/motion/presets";

function shadowFilter(shadow: string) {
  if (shadow === "drop-shadow(hero-float-up)") {
    return "drop-shadow(0 -8px 8px rgba(0,0,0,0.5))";
  }
  if (shadow === "drop-shadow(hero-float-soft)") {
    return "drop-shadow(0 6px 7px rgba(0,0,0,0.5))";
  }
  return "drop-shadow(0 5px 7px rgba(0,0,0,0.5))";
}

function useNarrowViewport() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1199.98px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return narrow;
}

export function HeroFloatDecor() {
  const reduceMotion = useReducedMotion();
  const narrow = useNarrowViewport();

  return (
    <>
      {REF_HERO_FLOATS.map((float, index) => {
        const rotate =
          narrow && "rotateMd" in float && float.rotateMd !== undefined
            ? float.rotateMd
            : float.rotate;

        return (
          <motion.figure
            key={`hero-float-${index}`}
            initial={{ opacity: 0.001 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: reduceMotion ? 0 : float.delay,
              duration: 0.6,
              ease: heroEase,
            }}
            className={`pointer-events-none absolute ${
              "hiddenTablet" in float && float.hiddenTablet ? "hidden lg:block" : ""
            }`}
            style={{
              top: float.top,
              left: float.left,
              width: float.width,
              height: float.height,
              rotate: `${rotate}deg`,
              filter: shadowFilter(float.shadow),
            }}
          >
            <img
              src={float.src}
              alt=""
              className={reduceMotion ? "h-full w-full object-contain" : "hero-bean-float h-full w-full object-contain"}
              style={
                reduceMotion
                  ? undefined
                  : {
                      animationDuration: `${float.floatDuration}s`,
                      animationDelay: `${float.delay + 0.4}s`,
                    }
              }
            />
          </motion.figure>
        );
      })}
    </>
  );
}
