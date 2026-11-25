/**
 * Local media in `/public/Images/` (served at `/Images/...`).
 */

export type ImageSize = { width: number; height: number };

export function siteImage(filename: string): string {
  return `/Images/${filename.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
}

/** Actual pixel dimensions of files in `public/Images/`. */
export const SITE_IMAGE_SIZES = {
  heritage: { width: 810, height: 1080 },
  elegantAmbience: { width: 960, height: 1280 },
  skilledBaristas: { width: 810, height: 1080 },
  seasonalBeans: { width: 810, height: 1080 },
  handcraftedCoffee: { width: 810, height: 1080 },
  workspace: { width: 608, height: 1080 },
  footer: { width: 810, height: 1080 },
  testimonial1: { width: 810, height: 1080 },
  testimonial2: { width: 810, height: 1080 },
  testimonial3: { width: 810, height: 1080 },
  testimonial4: { width: 960, height: 1280 },
  menuFood1: { width: 810, height: 1080 },
  menuFood2: { width: 810, height: 1080 },
} as const satisfies Record<string, ImageSize>;

const FILES = {
  /** Hero + CTA background video */
  heroVideo: "corect_video_Hero-seection.mp4",
  heritage: "Our Heritage.jpeg",
  /** Grinder / coffee beans — About “Premium Beans” + Seasonal highlight card */
  coffeeBeans: "Our Highlights1.jpeg",
  elegantAmbience: "Our Highlights2.jpeg",
  skilledBaristas: "Our Highlights3.jpeg",
  handcraftedCoffee: "Our Highlights4.jpeg",
  workspace: "Café workspace.jpeg",
  footer: "footer.jpeg",
  testimonial1: "Testmonial1.jpeg",
  testimonial2: "Testmonial2.jpeg",
  testimonial3: "Testmonial3.jpeg",
  testimonial4: "Testmonial4.jpeg",
  menuFood1: "WhatsApp Image 2026-06-01 at 14.39.46.jpeg",
  menuFood2: "WhatsApp Image 2026-06-01 at 14.39.46 (1).jpeg",
  /** Hero decorative coffee-bean stickers (from design ref) */
  heroBeanA: "hero-floats/hero-bean-a.png",
  heroBeanB: "hero-floats/hero-bean-b.png",
  heroBeanC: "hero-floats/hero-bean-c.png",
  heroBeanD: "hero-floats/hero-bean-d.png",
} as const;

export const SITE_HERO_FLOAT_SRC = {
  beanA: siteImage(FILES.heroBeanA),
  beanB: siteImage(FILES.heroBeanB),
  beanC: siteImage(FILES.heroBeanC),
  beanD: siteImage(FILES.heroBeanD),
} as const;

export const SITE_MEDIA = {
  heroVideo: siteImage(FILES.heroVideo),
  heritage: { src: siteImage(FILES.heritage), ...SITE_IMAGE_SIZES.heritage },
  coffeeBeans: {
    src: siteImage(FILES.coffeeBeans),
    alt: "Premium coffee beans at Kafe Eman",
    ...SITE_IMAGE_SIZES.seasonalBeans,
  },
  /** Order matches `HIGHLIGHTS` in content.ts (0–3) */
  highlights: [
    {
      src: siteImage(FILES.elegantAmbience),
      alt: "Elegant café ambience",
      ...SITE_IMAGE_SIZES.elegantAmbience,
    },
    {
      src: siteImage(FILES.handcraftedCoffee),
      alt: "Handcrafted coffee menu",
      ...SITE_IMAGE_SIZES.handcraftedCoffee,
    },
    {
      src: siteImage(FILES.skilledBaristas),
      alt: "Skilled baristas at work",
      ...SITE_IMAGE_SIZES.skilledBaristas,
    },
    {
      src: siteImage(FILES.coffeeBeans),
      alt: "Premium roasted coffee beans",
      ...SITE_IMAGE_SIZES.seasonalBeans,
    },
  ],
  workspace: { src: siteImage(FILES.workspace), ...SITE_IMAGE_SIZES.workspace },
  footer: { src: siteImage(FILES.footer), ...SITE_IMAGE_SIZES.footer },
  testimonials: [
    { src: siteImage(FILES.testimonial1), ...SITE_IMAGE_SIZES.testimonial1 },
    { src: siteImage(FILES.testimonial2), ...SITE_IMAGE_SIZES.testimonial2 },
    { src: siteImage(FILES.testimonial3), ...SITE_IMAGE_SIZES.testimonial3 },
    { src: siteImage(FILES.testimonial4), ...SITE_IMAGE_SIZES.testimonial4 },
  ],
  menuFood: [
    { src: siteImage(FILES.menuFood1), ...SITE_IMAGE_SIZES.menuFood1 },
    { src: siteImage(FILES.menuFood2), ...SITE_IMAGE_SIZES.menuFood2 },
  ],
} as const;

/** Brand mark in `public/logos/logo.jpg` */
export const SITE_LOGO = "/logos/logo.jpg";
