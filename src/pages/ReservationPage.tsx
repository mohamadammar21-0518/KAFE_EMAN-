import { motion } from "framer-motion";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { ReservationForm } from "@/components/reservation/ReservationForm";
import { ReservationFormConvex } from "@/components/reservation/ReservationFormConvex";
import { useFaqs, hasConvex } from "@/hooks/useData";

export function ReservationPage() {
  const faqs = useFaqs();

  return (
    <>
      <section className="page-intro section-pad bg-gradient-to-b from-cream to-surface">
        <div className="container-main text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-heading text-display-lg text-primary mb-4">Make a reservation for your day</h1>
            <p className="text-body-lg text-muted">
              An invitation to experience timeless taste and elegant hospitality.
            </p>
          </motion.div>
        </div>
        <img className="page-intro-image" src="/Images/kafe-eman-header.webp" alt="Coffee and a croissant on a café table" decoding="async" />
      </section>

      <section className="py-12 md:py-20">
        <div className="container-main max-w-5xl">
          {hasConvex ? (
            <ReservationFormConvex />
          ) : (
            <ReservationForm
              onSubmit={async () => {
                await new Promise((resolve) => setTimeout(resolve, 400));
              }}
              offlineNote=" (Run `npx convex dev` and set VITE_CONVEX_URL to persist reservations.)"
            />
          )}
        </div>
      </section>

      <section className="section-pad bg-cream">
        <div className="container-main max-w-3xl">
          <SectionTitle
            eyebrow="Faq"
            title="Your Questions About Our Café Answered"
            align="center"
            titleColor="green"
            className="mb-10 mx-auto"
          />
          <FaqAccordion items={faqs} />
        </div>
      </section>
    </>
  );
}
