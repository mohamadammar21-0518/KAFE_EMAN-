import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { SITE } from "@/data/content";
import { PRIVACY_SECTIONS } from "@/data/legal";

export function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      intro={`${SITE.name} explains here how we handle your personal information when you order, reserve a table, sign in, or contact us. We keep your data secure and use it only to run our cafés and improve your experience.`}
      sections={PRIVACY_SECTIONS}
      sibling={{ label: "Terms & Conditions", href: "/terms" }}
    />
  );
}
