/**
 * Site imagery — local files in `public/Images/` (see `siteAssets.ts`).
 */

import { getMenuStockImageUrl, isBrokenMenuImageUrl } from "./menuStockImages";
import { SITE_HERO_FLOAT_SRC, SITE_MEDIA } from "./siteAssets";
import type { MenuCategory } from "./content";

export const REF_HERO_VIDEO = SITE_MEDIA.heroVideo;

/** CTA band background — same hero footage */
export const REF_CONVERSION_VIDEO = SITE_MEDIA.heroVideo;

export const REF_HERITAGE_IMAGE = SITE_MEDIA.heritage.src;
export const REF_HERITAGE_SIZE = SITE_MEDIA.heritage;

/** About page + highlight “Seasonal” card — coffee beans */
export const REF_COFFEE_BEANS_IMAGE = SITE_MEDIA.coffeeBeans.src;
export const REF_COFFEE_BEANS_SIZE = SITE_MEDIA.coffeeBeans;

/** Decorative animated coffee-bean stickers around the hero headline */
export const REF_HERO_FLOATS = [
  {
    src: SITE_HERO_FLOAT_SRC.beanA,
    width: 42,
    height: 54,
    top: "calc(41.4778% - 27px)",
    left: "calc(10.6667% - 21px)",
    rotate: 0,
    rotateMd: -52,
    delay: 1.5,
    floatDuration: 4.5,
    shadow: "drop-shadow(hero-float)",
  },
  {
    src: SITE_HERO_FLOAT_SRC.beanA,
    width: 42,
    height: 54,
    top: "calc(18.8917% - 27px)",
    left: "calc(14.8333% - 21px)",
    rotate: 30,
    delay: 1.6,
    floatDuration: 4.8,
    shadow: "drop-shadow(hero-float)",
  },
  {
    src: SITE_HERO_FLOAT_SRC.beanA,
    width: 42,
    height: 54,
    top: "calc(24.0974% - 27px)",
    left: "calc(85.5833% - 21px)",
    rotate: 191,
    rotateMd: 207,
    delay: 1.7,
    floatDuration: 5.1,
    shadow: "drop-shadow(hero-float-up)",
  },
  {
    src: SITE_HERO_FLOAT_SRC.beanB,
    width: 42,
    height: 42,
    top: "calc(31.4022% - 21px)",
    left: "calc(23.3333% - 21px)",
    rotate: 0,
    delay: 1.7,
    floatDuration: 4.2,
    shadow: "drop-shadow(hero-float-soft)",
  },
  {
    src: SITE_HERO_FLOAT_SRC.beanC,
    width: 62,
    height: 63,
    top: "calc(40.6381% - 31.5px)",
    left: "calc(89.5833% - 31px)",
    rotate: 0,
    rotateMd: -75,
    delay: 1.5,
    floatDuration: 5.4,
    shadow: "drop-shadow(hero-float)",
  },
  {
    src: SITE_HERO_FLOAT_SRC.beanD,
    width: 50,
    height: 36,
    top: "calc(42.3174% - 18px)",
    left: "calc(55.5833% - 25px)",
    rotate: 0,
    delay: 1.8,
    floatDuration: 4.6,
    shadow: "drop-shadow(hero-float)",
    hiddenTablet: true,
  },
] as const;

export const REF_HIGHLIGHT_CARDS = SITE_MEDIA.highlights.map((h) => ({
  src: h.src,
  alt: h.alt,
  objectPosition: "center" as const,
  width: h.width,
  height: h.height,
}));

export const REF_ABOUT_MOSAIC_IMAGES = [
  {
    src: SITE_MEDIA.highlights[0].src,
    alt: SITE_MEDIA.highlights[0].alt,
    width: SITE_MEDIA.highlights[0].width,
    height: SITE_MEDIA.highlights[0].height,
  },
  {
    src: SITE_MEDIA.highlights[1].src,
    alt: SITE_MEDIA.highlights[1].alt,
    width: SITE_MEDIA.highlights[1].width,
    height: SITE_MEDIA.highlights[1].height,
  },
  {
    src: SITE_MEDIA.heritage.src,
    alt: "Our heritage",
    width: SITE_MEDIA.heritage.width,
    height: SITE_MEDIA.heritage.height,
  },
  {
    src: SITE_MEDIA.highlights[2].src,
    alt: SITE_MEDIA.highlights[2].alt,
    width: SITE_MEDIA.highlights[2].width,
    height: SITE_MEDIA.highlights[2].height,
  },
] as const;

/** Admin / Convex custom URL first, then open-stock photo by item name. */
export function resolveMenuImageUrl(
  name: string,
  imageUrl?: string,
  category?: MenuCategory,
) {
  const custom = imageUrl?.trim();
  if (custom && !isBrokenMenuImageUrl(custom)) return custom;
  return getMenuStockImageUrl(name, category);
}

/** Ambience gallery — variety without repeating beans shot */
export const REF_AMBIENCE_IMAGES = [
  {
    src: SITE_MEDIA.highlights[0].src,
    rotate: -10,
    x: 188,
    width: SITE_MEDIA.highlights[0].width,
    height: SITE_MEDIA.highlights[0].height,
  },
  {
    src: SITE_MEDIA.heritage.src,
    rotate: 0,
    x: 0,
    width: SITE_MEDIA.heritage.width,
    height: SITE_MEDIA.heritage.height,
  },
  {
    src: SITE_MEDIA.menuFood[0].src,
    rotate: 10,
    x: -188,
    width: SITE_MEDIA.menuFood[0].width,
    height: SITE_MEDIA.menuFood[0].height,
  },
  {
    src: SITE_MEDIA.highlights[2].src,
    rotate: -10,
    x: 188,
    width: SITE_MEDIA.highlights[2].width,
    height: SITE_MEDIA.highlights[2].height,
  },
  {
    src: SITE_MEDIA.highlights[1].src,
    rotate: 0,
    x: 0,
    width: SITE_MEDIA.highlights[1].width,
    height: SITE_MEDIA.highlights[1].height,
  },
  {
    src: SITE_MEDIA.menuFood[1].src,
    rotate: 10,
    x: -188,
    width: SITE_MEDIA.menuFood[1].width,
    height: SITE_MEDIA.menuFood[1].height,
  },
];

export const REF_WORKSPACE_IMAGE = SITE_MEDIA.workspace.src;
export const REF_WORKSPACE_SIZE = SITE_MEDIA.workspace;

export const REF_FOOTER_BG_IMAGE = SITE_MEDIA.footer.src;
export const REF_FOOTER_SIZE = SITE_MEDIA.footer;

export const REF_FOOTER_LOGO = "/logos/logo.jpg";

export const REF_MENU_PAGE_BANNER = SITE_MEDIA.heritage.src;
export const REF_MENU_PAGE_BANNER_SIZE = SITE_MEDIA.heritage;
