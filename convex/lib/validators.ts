import { v } from "convex/values";

/** Branch slug (e.g. alor-setar) — used on orders, reservations, and menu. */
export const branchSlug = v.string();

/** @deprecated Legacy fixed menu categories from initial seed */
export const legacyMenuCategory = v.union(
  v.literal("signature"),
  v.literal("lattes"),
  v.literal("tea-matcha"),
  v.literal("bakery-dessert"),
  v.literal("breakfast"),
);

export const orderStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("preparing"),
  v.literal("ready"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const paymentStatus = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("refunded"),
  v.literal("failed"),
);

export const reservationStatus = v.union(
  v.literal("pending"),
  v.literal("progressing"),
  v.literal("cancelled"),
  v.literal("closed"),
  /** @deprecated Migrated to progressing */
  v.literal("confirmed"),
  /** @deprecated Migrated to cancelled */
  v.literal("rejected"),
);

export const reservationClosureOutcome = v.union(
  v.literal("followed_up"),
  v.literal("completed"),
  v.literal("no_show"),
  v.literal("other"),
);

export const contactMessageStatus = v.union(
  v.literal("pending"),
  v.literal("read"),
  v.literal("archived"),
);

export const testimonialStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
);

/** `client` = Clerk guest feedback; `staff` = added in admin panel (Actual tab). */
export const testimonialSource = v.union(v.literal("client"), v.literal("staff"));

export const testimonialTargetType = v.union(
  v.literal("all"),
  v.literal("category"),
  v.literal("menuItem"),
);

/** Snapshot at checkout — `menuItemId` is Convex `menuItems` id or `static:menu:…` for demo data. */
export const orderLineItem = v.object({
  menuItemId: v.optional(v.string()),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
});

/** Super admin: full access. Staff: no deletes, cannot manage staff accounts. */
export const adminRole = v.union(v.literal("superadmin"), v.literal("staff"));

export const couponType = v.union(v.literal("free_drink"), v.literal("free_order"));

export type CouponTypeValue = "free_drink" | "free_order";

/** Checkout payment method — stored on `orders.paymentMethod`. */
export const paymentMethod = v.union(
  v.literal("card"),
  v.literal("cash"),
  v.literal("other"),
);

export const financePeriod = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("yearly"),
);
