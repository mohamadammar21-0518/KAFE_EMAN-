import type { MutationCtx } from "../../_generated/server";
import {
  DEFAULT_BRANCHES,
  DEFAULT_MENU_CATEGORY_LABELS,
  DEFAULT_SITE_SETTINGS,
  LEGACY_CATEGORY_TO_LABEL,
} from "../../lib/branchDefaults";
import { generateUniqueCouponCode } from "../../lib/couponCodes";
import { normalizeMenuItemId } from "../../lib/entityIds";
import { getMenuStockImageUrl } from "../../lib/menuStockImages";
import { buildMessageReference, buildOrderNumber } from "../../lib/referenceIds";
import { POINTS_PER_SUCCESSFUL_ORDER } from "../../lib/loyalty";
import { APP_TABLE_NAMES } from "../../lib/tableRegistry";

function isLocalMenuImage(url: string | undefined): boolean {
  const u = url?.trim();
  return Boolean(u?.startsWith("/Images/"));
}

function isLegacyBrokenUnsplash(url: string): boolean {
  return (
    url.includes("photo-1514433522367") ||
    url.includes("photo-1495474472287") ||
    url.includes("photo-1572442388796")
  );
}

/** Branches, menu catalog, site settings, slugs, contact refs, users. */
export async function stepAlignAppData(ctx: MutationCtx) {
  const report = {
    branchesCreated: 0,
    categoriesCreated: 0,
    menuItemsMigrated: 0,
    legacyMenuArchived: 0,
    ordersBackfilled: 0,
    reservationsBackfilled: 0,
    usersBranchBackfilled: 0,
    faqsPatched: 0,
    contactRefsAdded: 0,
    siteSettingsCreated: false,
  };

  const now = Date.now();

  for (const b of DEFAULT_BRANCHES) {
    let branch = await ctx.db
      .query("branches")
      .withIndex("by_slug", (q) => q.eq("slug", b.slug))
      .unique();

    if (!branch) {
      const id = await ctx.db.insert("branches", {
        slug: b.slug,
        label: b.label,
        subtitle: b.subtitle,
        address: b.address,
        concept: "concept" in b ? b.concept : undefined,
        hours: [...b.hours],
        active: true,
        sortOrder: b.sortOrder,
        currency: b.currency,
        createdAt: now,
        updatedAt: now,
      });
      branch = await ctx.db.get(id);
      report.branchesCreated += 1;
    }

    if (branch && !branch.currency) {
      await ctx.db.patch(branch._id, { currency: b.currency, updatedAt: now });
    }

    const existingCategories = await ctx.db
      .query("menuCategories")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", b.slug))
      .collect();

    if (existingCategories.length === 0) {
      for (let i = 0; i < DEFAULT_MENU_CATEGORY_LABELS.length; i++) {
        await ctx.db.insert("menuCategories", {
          branchSlug: b.slug,
          label: DEFAULT_MENU_CATEGORY_LABELS[i],
          sortOrder: i,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        report.categoriesCreated += 1;
      }
    }
  }

  const allItems = await ctx.db.query("menuItems").collect();
  const legacyItems = allItems.filter((i) => i.category && !i.categoryId);

  for (const item of legacyItems) {
    const branchSlugs =
      item.availableIn && item.availableIn.length > 0
        ? item.availableIn
        : DEFAULT_BRANCHES.map((b) => b.slug);

    const categoryLabel = item.category
      ? LEGACY_CATEGORY_TO_LABEL[item.category]
      : undefined;

    for (const slug of branchSlugs) {
      const categories = await ctx.db
        .query("menuCategories")
        .withIndex("by_branch_sort", (q) => q.eq("branchSlug", slug))
        .collect();

      const category = categoryLabel
        ? categories.find((c) => c.label === categoryLabel)
        : categories[0];

      if (!category) continue;

      const siblings = await ctx.db
        .query("menuItems")
        .withIndex("by_category_id_sort", (q) => q.eq("categoryId", category._id))
        .collect();

      const duplicate = siblings.some(
        (s) => s.name === item.name && s.branchSlug === slug,
      );
      if (duplicate) continue;

      await ctx.db.insert("menuItems", {
        name: item.name,
        description: item.description,
        price: item.price,
        branchSlug: slug,
        categoryId: category._id,
        imageUrl: item.imageUrl,
        outOfStock: item.outOfStock ?? false,
        featured: item.featured,
        sortOrder: item.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
      report.menuItemsMigrated += 1;
    }
  }

  for (const item of legacyItems) {
    if (!item.isLegacy) {
      await ctx.db.patch(item._id, { isLegacy: true, updatedAt: now });
      report.legacyMenuArchived += 1;
    }
  }

  const settings = await ctx.db
    .query("siteSettings")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .unique();

  if (!settings) {
    await ctx.db.insert("siteSettings", {
      key: "global",
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: now,
    });
    report.siteSettingsCreated = true;
  }

  for (const faq of await ctx.db.query("faqs").collect()) {
    const patch: { active?: boolean; createdAt?: number; updatedAt?: number } = {};
    if (faq.active === undefined) patch.active = true;
    if (!faq.createdAt) patch.createdAt = now;
    if (!faq.updatedAt) patch.updatedAt = now;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(faq._id, patch);
      report.faqsPatched += 1;
    }
  }

  for (const order of await ctx.db.query("orders").collect()) {
    const slug = order.branchSlug ?? order.branchId;
    if (!slug) continue;
    const patch: { branchSlug?: string; branchId?: string; updatedAt?: number } = {};
    if (!order.branchSlug) patch.branchSlug = slug;
    if (!order.branchId) patch.branchId = slug;
    if (!order.updatedAt) patch.updatedAt = order.createdAt;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(order._id, patch);
      report.ordersBackfilled += 1;
    }
  }

  const messages = await ctx.db.query("contactMessages").collect();
  const msgPrefix = buildMessageReference(0, now).replace(/-\d{3}$/, "");
  let msgSeq = messages.filter((m) => m.referenceId?.startsWith(msgPrefix)).length;
  for (const msg of messages) {
    if (msg.referenceId) continue;
    const referenceId = buildMessageReference(msgSeq, msg.createdAt);
    msgSeq += 1;
    await ctx.db.patch(msg._id, { referenceId, updatedAt: msg.updatedAt ?? now });
    report.contactRefsAdded += 1;
  }

  for (const row of await ctx.db.query("reservations").collect()) {
    const slug = row.branchSlug ?? row.branchId;
    const patch: {
      branchSlug?: string;
      branchId?: string;
      updatedAt?: number;
    } = {};
    if (slug) {
      if (!row.branchSlug) patch.branchSlug = slug;
      if (!row.branchId) patch.branchId = slug;
    }
    if (!row.updatedAt) patch.updatedAt = row.createdAt;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(row._id, patch);
      report.reservationsBackfilled += 1;
    }
  }

  for (const user of await ctx.db.query("users").collect()) {
    if (user.branchSlug) continue;
    const userOrders = await ctx.db
      .query("orders")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .collect();
    const latest = userOrders.sort((a, b) => b.createdAt - a.createdAt)[0];
    const slug = latest?.branchSlug ?? latest?.branchId;
    if (slug) {
      await ctx.db.patch(user._id, { branchSlug: slug, updatedAt: now });
      report.usersBranchBackfilled += 1;
    }
  }

  return report;
}

/** confirmed → progressing, rejected → cancelled + reason */
export async function stepMigrateReservationStatuses(ctx: MutationCtx) {
  const rows = await ctx.db.query("reservations").collect();
  let patched = 0;

  for (const row of rows) {
    if (row.status === "confirmed") {
      await ctx.db.patch(row._id, {
        status: "progressing",
        updatedAt: Date.now(),
      });
      patched += 1;
    } else if (row.status === "rejected") {
      await ctx.db.patch(row._id, {
        status: "cancelled",
        statusReason: row.statusReason ?? "Rejected (migrated from legacy status)",
        updatedAt: Date.now(),
      });
      patched += 1;
    }
  }

  return { patched, total: rows.length };
}

/** `updatedAt` and branch slug aliases on reservation rows */
export async function stepBackfillReservations(ctx: MutationCtx) {
  const rows = await ctx.db.query("reservations").collect();
  let updatedAtPatched = 0;
  let branchPatched = 0;
  let statusReasonPatched = 0;
  let closureOutcomePatched = 0;

  for (const row of rows) {
    const patch: {
      branchSlug?: string;
      branchId?: string;
      updatedAt?: number;
      statusReason?: string;
      closureOutcome?: "completed" | "no_show";
    } = {};
    const slug = row.branchSlug ?? row.branchId;
    if (slug) {
      if (!row.branchSlug) patch.branchSlug = slug;
      if (!row.branchId) patch.branchId = slug;
    }
    if (!row.updatedAt) patch.updatedAt = row.createdAt;
    if (row.status === "cancelled" && !row.statusReason?.trim()) {
      patch.statusReason = "Cancelled (backfilled)";
      statusReasonPatched += 1;
    }
    if (row.status === "closed" && !row.closureOutcome) {
      patch.closureOutcome = "completed";
      closureOutcomePatched += 1;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(row._id, patch);
      if (patch.updatedAt) updatedAtPatched += 1;
      if (patch.branchSlug || patch.branchId) branchPatched += 1;
    }
  }

  return {
    updatedAtPatched,
    branchPatched,
    statusReasonPatched,
    closureOutcomePatched,
    total: rows.length,
  };
}

/** Missing coupon `code` on loyalty rows */
export async function stepBackfillCouponCodes(ctx: MutationCtx) {
  const coupons = await ctx.db.query("coupons").collect();
  let patched = 0;

  for (const coupon of coupons) {
    if (coupon.code?.trim()) continue;
    const code = await generateUniqueCouponCode(ctx);
    await ctx.db.patch(coupon._id, {
      code,
      type: coupon.type ?? "free_drink",
    });
    patched += 1;
  }

  return { patched, total: coupons.length };
}

/** orderNumber, currency, couponCode snapshot, updatedAt */
export async function stepBackfillOrders(ctx: MutationCtx) {
  const orders = await ctx.db.query("orders").collect();
  const branchCache = new Map<string, string | undefined>();

  async function currencyForBranch(slug: string | undefined) {
    if (!slug) return "USD";
    if (branchCache.has(slug)) return branchCache.get(slug) ?? "USD";
    const branch = await ctx.db
      .query("branches")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    const currency = branch?.currency ?? "USD";
    branchCache.set(slug, currency);
    return currency;
  }

  const dayCounts = new Map<string, number>();

  let orderNumbersPatched = 0;
  let currencyPatched = 0;
  let couponCodePatched = 0;
  let updatedAtPatched = 0;

  const sorted = [...orders].sort((a, b) => a.createdAt - b.createdAt);

  for (const order of sorted) {
    const patch: {
      orderNumber?: string;
      currency?: string;
      couponCode?: string;
      updatedAt?: number;
    } = {};

    if (!order.orderNumber?.trim()) {
      const dayKey = new Date(order.createdAt).toISOString().slice(0, 10);
      const count = dayCounts.get(dayKey) ?? 0;
      patch.orderNumber = buildOrderNumber(count, order.createdAt);
      dayCounts.set(dayKey, count + 1);
      orderNumbersPatched += 1;
    }

    const slug = order.branchSlug ?? order.branchId;
    if (!order.currency?.trim()) {
      patch.currency = await currencyForBranch(slug);
      currencyPatched += 1;
    }

    if (order.couponId && !order.couponCode?.trim()) {
      const coupon = await ctx.db.get(order.couponId);
      if (coupon?.code) {
        patch.couponCode = coupon.code;
        couponCodePatched += 1;
      }
    }

    if (!order.updatedAt) {
      patch.updatedAt = order.createdAt;
      updatedAtPatched += 1;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(order._id, patch);
    }
  }

  return {
    orderNumbersPatched,
    currencyPatched,
    couponCodePatched,
    updatedAtPatched,
    total: orders.length,
  };
}

/** Legacy numeric menu ids on order line snapshots */
export async function stepNormalizeOrderLineItemIds(ctx: MutationCtx) {
  const orders = await ctx.db.query("orders").collect();
  let patchedOrders = 0;
  let patchedLines = 0;

  for (const order of orders) {
    let changed = false;
    const items = order.items.map((line) => {
      const next = normalizeMenuItemId(line.menuItemId);
      if (!next || next === line.menuItemId) return line;
      changed = true;
      patchedLines += 1;
      return { ...line, menuItemId: next };
    });

    if (changed) {
      await ctx.db.patch(order._id, { items, updatedAt: Date.now() });
      patchedOrders += 1;
    }
  }

  return { patchedOrders, patchedLines, totalOrders: orders.length };
}

/** Stock image URLs for menu rows (local paths / broken Unsplash) */
export async function stepBackfillMenuImages(ctx: MutationCtx) {
  const items = await ctx.db.query("menuItems").collect();
  let patched = 0;

  for (const item of items) {
    const current = item.imageUrl?.trim();
    const stock = getMenuStockImageUrl(item.name);
    const needsPatch =
      !current ||
      isLocalMenuImage(current) ||
      (current.includes("images.unsplash.com") && isLegacyBrokenUnsplash(current));

    if (!needsPatch) continue;

    await ctx.db.patch(item._id, {
      imageUrl: stock,
      updatedAt: Date.now(),
    });
    patched += 1;
  }

  return { patched, total: items.length };
}

/** Read-only integrity check after backfills (reports remaining gaps). */
export async function stepVerifyDataIntegrity(ctx: MutationCtx) {
  const issues: string[] = [];

  for (const c of await ctx.db.query("coupons").collect()) {
    if (!c.code?.trim()) issues.push(`coupon:${c._id}:missing_code`);
  }

  for (const o of await ctx.db.query("orders").collect()) {
    if (!o.orderNumber?.trim()) issues.push(`order:${o._id}:missing_orderNumber`);
    if (!o.currency?.trim()) issues.push(`order:${o._id}:missing_currency`);
  }

  for (const r of await ctx.db.query("reservations").collect()) {
    if (r.status === "confirmed" || r.status === "rejected") {
      issues.push(`reservation:${r._id}:legacy_status_${r.status}`);
    }
    if (r.status === "cancelled" && !r.statusReason?.trim()) {
      issues.push(`reservation:${r._id}:cancelled_without_reason`);
    }
    if (r.status === "closed" && !r.closureOutcome) {
      issues.push(`reservation:${r._id}:closed_without_outcome`);
    }
  }

  for (const u of await ctx.db.query("users").collect()) {
    if (u.points === undefined || u.points < 0) {
      issues.push(`user:${u._id}:invalid_points`);
    }
    if (u.totalOrders === undefined || u.totalOrders < 0) {
      issues.push(`user:${u._id}:invalid_totalOrders`);
    }
    if (u.welcomeBonusGranted === undefined) {
      issues.push(`user:${u._id}:missing_welcomeBonusGranted`);
    }
  }

  for (const o of await ctx.db.query("orders").collect()) {
    if (!o.userId) continue;
    const paid = o.paymentStatus === "paid";
    const completed = o.status === "completed";
    if ((paid || completed) && o.status !== "cancelled" && o.pointsEarned === undefined) {
      issues.push(`order:${o._id}:missing_pointsEarned`);
    }
  }

  for (const t of await ctx.db.query("testimonials").collect()) {
    if (t.rating < 1 || t.rating > 5) {
      issues.push(`testimonial:${t._id}:invalid_rating`);
    }
    if (!t.imageUrl?.trim()) {
      issues.push(`testimonial:${t._id}:missing_imageUrl`);
    }
    if (t.status === "accepted" && t.sortOrder === undefined) {
      issues.push(`testimonial:${t._id}:accepted_missing_sortOrder`);
    }
  }

  const branches = await ctx.db.query("branches").collect();
  if (branches.length === 0) issues.push("branches:empty");

  const tableCounts = Object.fromEntries(
    await Promise.all(
      APP_TABLE_NAMES.map(async (name) => [name, (await ctx.db.query(name).collect()).length]),
    ),
  );

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues: issues.slice(0, 50),
    tableCounts,
  };
}

/** Accepted carousel order + timestamps + source for testimonial rows. */
export async function stepBackfillTestimonials(ctx: MutationCtx) {
  const rows = await ctx.db.query("testimonials").collect();
  const now = Date.now();
  let sortOrderPatched = 0;
  let updatedAtPatched = 0;
  let acceptedAtPatched = 0;
  let sourcePatched = 0;

  const accepted = rows
    .filter((r) => r.status === "accepted")
    .sort((a, b) => (a.acceptedAt ?? a.createdAt) - (b.acceptedAt ?? b.createdAt));

  for (let i = 0; i < accepted.length; i++) {
    const row = accepted[i];
    const patch: {
      sortOrder?: number;
      acceptedAt?: number;
      updatedAt?: number;
    } = {};

    if (row.sortOrder === undefined) {
      patch.sortOrder = i + 1;
      sortOrderPatched += 1;
    }
    if (!row.acceptedAt) {
      patch.acceptedAt = row.updatedAt ?? row.createdAt;
      acceptedAtPatched += 1;
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = now;
      await ctx.db.patch(row._id, patch);
    }
  }

  for (const row of rows) {
    const patch: { updatedAt?: number; source?: "client" | "staff" } = {};
    if (!row.updatedAt) {
      patch.updatedAt = row.createdAt;
      updatedAtPatched += 1;
    }
    if (!row.source) {
      patch.source = row.createdByAdminId ? "staff" : "client";
      sourcePatched += 1;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(row._id, patch);
    }
  }

  return {
    total: rows.length,
    accepted: accepted.length,
    sortOrderPatched,
    acceptedAtPatched,
    updatedAtPatched,
    sourcePatched,
  };
}

/**
 * Loyalty flags for existing customers (does not change point balances).
 * - `welcomeBonusGranted` → true when undefined (legacy accounts; avoids duplicate +20 on onboarding)
 * - `totalOrders` default 0 when missing
 */
export async function stepBackfillLoyaltyUsers(ctx: MutationCtx) {
  const users = await ctx.db.query("users").collect();
  const now = Date.now();
  let welcomeFlagPatched = 0;
  let totalOrdersPatched = 0;

  for (const user of users) {
    const patch: {
      welcomeBonusGranted?: boolean;
      totalOrders?: number;
      updatedAt?: number;
    } = {};

    if (user.welcomeBonusGranted === undefined) {
      patch.welcomeBonusGranted = true;
      welcomeFlagPatched += 1;
    }

    if (user.totalOrders === undefined || Number.isNaN(user.totalOrders)) {
      patch.totalOrders = 0;
      totalOrdersPatched += 1;
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = now;
      await ctx.db.patch(user._id, patch);
    }
  }

  return { welcomeFlagPatched, totalOrdersPatched, total: users.length };
}

/** Mark paid/completed orders that predate loyalty tracking (no retroactive points). */
export async function stepBackfillLoyaltyOrders(ctx: MutationCtx) {
  const orders = await ctx.db.query("orders").collect();
  let markedNoAward = 0;

  for (const order of orders) {
    if (order.pointsEarned != null) continue;
    if (!order.userId || order.status === "cancelled") continue;

    const paid = order.paymentStatus === "paid";
    const completed = order.status === "completed";
    if (!paid && !completed) continue;

    await ctx.db.patch(order._id, {
      pointsEarned: 0,
      updatedAt: order.updatedAt ?? Date.now(),
    });
    markedNoAward += 1;
  }

  return { markedNoAward, pointsPerOrder: POINTS_PER_SUCCESSFUL_ORDER, total: orders.length };
}

/** Default `active`, clear expired suspensions, ensure timestamps. */
export async function stepBackfillUsers(ctx: MutationCtx) {
  const users = await ctx.db.query("users").collect();
  const now = Date.now();
  let activeDefaulted = 0;
  let expiredSuspensionsCleared = 0;
  let updatedAtPatched = 0;

  for (const user of users) {
    const patch: {
      active?: boolean;
      suspendedUntil?: undefined;
      suspensionReason?: undefined;
      updatedAt?: number;
    } = {};

    if (user.active === undefined) {
      patch.active = true;
      activeDefaulted += 1;
    }

    if (user.suspendedUntil != null && user.suspendedUntil <= now) {
      patch.suspendedUntil = undefined;
      patch.suspensionReason = undefined;
      expiredSuspensionsCleared += 1;
    }

    if (!user.updatedAt) {
      patch.updatedAt = user.createdAt;
      updatedAtPatched += 1;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }
  }

  return {
    activeDefaulted,
    expiredSuspensionsCleared,
    updatedAtPatched,
    total: users.length,
  };
}

export type MigrationRunReport = {
  ok: true;
  ranAt: number;
  steps: {
    adminRoles: Awaited<ReturnType<typeof stepMigrateAdminRoles>>;
    alignAppData: Awaited<ReturnType<typeof stepAlignAppData>>;
    reservationStatuses: Awaited<ReturnType<typeof stepMigrateReservationStatuses>>;
    reservations: Awaited<ReturnType<typeof stepBackfillReservations>>;
    couponCodes: Awaited<ReturnType<typeof stepBackfillCouponCodes>>;
    users: Awaited<ReturnType<typeof stepBackfillUsers>>;
    loyaltyUsers: Awaited<ReturnType<typeof stepBackfillLoyaltyUsers>>;
    orders: Awaited<ReturnType<typeof stepBackfillOrders>>;
    loyaltyOrders: Awaited<ReturnType<typeof stepBackfillLoyaltyOrders>>;
    orderLineItemIds: Awaited<ReturnType<typeof stepNormalizeOrderLineItemIds>>;
    menuImages: Awaited<ReturnType<typeof stepBackfillMenuImages>>;
    testimonials: Awaited<ReturnType<typeof stepBackfillTestimonials>>;
    verify: Awaited<ReturnType<typeof stepVerifyDataIntegrity>>;
  };
};

/** Legacy `admin` role → `staff`; backfill missing emails for admin accounts. */
export async function stepMigrateAdminRoles(ctx: MutationCtx) {
  const admins = await ctx.db.query("admins").collect();
  const now = Date.now();
  let rolesPatched = 0;
  let emailsPatched = 0;

  for (const row of admins) {
    const role = row.role as string;
    const patch: { role?: "superadmin" | "staff"; email?: string; updatedAt: number } = {
      updatedAt: now,
    };
    let needsPatch = false;

    if (role === "admin") {
      patch.role = "staff";
      needsPatch = true;
      rolesPatched += 1;
    } else if (role !== "superadmin" && role !== "staff") {
      patch.role = "staff";
      needsPatch = true;
      rolesPatched += 1;
    }

    if (!row.email?.trim()) {
      const safeUser = row.username.replace(/[^a-z0-9._-]/gi, "") || "admin";
      patch.email = `${safeUser}@kafe-eman.local`;
      needsPatch = true;
      emailsPatched += 1;
    }

    if (needsPatch) {
      await ctx.db.patch(row._id, patch);
    }
  }

  return { rolesPatched, emailsPatched, total: admins.length };
}

/** Runs every migration step in a safe order (idempotent). */
export async function runAllMigrationSteps(ctx: MutationCtx): Promise<MigrationRunReport> {
  const adminRoles = await stepMigrateAdminRoles(ctx);
  const alignAppData = await stepAlignAppData(ctx);
  const reservationStatuses = await stepMigrateReservationStatuses(ctx);
  const reservations = await stepBackfillReservations(ctx);
  const couponCodes = await stepBackfillCouponCodes(ctx);
  const users = await stepBackfillUsers(ctx);
  const loyaltyUsers = await stepBackfillLoyaltyUsers(ctx);
  const orders = await stepBackfillOrders(ctx);
  const loyaltyOrders = await stepBackfillLoyaltyOrders(ctx);
  const orderLineItemIds = await stepNormalizeOrderLineItemIds(ctx);
  const menuImages = await stepBackfillMenuImages(ctx);
  const testimonials = await stepBackfillTestimonials(ctx);
  const verify = await stepVerifyDataIntegrity(ctx);

  return {
    ok: true,
    ranAt: Date.now(),
    steps: {
      adminRoles,
      alignAppData,
      reservationStatuses,
      reservations,
      couponCodes,
      users,
      loyaltyUsers,
      orders,
      loyaltyOrders,
      orderLineItemIds,
      menuImages,
      testimonials,
      verify,
    },
  };
}
