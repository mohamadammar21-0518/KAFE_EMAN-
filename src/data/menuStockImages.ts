import type { MenuCategory } from "@/data/content";

/**
 * Open stock photos per menu item (Pexels + Unsplash).
 * License: Pexels https://www.pexels.com/license/ · Unsplash https://unsplash.com/license
 * URLs are hotlink-friendly CDN links verified to return 200.
 */

/** Pexels CDN — `id` from pexels.com/photo/… */
function pexels(id: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop`;
}

/** Unsplash CDN — full slug e.g. photo-1509042239860-f550ce710b93 */
function unsplash(photoId: string) {
  return `https://images.unsplash.com/${photoId}?w=800&h=800&q=80&auto=format&fit=crop`;
}

export const MENU_ITEM_STOCK_IMAGES: Record<string, string> = {
  "Signature Espresso": unsplash("photo-1509042239860-f550ce710b93"),
  "Velvet Caramel Latte": pexels(312289),
  "Classic Cappuccino": pexels(302896),
  "Artisan Cold Brew": pexels(266287),
  "Vanilla Cloud Latte": pexels(376464),
  "Hazelnut Delight": pexels(1028216),
  "Rose Almond Latte": pexels(1893556),
  "Honey Cinnamon Latte": pexels(1006990),
  "Matcha Harmony": pexels(713047),
  "Earl Grey Supreme": pexels(1416439),
  "Chamomile Blossom": pexels(208994),
  "Jasmine Green Tea": pexels(230477),
  "Blueberry Muffin": pexels(1132558),
  "Butter Croissant": pexels(1775043),
  "Classic Cheesecake": pexels(291528),
  "Tiramisu Classico": pexels(452516),
  "Classic Omelette Plate": pexels(1095550),
  "Cheese Croissant Sandwich": pexels(209206),
  "Avocado Toast": pexels(1024511),
  "Truffle Scrambled Eggs": pexels(5710148),
};

const CATEGORY_STOCK_IMAGES: Record<MenuCategory, string> = {
  signature: unsplash("photo-1509042239860-f550ce710b93"),
  lattes: pexels(312289),
  "tea-matcha": pexels(1416439),
  "bakery-dessert": pexels(1775043),
  breakfast: pexels(1095550),
};

const DEFAULT_MENU_STOCK_IMAGE = unsplash("photo-1509042239860-f550ce710b93");

/** Reject empty or legacy broken Unsplash links (invalid photo ids). */
export function isBrokenMenuImageUrl(url: string | undefined): boolean {
  const u = url?.trim();
  if (!u) return true;
  if (u.startsWith("/Images/")) return false;
  if (u.includes("images.unsplash.com/photo-1514433522367")) return true;
  if (u.includes("images.unsplash.com/photo-1495474472287")) return true;
  return false;
}

export function getMenuStockImageUrl(
  name: string,
  category?: MenuCategory,
): string {
  const byName = MENU_ITEM_STOCK_IMAGES[name.trim()];
  if (byName) return byName;
  if (category && CATEGORY_STOCK_IMAGES[category]) {
    return CATEGORY_STOCK_IMAGES[category];
  }
  return DEFAULT_MENU_STOCK_IMAGE;
}
