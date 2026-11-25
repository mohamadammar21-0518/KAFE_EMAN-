/** Canonical branches — shared by the storefront and branch seeders. */
export const DEFAULT_BRANCHES = [
  {
    slug: "alor-setar",
    label: "Alor Setar",
    subtitle: "Main · Barber Concept",
    address:
      "22-A Bawah, Taman Koperasi, Jalan Tun Razak, Taman Mutiara, 05200 Alor Setar, Kedah.",
    concept: "A unique 2-in-1 coffee shop and barbershop.",
    hours: ["Saturday: 3:00 PM – 10:00 PM", "Sunday – Friday: 11:00 AM – 11:00 PM"],
    currency: "MYR",
    sortOrder: 0,
  },
  {
    slug: "kepala-batas",
    label: "Kepala Batas",
    subtitle: "Kedah",
    address:
      "Rasa-Rasa Food Court, 2262, K287 Jalan Bukit Tinggi, Taman Kepala Batas, 06200 Kepala Batas, Kedah.",
    hours: ["Tuesday – Sunday: 5:00 PM – 11:00 PM", "Closed on Mondays"],
    currency: "MYR",
    sortOrder: 1,
  },
  {
    slug: "uum-sintok",
    label: "UUM Sintok",
    subtitle: "Universiti Utara Malaysia",
    address:
      "School of Business Management (SBM), Universiti Utara Malaysia, 06050 Changlun, Kedah.",
    hours: ["Monday – Friday: 9:00 AM – 11:00 PM", "Closed Saturday & Sunday"],
    currency: "MYR",
    sortOrder: 2,
  },
] as const;

export const DEFAULT_MENU_CATEGORY_LABELS = [
  "Signature Coffee",
  "Speciality Lattes",
  "Tea & Matcha",
  "Bakery & Desserts",
  "Breakfast & Bites",
] as const;

/** Maps admin category labels to legacy storefront category ids. */
export const CATEGORY_LABEL_TO_LEGACY: Record<string, string> = {
  "Signature Coffee": "signature",
  "Speciality Lattes": "lattes",
  "Tea & Matcha": "tea-matcha",
  "Bakery & Desserts": "bakery-dessert",
  "Breakfast & Bites": "breakfast",
};

export const LEGACY_CATEGORY_TO_LABEL: Record<string, string> = {
  signature: "Signature Coffee",
  lattes: "Speciality Lattes",
  "tea-matcha": "Tea & Matcha",
  "bakery-dessert": "Bakery & Desserts",
  breakfast: "Breakfast & Bites",
};

export const DEFAULT_SITE_SETTINGS = {
  location: "22-A Bawah, Taman Koperasi, Jalan Tun Razak, Taman Mutiara, 05200 Alor Setar, Kedah.",
  phone: "+001 234 567 890",
  email: "kafeeman@gmail.com",
  hours: "9:00 AM – 11:00 PM",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  xUrl: "https://x.com",
};
