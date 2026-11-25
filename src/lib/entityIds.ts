/**
 * Canonical ID rules for Kafe Eman:
 *
 * - Convex documents: `_id` from the database (menuItems, users, orders, …).
 * - Static fallback data: prefixed strings so they never collide with Convex ids or each other.
 * - Public references: `orderNumber` (ORD-…), `referenceId` on contact messages (MSG-…).
 * - Auth: Clerk `subject` stored as `clerkUserId`; Convex `users._id` is the customer profile id.
 */

export const STATIC_MENU_ID_PREFIX = "static:menu:";
export const STATIC_TEAM_ID_PREFIX = "static:team:";
export const STATIC_FAQ_ID_PREFIX = "static:faq:";
export const STATIC_STAT_ID_PREFIX = "static:stat:";

export function staticMenuItemId(slug: string): string {
  return `${STATIC_MENU_ID_PREFIX}${slug}`;
}

export function staticTeamMemberId(slug: string): string {
  return `${STATIC_TEAM_ID_PREFIX}${slug}`;
}

export function staticFaqId(slug: string): string {
  return `${STATIC_FAQ_ID_PREFIX}${slug}`;
}

export function staticStatId(slug: string): string {
  return `${STATIC_STAT_ID_PREFIX}${slug}`;
}

export function isStaticMenuItemId(id: string): boolean {
  return id.startsWith(STATIC_MENU_ID_PREFIX);
}

/** Convex document ids are lowercase alphanumeric (no colons). */
export function isConvexDocumentId(id: string): boolean {
  const t = id.trim();
  if (!t || t.includes(":")) return false;
  if (/^\d+$/.test(t)) return false;
  return /^[a-z0-9_]+$/i.test(t) && t.length >= 10;
}

/** Maps old numeric static menu ids (and legacy cart rows) to namespaced ids. */
export const LEGACY_NUMERIC_MENU_ID_MAP: Record<string, string> = {
  "1": staticMenuItemId("signature-espresso"),
  "2": staticMenuItemId("velvet-caramel-latte"),
  "3": staticMenuItemId("classic-cappuccino"),
  "4": staticMenuItemId("artisan-cold-brew"),
  "5": staticMenuItemId("vanilla-cloud-latte"),
  "6": staticMenuItemId("hazelnut-delight"),
  "7": staticMenuItemId("rose-almond-latte"),
  "8": staticMenuItemId("honey-cinnamon-latte"),
  "9": staticMenuItemId("matcha-harmony"),
  "10": staticMenuItemId("earl-grey-supreme"),
  "11": staticMenuItemId("chamomile-blossom"),
  "12": staticMenuItemId("jasmine-green-tea"),
  "13": staticMenuItemId("blueberry-muffin"),
  "14": staticMenuItemId("butter-croissant"),
  "15": staticMenuItemId("classic-cheesecake"),
  "16": staticMenuItemId("tiramisu-classico"),
  "17": staticMenuItemId("classic-omelette-plate"),
  "18": staticMenuItemId("cheese-croissant-sandwich"),
  "19": staticMenuItemId("avocado-toast"),
  "20": staticMenuItemId("truffle-scrambled-eggs"),
};

export function normalizeMenuItemId(id: string | undefined | null): string | undefined {
  const t = id?.trim();
  if (!t) return undefined;
  if (isStaticMenuItemId(t)) return t;
  if (LEGACY_NUMERIC_MENU_ID_MAP[t]) return LEGACY_NUMERIC_MENU_ID_MAP[t];
  if (isConvexDocumentId(t)) return t;
  return t;
}

type LegacyCartLine = {
  id?: string;
  menuItemId?: string;
  name: string;
  price: number;
  currency?: string;
  quantity: number;
};

/** Upgrades cart rows saved before `menuItemId` was introduced. */
export function normalizeCartLine<T extends LegacyCartLine>(
  line: T,
): Omit<T, "id"> & { menuItemId: string } {
  const raw = line.menuItemId ?? line.id ?? "";
  const menuItemId = normalizeMenuItemId(raw);
  if (!menuItemId) {
    throw new Error("Cart line is missing a menu item id.");
  }
  const normalized = { ...line, menuItemId };
  delete normalized.id;
  return normalized;
}

export function normalizeCartLines<T extends LegacyCartLine>(lines: T[]) {
  const out: Array<Omit<T, "id"> & { menuItemId: string }> = [];
  for (const line of lines) {
    try {
      out.push(normalizeCartLine(line));
    } catch {
      // Drop corrupted rows from localStorage
    }
  }
  return out;
}
