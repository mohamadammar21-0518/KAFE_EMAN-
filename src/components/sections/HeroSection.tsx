import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { siteImage } from "@/data/siteAssets";

export function HeroSection() {
  const video = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const film = video.current;
    if (reducedMotion) film?.pause();
    else if (reducedMotion === false) void film?.play().catch(() => setPlaying(false));
  }, [reducedMotion]);

  return (
    <section id="hero" className="eman-film">
      <video ref={video} src={siteImage("kafe-eman-header.mp4")} poster={siteImage("kafe-eman-header.webp")}
        muted playsInline loop autoPlay={reducedMotion === false} preload={reducedMotion ? "none" : "metadata"} aria-hidden
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <div className="eman-film-scrim" />
      <div className="eman-film-content">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
          <p className="eman-caption">A café in Kedah, Malaysia</p>
          <h1 aria-label="Coffee, conversation and a little time for yourself.">
            {["Coffee, conversation", "and a little time", "for yourself."].map((line, index) => (
              <span className="eman-title-line" key={line} aria-hidden>
                <motion.span initial={{ y: reducedMotion ? 0 : "105%" }} animate={{ y: 0 }}
                  transition={{ duration: 0.85, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}>{line}</motion.span>
              </span>
            ))}
          </h1>
          <Link to="/reservation" className="eman-reserve mt-6">Reserve a table <ArrowUpRight size={16} aria-hidden /></Link>
        </motion.div>
        <motion.div className="eman-film-notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.6 }}>
          <p className="eman-film-description">A coffee counter and a barber’s chair in Alor Setar. A place to pause, with more tables waiting in Kepala Batas and UUM Sintok.</p>
          <a href="#locations">Find your café <ArrowDownRight size={17} aria-hidden /></a>
          <button type="button" aria-label={playing ? "Pause background film" : "Play background film"} onClick={() => {
            if (playing) video.current?.pause();
            else void video.current?.play().catch(() => setPlaying(false));
          }}>{playing ? <Pause size={17} /> : <Play size={17} />}</button>
        </motion.div>
        <motion.p aria-hidden className="eman-film-mark" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.77, delay: 0.12 }}>Kafe Eman</motion.p>
      </div>
    </section>
  );
}
