import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { LegalSection } from "@/data/legal";
import { LEGAL_LAST_UPDATED } from "@/data/legal";
import { SITE } from "@/data/content";
import { cn } from "@/lib/utils";

export function LegalDocumentPage({
  title,
  intro,
  sections,
  sibling,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  sibling: { label: string; href: string };
}) {
  return (
    <>
      <section className="section-pad bg-gradient-to-b from-cream to-surface pb-10 md:pb-14">
        <div className="container-main max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-label-sm text-primary mb-3">{SITE.name}</p>
            <h1 className="text-display-lg text-primary mb-4">{title}</h1>
            <p className="text-body-lg text-muted">{intro}</p>
            <p className="mt-4 text-sm text-muted">Last updated: {LEGAL_LAST_UPDATED}</p>
          </motion.div>
        </div>
      </section>

      <section className="section-pad pt-0 pb-16 md:pb-24">
        <div className="container-main max-w-3xl">
          <nav
            aria-label="On this page"
            className="mb-10 rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card"
          >
            <p className="text-label-sm text-muted mb-3">Contents</p>
            <ol className="columns-1 gap-x-8 text-sm sm:columns-2">
              {sections.map((section) => (
                <li key={section.id} className="mb-2 break-inside-avoid">
                  <a
                    href={`#${section.id}`}
                    className="text-brand-green underline-offset-2 hover:underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.02 }}
                className={cn(
                  "scroll-mt-28 rounded-2xl border border-outline/40 bg-white/70 p-6 shadow-card sm:p-8",
                )}
              >
                <h2 className="text-headline-md text-coffee-dark">{section.title}</h2>
                <div className="mt-4 space-y-3 text-body-md text-on-surface-variant">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.bullets.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-brand-green/20 bg-brand-green/8 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-coffee-dark">
              Also read our{" "}
              <Link to={sibling.href} className="font-medium text-brand-green hover:underline">
                {sibling.label}
              </Link>
              .
            </p>
            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Contact {SITE.name}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
