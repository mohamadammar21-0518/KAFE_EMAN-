import type { MenuCategory } from "@/data/content";

/** Maps admin menu category labels to legacy storefront category ids. */
export const CATEGORY_LABEL_TO_LEGACY: Record<string, MenuCategory> = {
  "Signature Coffee": "signature",
  "Speciality Lattes": "lattes",
  "Tea & Matcha": "tea-matcha",
  "Bakery & Desserts": "bakery-dessert",
  "Breakfast & Bites": "breakfast",
};
