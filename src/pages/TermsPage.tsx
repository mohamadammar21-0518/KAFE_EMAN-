import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { SITE } from "@/data/content";
import { TERMS_SECTIONS } from "@/data/legal";

export function TermsPage() {
  return (
    <LegalDocumentPage
      title="Terms & Conditions"
      intro={`These terms apply when you use the ${SITE.name} website, place orders, book tables, or manage your customer account. They are written for our guests in plain language while covering how our café services work online.`}
      sections={TERMS_SECTIONS}
      sibling={{ label: "Privacy Policy", href: "/privacy" }}
    />
  );
}
