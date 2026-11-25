/** Keep normalization rules in sync with `src/lib/entityIds.ts`. */

export const STATIC_MENU_ID_PREFIX = "static:menu:";

export function isStaticMenuItemId(id: string): boolean {
  return id.startsWith(STATIC_MENU_ID_PREFIX);
}

export function isConvexDocumentId(id: string): boolean {
  const t = id.trim();
  if (!t || t.includes(":")) return false;
  if (/^\d+$/.test(t)) return false;
  return /^[a-z0-9_]+$/i.test(t) && t.length >= 10;
}

const LEGACY_NUMERIC_MENU_ID_MAP: Record<string, string> = {
  "1": `${STATIC_MENU_ID_PREFIX}signature-espresso`,
  "2": `${STATIC_MENU_ID_PREFIX}velvet-caramel-latte`,
  "3": `${STATIC_MENU_ID_PREFIX}classic-cappuccino`,
  "4": `${STATIC_MENU_ID_PREFIX}artisan-cold-brew`,
  "5": `${STATIC_MENU_ID_PREFIX}vanilla-cloud-latte`,
  "6": `${STATIC_MENU_ID_PREFIX}hazelnut-delight`,
  "7": `${STATIC_MENU_ID_PREFIX}rose-almond-latte`,
  "8": `${STATIC_MENU_ID_PREFIX}honey-cinnamon-latte`,
  "9": `${STATIC_MENU_ID_PREFIX}matcha-harmony`,
  "10": `${STATIC_MENU_ID_PREFIX}earl-grey-supreme`,
  "11": `${STATIC_MENU_ID_PREFIX}chamomile-blossom`,
  "12": `${STATIC_MENU_ID_PREFIX}jasmine-green-tea`,
  "13": `${STATIC_MENU_ID_PREFIX}blueberry-muffin`,
  "14": `${STATIC_MENU_ID_PREFIX}butter-croissant`,
  "15": `${STATIC_MENU_ID_PREFIX}classic-cheesecake`,
  "16": `${STATIC_MENU_ID_PREFIX}tiramisu-classico`,
  "17": `${STATIC_MENU_ID_PREFIX}classic-omelette-plate`,
  "18": `${STATIC_MENU_ID_PREFIX}cheese-croissant-sandwich`,
  "19": `${STATIC_MENU_ID_PREFIX}avocado-toast`,
  "20": `${STATIC_MENU_ID_PREFIX}truffle-scrambled-eggs`,
};

export function normalizeMenuItemId(id: string | undefined | null): string | undefined {
  const t = id?.trim();
  if (!t) return undefined;
  if (isStaticMenuItemId(t)) return t;
  if (LEGACY_NUMERIC_MENU_ID_MAP[t]) return LEGACY_NUMERIC_MENU_ID_MAP[t];
  if (isConvexDocumentId(t)) return t;
  return t;
}
