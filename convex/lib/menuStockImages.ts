/** Keep in sync with `src/data/menuStockImages.ts` (Convex cannot import from src). */

function pexels(id: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop`;
}

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

export function getMenuStockImageUrl(name: string): string {
  return (
    MENU_ITEM_STOCK_IMAGES[name.trim()] ??
    unsplash("photo-1509042239860-f550ce710b93")
  );
}
