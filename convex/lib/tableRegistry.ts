import type { TableNames } from "../_generated/dataModel";

export type AppTableArea = "storefront" | "admin" | "auth" | "both";

export type AppTableGroup =
  | "locations-menu"
  | "storefront-content"
  | "commerce"
  | "customers"
  | "admin-auth"
  | "engagement";

export type AppTableMeta = {
  label: string;
  group: AppTableGroup;
  area: AppTableArea;
  /** Primary Convex module(s) — public `api.*` paths */
  modules: string[];
  /** Admin sidebar route when applicable */
  adminRoute?: string;
  features: string[];
};

/**
 * Canonical map: every Convex table in `schema.ts`.
 * TypeScript requires an entry for each `TableNames` value.
 */
export const APP_TABLES: Record<TableNames, AppTableMeta> = {
  branches: {
    label: "Branches",
    group: "locations-menu",
    area: "both",
    modules: ["branches", "menuCatalog"],
    adminRoute: "/admin/branches",
    features: [
      "Per-branch menu catalog and currency",
      "Storefront branch picker",
      "Scopes orders, reservations, users",
    ],
  },
  menuCategories: {
    label: "Menu categories",
    group: "locations-menu",
    area: "both",
    modules: ["menuCategories", "menuCatalog"],
    adminRoute: "/admin/menu",
    features: ["Menu sections per branch", "Linked from menuItems.categoryId"],
  },
  menuItems: {
    label: "Menu items",
    group: "locations-menu",
    area: "both",
    modules: ["menuItems", "menuItemsAdmin", "menuCatalog"],
    adminRoute: "/admin/menu",
    features: [
      "Catalog rows: branchSlug + categoryId",
      "Legacy seed rows (isLegacy) hidden after migration",
      "Cart checkout line snapshots",
    ],
  },
  teamMembers: {
    label: "Team members",
    group: "storefront-content",
    area: "storefront",
    modules: ["teamMembers"],
    features: ["About page team grid"],
  },
  stats: {
    label: "Stats",
    group: "storefront-content",
    area: "storefront",
    modules: ["stats"],
    features: ["Home / About stat strips"],
  },
  faqs: {
    label: "FAQs",
    group: "storefront-content",
    area: "both",
    modules: ["faqs", "faqsAdmin"],
    adminRoute: "/admin/faqs",
    features: ["Public FAQ accordion", "active flag filters storefront list"],
  },
  siteSettings: {
    label: "Site settings",
    group: "storefront-content",
    area: "both",
    modules: ["siteSettings"],
    adminRoute: "/admin/content",
    features: ["Single global row (key: global)", "Footer and contact page info"],
  },
  contactMessages: {
    label: "Contact messages",
    group: "engagement",
    area: "both",
    modules: ["contactMessages"],
    adminRoute: "/admin/messages",
    features: ["Contact form submissions", "MSG-… reference ids"],
  },
  testimonials: {
    label: "Testimonials",
    group: "engagement",
    area: "both",
    modules: ["testimonials"],
    adminRoute: "/admin/testimonials",
    features: [
      "Clerk users submit feedback (pending)",
      "Admin accept → home carousel (accepted)",
      "Optional Convex file storage for photos",
    ],
  },
  reservations: {
    label: "Reservations",
    group: "commerce",
    area: "both",
    modules: ["reservations"],
    adminRoute: "/admin/reservations",
    features: [
      "Table booking form",
      "Status: pending → progressing → closed | cancelled",
    ],
  },
  orders: {
    label: "Orders",
    group: "commerce",
    area: "both",
    modules: ["orders"],
    adminRoute: "/admin/orders",
    features: [
      "Checkout ORD-… order numbers",
      "Loyalty pointsEarned on paid/completed",
      "Coupons, payment method snapshots",
      "Admin: Orders, Finance, client order history",
    ],
  },
  coupons: {
    label: "Coupons",
    group: "commerce",
    area: "both",
    modules: ["users"],
    features: [
      "Loyalty rewards (free_drink)",
      "KE-… codes at checkout",
      "40 points → auto issue",
    ],
  },
  admins: {
    label: "Staff accounts",
    group: "admin-auth",
    area: "auth",
    modules: ["admins"],
    adminRoute: "/admin/staff",
    features: [
      "Panel login (NOT Clerk)",
      "superadmin: full access + delete",
      "staff: no delete, no staff CRUD",
    ],
  },
  adminSessions: {
    label: "Admin sessions",
    group: "admin-auth",
    area: "auth",
    modules: ["admins"],
    features: ["Bearer adminToken after login", "7-day TTL"],
  },
  users: {
    label: "Clients (customers)",
    group: "customers",
    area: "both",
    modules: ["users", "admins"],
    adminRoute: "/admin/clients",
    features: [
      "Clerk identity → syncProfile",
      "Loyalty points, suspension, home branch",
      "Onboarding + phone verification",
    ],
  },
  userFavorites: {
    label: "User favourites",
    group: "customers",
    area: "both",
    modules: ["userFavorites"],
    features: ["Menu heart toggle", "Account favourites list"],
  },
  phoneVerifications: {
    label: "Phone verifications",
    group: "customers",
    area: "auth",
    modules: ["users"],
    features: ["Onboarding SMS-style codes (10 min TTL)"],
  },
  aiThreads: {
    label: "AI chat threads",
    group: "engagement",
    area: "storefront",
    modules: ["ai/userChat", "ai/chat"],
    features: ["One thread per customer conversation", "Linked to users table"],
  },
  aiMessages: {
    label: "AI chat messages",
    group: "engagement",
    area: "storefront",
    modules: ["ai/userChat", "ai/chat"],
    features: ["Chat history per thread", "Roles: user | assistant | system"],
  },
  aiNotifications: {
    label: "AI notifications",
    group: "engagement",
    area: "admin",
    modules: ["ai/notifications", "ai/adminAlert"],
    adminRoute: "/admin/orders",
    features: ["Admin order alerts", "New order and order ready notifications"],
  },
  aiOrderInsights: {
    label: "AI order insights",
    group: "engagement",
    area: "admin",
    modules: ["ai/onOrderAccepted"],
    features: ["GROQ analysis on order accept", "Personalized ready message prep"],
  },
  aiNotificationLog: {
    label: "AI notification log",
    group: "engagement",
    area: "admin",
    modules: ["ai/notifyCustomer"],
    features: ["Twilio SMS log", "VAPI voice call log", "Delivery tracking"],
  },
};

export const APP_TABLE_NAMES = Object.keys(APP_TABLES) as TableNames[];

export const APP_TABLE_GROUP_LABELS: Record<AppTableGroup, string> = {
  "locations-menu": "Locations & menu",
  "storefront-content": "Website content",
  commerce: "Orders & bookings",
  customers: "Customers & loyalty",
  "admin-auth": "Admin panel auth",
  engagement: "Guest engagement",
};

/** Tables grouped for docs and health UI */
export function tablesByGroup(): Array<{
  group: AppTableGroup;
  label: string;
  tables: TableNames[];
}> {
  const map = new Map<AppTableGroup, TableNames[]>();
  for (const name of APP_TABLE_NAMES) {
    const group = APP_TABLES[name].group;
    const list = map.get(group) ?? [];
    list.push(name);
    map.set(group, list);
  }
  return (Object.keys(APP_TABLE_GROUP_LABELS) as AppTableGroup[]).map((group) => ({
    group,
    label: APP_TABLE_GROUP_LABELS[group],
    tables: map.get(group) ?? [],
  }));
}
