import { useBranch } from "@/branch/BranchContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ContactInfoGrid } from "@/components/ui/InfoCard";
import { Button } from "@/components/ui/Button";
import { FormSuccessModal } from "@/components/ui/FormSuccessModal";
import { hasConvex } from "@/providers/AppProviders";

const CONTACT_SUCCESS_MESSAGE =
  "You have successfully sent your message. We will get back to you soon — thanks for your patience.";

export function ContactPage() {
  const { branches, branchId } = useBranch();
  const address = branches.find((branch) => branch.id === branchId)?.address ?? "Kafe Eman Alor Setar";
  const submitMessage = useMutation(api.contactMessages.submit);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasConvex()) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await submitMessage({
        name,
        email,
        phone: phone || undefined,
        subject: subject || undefined,
        message,
      });
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      setStatus("success");
      setShowSuccessModal(true);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <section className="page-intro section-pad bg-gradient-to-b from-cream to-surface">
        <div className="container-main text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-heading text-display-lg text-primary mb-4">Get In Touch</h1>
            <p className="text-body-lg text-muted">
              Reach out for partnerships, questions, or support. We typically respond within 24
              hours.
            </p>
          </motion.div>
        </div>
        <img className="page-intro-image" src="/Images/eman-table.webp" alt="A table by the café window" decoding="async" />
      </section>

      <section className="py-12 md:py-16">
        <div className="container-main">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="hover-lift hover-glow rounded-2xl border border-outline-variant/40 bg-white/60 p-6 shadow-card backdrop-blur-md md:p-8">
              <p className="text-label-sm text-sand mb-2">Send a message</p>
              <h2 className="text-headline-md text-coffee-dark mb-6">Start the conversation</h2>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-coffee-dark"><span>Full name</span><input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white/70 px-4 py-3 text-sm outline-none transition-colors hover:border-outline/50 focus:border-brand-green/40"
                    aria-label="Full name"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  /></label>
                  <label className="grid gap-2 text-sm font-medium text-coffee-dark"><span>Email</span><input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white/70 px-4 py-3 text-sm outline-none transition-colors hover:border-outline/50 focus:border-brand-green/40"
                    aria-label="Email"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  /></label>
                  <label className="grid gap-2 text-sm font-medium text-coffee-dark"><span>Phone <span className="font-normal text-muted">(optional)</span></span><input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white/70 px-4 py-3 text-sm outline-none transition-colors hover:border-outline/50 focus:border-brand-green/40"
                    aria-label="Phone"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  /></label>
                  <label className="grid gap-2 text-sm font-medium text-coffee-dark"><span>Subject <span className="font-normal text-muted">(optional)</span></span><input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white/70 px-4 py-3 text-sm outline-none transition-colors hover:border-outline/50 focus:border-brand-green/40"
                    aria-label="Subject"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  /></label>
                </div>

                <label className="grid gap-2 text-sm font-medium text-coffee-dark"><span>Message</span><textarea
                  className="w-full min-h-[140px] resize-none rounded-xl border border-outline-variant/40 bg-white/70 px-4 py-3 text-sm outline-none transition-colors hover:border-outline/50 focus:border-brand-green/40"
                  aria-label="Message"
                    placeholder="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                /></label>

                {status === "success" && !showSuccessModal && (
                  <p className="rounded-xl border border-brand-green/25 bg-brand-green/8 px-4 py-3 text-body-md text-coffee-dark">
                    Your message was submitted successfully. We will get back to you soon — thanks
                    for your patience.
                  </p>
                )}
                {status === "error" && (
                  <p className="text-body-md text-error">
                    Could not send message. Please try again later.
                  </p>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full justify-center"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Sending…" : "Send message"}
                  </Button>
                </div>
              </form>

              <FormSuccessModal
                open={showSuccessModal}
                onClose={() => {
                  setShowSuccessModal(false);
                  setStatus("idle");
                }}
                title="Message received"
                message={CONTACT_SUCCESS_MESSAGE}
                titleId="contact-success-title"
              />
            </div>

            <div className="hover-lift hover-glow rounded-2xl border border-outline-variant/40 bg-white/60 p-6 shadow-card backdrop-blur-md md:p-8">
              <p className="text-label-sm text-sand mb-2">Contact information</p>
              <h2 className="text-headline-md text-coffee-dark mb-6">We’d love to hear from you</h2>
              <ContactInfoGrid layout="compact" />
            </div>
          </div>

          <div className="hover-lift hover-glow mt-8 overflow-hidden rounded-2xl border border-outline-variant/40 bg-white/60 shadow-card">
            <iframe
              title="Kafe Eman map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="h-[320px] w-full border-0 md:h-[400px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
