import { motion } from "framer-motion";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { useBranch } from "@/branch/BranchContext";
import { heroEase } from "@/motion/presets";

export function BranchLocations() {
  const { branches } = useBranch();

  return (
    <section id="locations" className="eman-locations section-pad scroll-mt-28">
      <div className="container-main">
        <h2 className="eman-section-title mb-10">Visit us in Kedah.</h2>
        {branches.some((branch) => branch.id === "alor-setar") && (
          <figure className="mb-8">
            <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-3xl md:grid-cols-[2fr_1fr]">
              {[
                ["1mi3x224x8zmo8lvaB047", "The concrete service counter and pastry display at Kafe Eman Alor Setar"],
                ["1mi0r224x8zmoaor65DED", "Kafe Eman coffee and iced drinks at the Alor Setar branch"],
              ].map(([photo, alt]) => (
                <img key={photo} src={`https://ak-d.tripcdn.com/images/${photo}_Q90.jpg`}
                  alt={alt} loading="lazy" decoding="async"
                  className="h-48 w-full object-cover sm:h-72 lg:h-96" />
              ))}
            </div>
            <figcaption className="mt-2 text-sm text-muted">
              Inside Alor Setar · <a href="https://www.trip.com/moments/detail/alor-setar-14834-129703996/"
                className="underline" target="_blank" rel="noreferrer">Visitor photos on Trip.com</a>
            </figcaption>
          </figure>
        )}
        <ul className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {branches.map(({ id, label, address, hours, concept }, index) => (
            <motion.li
              key={id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ease: heroEase, duration: 0.45, delay: Math.min(index, 2) * 0.07 }}
              className="flex flex-col rounded-3xl border border-primary/10 bg-white p-6 shadow-card lg:p-8"
            >
              <MapPin aria-hidden className="mb-4 h-6 w-6 text-primary" />
              <h3 className="text-headline-md text-coffee-dark">{label}</h3>
              {concept && <p className="mt-2 text-sm font-medium text-primary">{concept}</p>}
              <p className="mt-3 flex-1 text-body-md text-muted">{address}</p>
              {!!hours.length && (
                <div className="mt-5 flex gap-2.5 border-t border-primary/10 pt-4 text-sm text-coffee-dark">
                  <Clock3 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <ul className="space-y-1">
                    {hours.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                </div>
              )}
              <motion.a
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Kafe Eman " + address)}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Directions to Kafe Eman ${label}`}
                className="mt-5 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Get directions <ArrowUpRight aria-hidden className="h-4 w-4" />
              </motion.a>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
