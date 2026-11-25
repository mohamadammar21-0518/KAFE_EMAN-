import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  adminRole,
  branchSlug,
  contactMessageStatus,
  testimonialStatus,
  testimonialSource,
  testimonialTargetType,
  couponType,
  legacyMenuCategory,
  orderLineItem,
  orderStatus,
  paymentMethod,
  paymentStatus,
  reservationStatus,
  reservationClosureOutcome,
} from "./lib/validators";

/**
 * Kafe Eman — Convex schema (storefront + admin panel).
 *
 * Inventory: `npx convex run health:tableInventory` · Docs: `convex/SCHEMA.md`
 *
 * After schema or data-shape changes, sync existing rows:
 *   npm run convex:sync
 *   (or `npx convex dev --once && npx convex run migrations/runAll:run`)
 *
 * ── People (never mix these) ─────────────────────────────────────────────
 * | Table          | Who              | Auth        | Admin UI            |
 * |----------------|------------------|-------------|---------------------|
 * | admins         | Panel staff      | username/pw | Staff, My account   |
 * | adminSessions  | Active sessions  | adminToken  | (internal)          |
 * | users          | Website customers| Clerk       | Clients             |
 * | phoneVerifications | OTP codes  | Clerk       | (onboarding)        |
 *
 * ── Locations & menu ─────────────────────────────────────────────────────
 * branches, menuCategories, menuItems — per-branch catalog (`menuCatalog.byBranch`).
 * Legacy menu rows use `isLegacy`; catalog rows use `categoryId` + `branchSlug`.
 *
 * ── Commerce ─────────────────────────────────────────────────────────────
 * orders — ORD-… numbers, payment + status flows, coupon snapshots, loyalty.
 * reservations — pending → progressing → closed | cancelled.
 * coupons — loyalty rewards tied to `users`.
 *
 * ── Customers ────────────────────────────────────────────────────────────
 * userFavorites — saved menu hearts (snapshot fields).
 *
 * ── Website content ──────────────────────────────────────────────────────
 * teamMembers, stats, faqs, siteSettings (single global row).
 *
 * ── Guest engagement ─────────────────────────────────────────────────────
 * contactMessages — contact form (MSG-… refs).
 * testimonials — Clerk feedback → admin review → home carousel when accepted.
 *
 * Loyalty (`convex/lib/loyalty.ts`): +20 welcome · +10 per paid/completed order · 40 pts → coupon.
 */
export default defineSchema({
  /**
   * Store locations — admin: Branches; storefront: branch picker.
   * `slug` is the stable branch id used across menu, orders, users, and reservations.
   * `_id` is the Convex document id (shown in admin for reference).
   */
  branches: defineTable({
    slug: branchSlug,
    label: v.string(),
    subtitle: v.optional(v.string()),
    address: v.string(),
    concept: v.optional(v.string()),
    hours: v.array(v.string()),
    active: v.boolean(),
    sortOrder: v.number(),
    /** ISO 4217 code for menu prices, orders, and finance (default USD). */
    currency: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sort", ["sortOrder"])
    .index("by_active_sort", ["active", "sortOrder"]),

  /** Menu sections per branch — admin: Menu → categories */
  menuCategories: defineTable({
    branchSlug: branchSlug,
    label: v.string(),
    sortOrder: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_branch_sort", ["branchSlug", "sortOrder"])
    .index("by_branch_active", ["branchSlug", "active"]),

  /**
   * Menu products (one row = one product at one branch).
   * Catalog rows: branchSlug + categoryId + isLegacy false/undefined.
   * Legacy seed rows: isLegacy true — hidden after alignAppData migration.
   */
  menuItems: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    /** @deprecated Seed-only — use categoryId */
    category: v.optional(legacyMenuCategory),
    categoryId: v.optional(v.id("menuCategories")),
    branchSlug: v.optional(branchSlug),
    imageUrl: v.optional(v.string()),
    outOfStock: v.optional(v.boolean()),
    featured: v.boolean(),
    sortOrder: v.number(),
    /** @deprecated Seed-only */
    availableIn: v.optional(v.array(branchSlug)),
    isLegacy: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_category", ["category", "sortOrder"])
    .index("by_branch_sort", ["branchSlug", "sortOrder"])
    .index("by_category_id_sort", ["categoryId", "sortOrder"]),

  teamMembers: defineTable({
    name: v.string(),
    role: v.string(),
    sortOrder: v.number(),
  }).index("by_sort", ["sortOrder"]),

  stats: defineTable({
    value: v.number(),
    suffix: v.string(),
    label: v.string(),
    sortOrder: v.number(),
  }).index("by_sort", ["sortOrder"]),

  /** Public FAQ — admin: FAQ; storefront: FAQ sections */
  faqs: defineTable({
    question: v.string(),
    answer: v.string(),
    sortOrder: v.number(),
    active: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_sort", ["sortOrder"]),

  /** Contact page + footer — admin: Content & contact */
  siteSettings: defineTable({
    key: v.literal("global"),
    location: v.string(),
    phone: v.string(),
    email: v.string(),
    hours: v.string(),
    instagramUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    xUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  /** Get in touch form — admin: Get In Touch */
  contactMessages: defineTable({
    /** Public reference e.g. MSG-20260529-001 */
    referenceId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    status: contactMessageStatus,
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_reference", ["referenceId"])
    .index("by_created", ["createdAt"])
    .index("by_status_created", ["status", "createdAt"]),

  /**
   * Guest feedback / testimonials — storefront submit (Clerk); admin: Testimonials.
   * `accepted` rows appear in the home page testimonial carousel.
   */
  testimonials: defineTable({
    /** `client` = guest form; `staff` = admin panel (Actual). Defaults to client when unset (legacy). */
    source: v.optional(testimonialSource),
    userId: v.optional(v.id("users")),
    clerkUserId: v.optional(v.string()),
    authorName: v.string(),
    subtitle: v.optional(v.string()),
    rating: v.number(),
    text: v.string(),
    targetType: testimonialTargetType,
    categoryId: v.optional(v.id("menuCategories")),
    menuItemId: v.optional(v.id("menuItems")),
    /** Snapshot label e.g. category name or menu item name */
    targetLabel: v.optional(v.string()),
    branchSlug: v.optional(branchSlug),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    status: testimonialStatus,
    /** Required when status is rejected */
    rejectReason: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    createdByAdminId: v.optional(v.id("admins")),
    reviewedByAdminId: v.optional(v.id("admins")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_status_created", ["status", "createdAt"])
    .index("by_status_sort", ["status", "sortOrder"])
    .index("by_source_created", ["source", "createdAt"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_clerk", ["clerkUserId"]),

  /** Table bookings — admin: Reservations; storefront: reservation form */
  reservations: defineTable({
    clerkUserId: v.optional(v.string()),
    branchSlug: v.optional(branchSlug),
    /** @deprecated Use branchSlug — kept for documents created before migration */
    branchId: v.optional(branchSlug),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    date: v.string(),
    time: v.string(),
    guests: v.number(),
    notes: v.optional(v.string()),
    status: reservationStatus,
    /** Required when status is cancelled (e.g. guest cancelled, no availability). */
    statusReason: v.optional(v.string()),
    /** Set when status is closed — how the reservation was resolved. */
    closureOutcome: v.optional(reservationClosureOutcome),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_owner_created", ["clerkUserId", "createdAt"])
    .index("by_guest_email", ["clerkUserId", "email", "createdAt"])
    .index("by_created", ["createdAt"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_branch_created", ["branchSlug", "createdAt"]),

  /**
   * Admin panel accounts (Staff page). Username + password login.
   *
   * Roles (`adminRole` in validators.ts):
   * - superadmin — full access, can add/remove staff, can delete records
   * - staff — view/edit operations; cannot delete or manage other admins
   *
   * Self-service: getMyAccount / updateMyAccount / changeMyPassword (any active admin).
   * Cannot delete or deactivate your own row via staff management APIs.
   */
  admins: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    displayName: v.string(),
    /** Work email — invite staff, profile, uniqueness via by_email */
    email: v.optional(v.string()),
    role: adminRole,
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  /** Bearer sessions after admins.login — validated by adminToken on admin APIs */
  adminSessions: defineTable({
    adminId: v.id("admins"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_admin", ["adminId"]),

  /**
   * Website customers (Clerk). Admin UI: Clients — NOT `admins`.
   * Home branch via `branchSlug`; suspension via suspendedUntil / active.
   */
  users: defineTable({
    notifyChannel: v.optional(v.union(v.literal("sms"), v.literal("call"), v.literal("both"))),
    chatRequestTimes: v.optional(v.array(v.number())),
    clerkUserId: v.string(),
    /** Home branch slug — scopes user to one branch in admin Users list. */
    branchSlug: v.optional(branchSlug),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerified: v.optional(v.boolean()),
    /** Number confirmed by the authentication provider for outbound messages. */
    verifiedContactPhone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    /** Set true after +20 welcome bonus (signup or onboarding) — prevents double grant */
    welcomeBonusGranted: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
    /** Unix ms — customer cannot checkout until this time (admin suspension). */
    suspendedUntil: v.optional(v.number()),
    suspensionReason: v.optional(v.string()),
    /** Loyalty balance — +20 welcome, +10 per successful order; 40 pts → free drink coupon */
    points: v.number(),
    totalOrders: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_branch", ["branchSlug"])
    .index("by_created", ["createdAt"]),

  /**
   * Customer saved menu items (heart on menu / account favourites).
   * Snapshot fields keep the row usable if the menu item is renamed or removed.
   */
  userFavorites: defineTable({
    userId: v.id("users"),
    menuItemId: v.string(),
    branchSlug: v.optional(branchSlug),
    name: v.string(),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_item", ["userId", "menuItemId"]),

  phoneVerifications: defineTable({
    clerkUserId: v.string(),
    phone: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_clerk", ["clerkUserId"]),

  /**
   * Loyalty coupons — account rewards + checkout redemption.
   * Issued when balance crosses 40 points or via convertPointsToCoupon.
   */
  coupons: defineTable({
    userId: v.id("users"),
    type: couponType,
    /** Customer-facing code shown at checkout, e.g. KE-A3B7C9 */
    code: v.optional(v.string()),
    redeemed: v.boolean(),
    createdAt: v.number(),
    redeemedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_redeemed", ["userId", "redeemed"])
    .index("by_code", ["code"]),

  /**
   * Checkout orders — admin: Orders / Finance; account: track & history.
   * customerName/email/phone are snapshots at checkout (privacy + audit; not live profile).
   */
  orders: defineTable({
    /** Public reference ORD-YYYYMMDD-### — not the Convex document `_id`. */
    orderNumber: v.string(),
    clerkUserId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    branchSlug: v.optional(branchSlug),
    /** @deprecated Read-only alias of branchSlug on older rows */
    branchId: v.optional(branchSlug),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    items: v.array(orderLineItem),
    subtotal: v.number(),
    total: v.number(),
    /** ISO 4217 code at checkout (from branch). */
    currency: v.optional(v.string()),
    status: orderStatus,
    /** Set when status becomes cancelled (required for admin cancellation). */
    cancellationReason: v.optional(v.string()),
    paymentStatus: paymentStatus,
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    /** Loyalty awarded for this order (10 when paid/completed); unset = not yet awarded */
    pointsEarned: v.optional(v.number()),
    couponApplied: v.optional(v.boolean()),
    couponId: v.optional(v.id("coupons")),
    couponCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
    subtotalBeforeDiscount: v.optional(v.number()),
    freeItemName: v.optional(v.string()),
    paymentMethod: v.optional(paymentMethod),
    paymentMethodNote: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
  })
    .index("by_created", ["createdAt"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_payment_created", ["paymentStatus", "createdAt"])
    .index("by_clerk_created", ["clerkUserId", "createdAt"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_branch_created", ["branchSlug", "createdAt"]),

  /**
   * AI order insights - stores GROQ analysis when admin accepts an order
   */
  aiOrderInsights: defineTable({
    orderId: v.id("orders"),
    userId: v.optional(v.id("users")),
    acceptedAt: v.number(),
    /** GROQ structured analysis (prep notes, tone, item summary) */
    analysisJson: v.string(),
    groqModel: v.string(),
    /** Preferred message tone based on analysis */
    preferredTone: v.optional(v.string()),
    /** Items summary for ready message personalization */
    itemsSummary: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_user", ["userId"]),

  /**
   * AI notification log - tracks all outbound notifications (SMS, call)
   */
  aiNotificationLog: defineTable({
    orderId: v.id("orders"),
    channel: v.union(v.literal("sms"), v.literal("call")),
    provider: v.union(v.literal("twilio"), v.literal("vapi")),
    /** Twilio SID or VAPI call ID */
    externalId: v.optional(v.string()),
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  /**
   * AI chat threads - one thread per user conversation
   */
  aiThreads: defineTable({
    preview: v.optional(v.string()),
    messageCount: v.optional(v.number()),
    userId: v.id("users"),
    clerkUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_clerk", ["clerkUserId"])
    .index("by_updated", ["updatedAt"]),

  /**
   * AI chat messages - stores conversation history
   */
  aiMessages: defineTable({
    threadId: v.id("aiThreads"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_created", ["createdAt"]),

  /**
   * AI notifications - admin alerts and customer notifications
   */
  aiNotifications: defineTable({
    orderId: v.id("orders"),
    notificationType: v.union(v.literal("new_order"), v.literal("order_ready")),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_read", ["read"])
    .index("by_created", ["createdAt"]),
});
