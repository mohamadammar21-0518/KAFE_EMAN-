import { SITE, CONTACT_INFO } from "@/data/content";

export const LEGAL_LAST_UPDATED = "1 June 2026";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const businessName = SITE.name;
const contactEmail = CONTACT_INFO.email;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "1. Introduction",
    paragraphs: [
      `Welcome to ${businessName}. These Terms & Conditions ("Terms") govern your use of our website, mobile-friendly ordering experience, customer account, table reservations, loyalty programme, and related services (together, the "Services").`,
      `By browsing our site, creating an account, placing an order, or submitting a reservation, you agree to these Terms. If you do not agree, please do not use the Services.`,
      `${businessName} operates premium café locations in Malaysia. Branch hours, menus, and availability may vary by location.`,
    ],
  },
  {
    id: "orders",
    title: "2. Online orders & checkout",
    paragraphs: [
      "Menu items, prices, and availability are shown for your selected branch and may change without prior notice. We reserve the right to refuse or cancel an order if an item is unavailable, if pricing was displayed in error, or if we suspect fraud or abuse.",
      "When you place an order, you confirm that the items, quantities, branch, and contact details you provide are accurate. An order reference number will be shown after checkout; this helps us and you track the order in your account.",
      "Payment is taken or recorded at checkout according to the method you choose (for example card, cash at collection, or other methods we display). Your order is subject to confirmation and preparation by our team. Order status updates (such as accepted, preparing, ready, or delivered) appear in your account when our staff update them.",
    ],
    bullets: [
      "Prices are shown in the currency configured for your branch.",
      "Coupons and reward redemptions apply only when valid, not expired, and used according to programme rules.",
      "You are responsible for collecting or receiving your order at the branch you selected, unless we explicitly offer delivery.",
    ],
  },
  {
    id: "loyalty",
    title: "3. Rewards, points & coupons",
    paragraphs: [
      `${businessName} may offer a loyalty programme including welcome points, points for completed orders, and coupons (such as free drinks). Programme rules, thresholds, and expiry are shown in your account and may be updated from time to time.`,
      "Points and coupons have no cash value, are non-transferable, and may be adjusted or revoked if we reasonably believe there was misuse, error, or fraud.",
    ],
  },
  {
    id: "reservations",
    title: "4. Reservations",
    paragraphs: [
      "Table reservations submitted through our site are requests until confirmed by us. We may contact you by phone or email to confirm details. Please arrive on time; we may release your table if you are significantly late.",
      "By submitting a reservation you agree that we may use the contact details you provide to confirm or manage your booking.",
    ],
  },
  {
    id: "accounts",
    title: "5. Customer accounts",
    paragraphs: [
      "Some features (including checkout and order tracking) require a signed-in account. You are responsible for keeping your login credentials secure and for activity under your account.",
      "Profile information (such as name, email, phone, and delivery address) should be accurate and kept up to date so we can fulfil orders and contact you when needed.",
    ],
  },
  {
    id: "conduct",
    title: "6. Acceptable use",
    paragraphs: [
      "You agree not to misuse the Services, including by attempting unauthorised access, interfering with site operation, submitting false orders or reservations, or harassing our staff or other guests.",
      "We may suspend or terminate access to accounts that violate these Terms or applicable law.",
    ],
  },
  {
    id: "liability",
    title: "7. Limitation of liability",
    paragraphs: [
      `To the fullest extent permitted by applicable law, ${businessName} is not liable for indirect, incidental, or consequential losses arising from use of the Services. Our total liability for any claim relating to a specific order is limited to the amount you paid for that order, except where law requires otherwise.`,
      "Nothing in these Terms excludes liability that cannot be excluded under Malaysian law, including for death or personal injury caused by negligence or for fraud.",
    ],
  },
  {
    id: "changes",
    title: "8. Changes to these Terms",
    paragraphs: [
      "We may update these Terms from time to time. The \"Last updated\" date at the top of this page shows when they were last revised. Continued use of the Services after changes constitutes acceptance of the updated Terms.",
    ],
  },
  {
    id: "contact",
    title: "9. Contact",
    paragraphs: [
      `Questions about these Terms or your order may be sent via our contact page or to ${contactEmail}.`,
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "1. Overview",
    paragraphs: [
      `${businessName} ("we", "us") respects your privacy. This Privacy Policy explains what personal data we collect when you use our website and Services, how we use it, and your choices.`,
      "We process data to run our cafés, fulfil orders and reservations, operate loyalty rewards, and improve your experience. We collect only what we need for those purposes.",
    ],
  },
  {
    id: "data-we-collect",
    title: "2. Data we collect",
    paragraphs: ["Depending on how you use the Services, we may collect:"],
    bullets: [
      "Account details: name, email address, profile photo (from your sign-in provider), phone number, date of birth, and delivery address when you provide them.",
      "Order data: items ordered, branch, totals, payment method (and limited card details such as last four digits when you pay by card), order status, notes, coupons applied, and loyalty points earned.",
      "Reservation data: name, contact details, party size, date and time, branch, and special requests.",
      "Contact form messages: name, email, phone, subject, and message content.",
      "Technical data: basic device and usage information needed to operate and secure the site (for example through our hosting and authentication partners).",
    ],
  },
  {
    id: "how-we-use",
    title: "3. How we use your data",
    paragraphs: ["We use personal data to:"],
    bullets: [
      "Process and fulfil orders and reservations.",
      "Communicate with you about orders, bookings, or support requests.",
      "Operate your customer account, including order history and reward points.",
      "Verify your phone number when you complete profile onboarding.",
      "Prevent fraud, abuse, and security incidents.",
      "Comply with legal obligations and respond to lawful requests.",
    ],
  },
  {
    id: "legal-bases",
    title: "4. Legal bases",
    paragraphs: [
      "We rely on performance of a contract (for example fulfilling your order), legitimate interests (such as improving our service and securing our systems), and consent where required (for example marketing messages or optional profile steps you choose to complete).",
      "You may withdraw consent where applicable without affecting the lawfulness of processing before withdrawal.",
    ],
  },
  {
    id: "sharing",
    title: "5. Sharing & processors",
    paragraphs: [
      "We do not sell your personal data. We share data only with service providers that help us operate the Services, under contracts that require them to protect your information.",
      "These may include authentication providers (for secure sign-in), cloud database and hosting providers (to store orders and account data), and payment-related services where you choose to pay by card.",
      "We may disclose information if required by law or to protect the rights, safety, and property of our guests, staff, and business.",
    ],
  },
  {
    id: "retention",
    title: "6. Retention",
    paragraphs: [
      "We keep personal data for as long as needed to provide the Services, maintain your account and order history, meet legal and accounting requirements, and resolve disputes. When data is no longer needed, we delete or anonymise it where reasonably possible.",
    ],
  },
  {
    id: "security",
    title: "7. Security",
    paragraphs: [
      "We use administrative, technical, and organisational measures appropriate to the data we hold. No online service is completely secure; please use a strong password and keep your account credentials private.",
    ],
  },
  {
    id: "your-rights",
    title: "8. Your rights",
    paragraphs: [
      "Subject to applicable law (including Malaysian personal data protection requirements), you may request access to, correction of, or deletion of your personal data, or object to certain processing. You can update much of your profile in your account settings.",
      `To exercise other rights or ask questions, contact us at ${contactEmail} or via the contact page. We may need to verify your identity before responding.`,
    ],
  },
  {
    id: "children",
    title: "9. Children",
    paragraphs: [
      "Our Services are not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has provided us data, please contact us so we can delete it.",
    ],
  },
  {
    id: "cookies",
    title: "10. Cookies & similar technologies",
    paragraphs: [
      "We use essential cookies and similar technologies needed for sign-in, security, and site functionality. We do not use invasive tracking for advertising on this site unless we clearly tell you otherwise and obtain consent where required.",
    ],
  },
  {
    id: "changes-privacy",
    title: "11. Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. The \"Last updated\" date shows the latest revision. We encourage you to review this page periodically.",
    ],
  },
  {
    id: "contact-privacy",
    title: "12. Contact",
    paragraphs: [
      `For privacy enquiries or requests, email ${contactEmail} or use our contact page. Please include enough detail for us to identify your account or order if relevant.`,
    ],
  },
];
