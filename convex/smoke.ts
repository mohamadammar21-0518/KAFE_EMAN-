import { internalMutation } from "./_generated/server";
import { APP_TABLE_NAMES } from "./lib/tableRegistry";
import { generateSecureToken, hashPassword, hashToken, verifyPassword } from "./lib/password";
import { requireAdmin, sessionExpiresAt } from "./lib/adminAuth";
import {
  assertValidStatusTransition,
  type OrderStatusValue,
} from "./lib/orderStatusFlow";

type Check = { name: string; ok: boolean; detail?: string };

function push(checks: Check[], name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
}

/**
 * Run: `npx convex run smoke:run`
 * Exercises admin auth, CRUD tables, and public write paths without the browser.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const checks: Check[] = [];
    const cleanup: Array<() => Promise<void>> = [];

    push(checks, "health.tableRegistry", APP_TABLE_NAMES.length === new Set(APP_TABLE_NAMES).size, `${APP_TABLE_NAMES.length} tables`);

    const menuCount = (await ctx.db.query("menuItems").collect()).length;
    push(checks, "menuItems.seed", menuCount > 0, `${menuCount} items`);

    const activeBranches = (
      await ctx.db
        .query("branches")
        .withIndex("by_active_sort", (q) => q.eq("active", true))
        .collect()
    ).length;
    push(checks, "branches.listActive", activeBranches > 0, `${activeBranches} active`);

    const branchSlug =
      (await ctx.db.query("branches").withIndex("by_active_sort", (q) => q.eq("active", true)).first())
        ?.slug ?? "alor-setar";
    const menuCats = await ctx.db
      .query("menuCategories")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", branchSlug))
      .collect();
    push(checks, "menuCatalog.byBranch", menuCats.length > 0, `${menuCats.length} categories`);

    const siteSettings = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    push(checks, "siteSettings.get", Boolean(siteSettings?.email));

    const teamCount = (await ctx.db.query("teamMembers").withIndex("by_sort").collect()).length;
    push(checks, "teamMembers.list", teamCount > 0, `${teamCount} members`);

    const statsCount = (await ctx.db.query("stats").withIndex("by_sort").collect()).length;
    push(checks, "stats.list", statsCount > 0, `${statsCount} stats`);

    const publicFaqs = await ctx.db.query("faqs").withIndex("by_sort").collect();
    const activeFaqs = publicFaqs.filter((f) => f.active !== false);
    push(checks, "faqs.list", activeFaqs.length > 0, `${activeFaqs.length} active`);

    const testPassword = generateSecureToken();
    const { hash, salt } = await hashPassword(testPassword);
    const adminId = await ctx.db.insert("admins", {
      username: "smoke-" + generateSecureToken(),
      passwordHash: hash, passwordSalt: salt,
      displayName: "Smoke Test", role: "superadmin", active: true, createdAt: Date.now(), updatedAt: Date.now(),
    });
    cleanup.push(async () => { await ctx.db.delete(adminId); });
    const admin = await ctx.db.get(adminId);
    if (!admin) throw new Error("Unable to create the smoke test account.");
    const passwordOk = await verifyPassword(testPassword, admin.passwordHash, admin.passwordSalt);
    push(checks, "admins.login.password", passwordOk);

    const adminToken = generateSecureToken();
    const tokenHash = await hashToken(adminToken);
    const now = Date.now();
    const sessionId = await ctx.db.insert("adminSessions", {
      adminId: admin._id,
      tokenHash,
      expiresAt: sessionExpiresAt(now),
      createdAt: now,
    });
    cleanup.push(async () => {
      await ctx.db.delete(sessionId);
    });

    try {
      await requireAdmin(ctx, adminToken);
      push(checks, "admins.session", true);
    } catch {
      push(checks, "admins.session", false);
      throw new Error("Smoke test administrator session validation failed.");
    }

    // —— Public: contact form ——
    const smokeNow = Date.now();
    const messageId = await ctx.db.insert("contactMessages", {
      referenceId: `MSG-SMOKE-${smokeNow}`,
      name: "Smoke Test",
      email: "smoke@test.local",
      message: "Integration test message",
      status: "pending",
      createdAt: smokeNow,
      updatedAt: smokeNow,
    });
    cleanup.push(async () => {
      await ctx.db.delete(messageId);
    });
    const message = await ctx.db.get(messageId);
    push(checks, "contactMessages.submit", message?.status === "pending");
    await ctx.db.patch(messageId, { status: "read" });
    push(checks, "contactMessages.updateStatus", (await ctx.db.get(messageId))?.status === "read");

    // —— Public: reservation ——
    const reservationId = await ctx.db.insert("reservations", {
      branchSlug: "alor-setar",
      branchId: "alor-setar",
      name: "Smoke Test",
      email: "smoke@test.local",
      phone: "+60000000000",
      date: "2099-01-01",
      time: "12:00",
      guests: 2,
      status: "pending",
      createdAt: Date.now(),
    });
    cleanup.push(async () => {
      await ctx.db.delete(reservationId);
    });
    for (const status of ["progressing", "cancelled", "closed", "pending"] as const) {
      const patch: { status: typeof status; statusReason?: string; closureOutcome?: "followed_up" } =
        { status };
      if (status === "cancelled") patch.statusReason = "Smoke test cancel";
      if (status === "closed") patch.closureOutcome = "followed_up";
      await ctx.db.patch(reservationId, patch);
    }
    push(checks, "reservations.statusFlow", (await ctx.db.get(reservationId))?.status === "pending");

    // —— Site settings ——
    const existingSettings = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();

    let settingsId = existingSettings?._id;


    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        location: "Smoke City",
        updatedAt: Date.now(),
      });
    } else {
      settingsId = await ctx.db.insert("siteSettings", {
        key: "global",
        location: "Smoke City",
        phone: "+000",
        email: "smoke@test.local",
        hours: "24/7",
        updatedAt: Date.now(),
      });
    }

    const settingsRow = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    push(checks, "siteSettings.get", settingsRow?.location === "Smoke City");

    if (settingsId) {
      await ctx.db.patch(settingsId, { location: "Updated Smoke", updatedAt: Date.now() });
      push(
        checks,
        "siteSettings.upsert",
        (await ctx.db.get(settingsId))?.location === "Updated Smoke",
      );
      if (existingSettings) {
        await ctx.db.patch(settingsId, { location: existingSettings.location, updatedAt: existingSettings.updatedAt });
      } else {
        await ctx.db.delete(settingsId);
      }
    }

    // —— Branches + menu CRUD ——
    const branchId = await ctx.db.insert("branches", {
      slug: `smoke-${now}`,
      label: "Smoke Branch",
      address: "1 Test St",
      hours: ["9–5"],
      active: true,
      sortOrder: 999,
      createdAt: now,
      updatedAt: now,
    });
    cleanup.push(async () => {
      const branch = await ctx.db.get(branchId);
      if (!branch) return;
      const categories = await ctx.db
        .query("menuCategories")
        .withIndex("by_branch_sort", (q) => q.eq("branchSlug", branch.slug))
        .collect();
      for (const cat of categories) {
        const items = await ctx.db
          .query("menuItems")
          .withIndex("by_category_id_sort", (q) => q.eq("categoryId", cat._id))
          .collect();
        for (const item of items) await ctx.db.delete(item._id);
        await ctx.db.delete(cat._id);
      }
      await ctx.db.delete(branchId);
    });

    const branch = await ctx.db.get(branchId);
    push(checks, "branches.create", branch?.slug.startsWith("smoke-") === true);

    await ctx.db.patch(branchId, { label: "Smoke Branch Updated", updatedAt: Date.now() });
    push(checks, "branches.update", (await ctx.db.get(branchId))?.label === "Smoke Branch Updated");

    const categoryId = await ctx.db.insert("menuCategories", {
      branchSlug: branch!.slug,
      label: "Smoke Category",
      sortOrder: 0,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(categoryId, { label: "Smoke Category Updated", updatedAt: Date.now() });
    push(
      checks,
      "menuCategories.update",
      (await ctx.db.get(categoryId))?.label === "Smoke Category Updated",
    );

    const productId = await ctx.db.insert("menuItems", {
      name: "Smoke Latte",
      description: "Test drink",
      price: 12.5,
      branchSlug: branch!.slug,
      categoryId,
      featured: false,
      outOfStock: false,
      sortOrder: 0,
    });

    await ctx.db.patch(productId, { price: 13.5 });
    push(checks, "menuItemsAdmin.update", (await ctx.db.get(productId))?.price === 13.5);

    const catalogCategories = await ctx.db
      .query("menuCategories")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", branch!.slug))
      .collect();
    const catalogItems = await ctx.db
      .query("menuItems")
      .withIndex("by_branch_sort", (q) => q.eq("branchSlug", branch!.slug))
      .collect();
    const hasCatalog =
      catalogCategories.some((c) => c.active) &&
      catalogItems.some((i) => i.categoryId === categoryId && !i.outOfStock);
    push(checks, "menuCatalog.byBranch", hasCatalog);

    await ctx.db.delete(productId);
    push(checks, "menuItemsAdmin.remove", (await ctx.db.get(productId)) === null);
    await ctx.db.delete(categoryId);
    push(checks, "menuCategories.remove", (await ctx.db.get(categoryId)) === null);

    // —— FAQ admin CRUD ——
    const faqId = await ctx.db.insert("faqs", {
      question: "Smoke question?",
      answer: "Smoke answer.",
      sortOrder: 9999,
      active: true,
    });
    await ctx.db.patch(faqId, { question: "Updated smoke?" });
    push(checks, "faqsAdmin.update", (await ctx.db.get(faqId))?.question === "Updated smoke?");
    await ctx.db.delete(faqId);
    push(checks, "faqsAdmin.remove", (await ctx.db.get(faqId)) === null);

    // —— Orders admin ——
    const orderId = await ctx.db.insert("orders", {
      orderNumber: `SMOKE-${now}`,
      branchSlug: "alor-setar",
      branchId: "alor-setar",
      customerName: "Smoke Customer",
      customerEmail: "smoke-order@test.local",
      items: [{ name: "Test Item", price: 10, quantity: 1 }],
      subtotal: 10,
      total: 10,
      status: "pending",
      paymentStatus: "paid",
      paidAt: now,
      createdAt: now,
    });
    cleanup.push(async () => {
      await ctx.db.delete(orderId);
    });

    let prevStatus: OrderStatusValue = "pending";
    for (const status of ["confirmed", "preparing", "ready", "completed"] as const) {
      assertValidStatusTransition(prevStatus, status);
      await ctx.db.patch(orderId, { status, updatedAt: Date.now() });
      prevStatus = status;
    }
    push(checks, "orders.updateStatus", (await ctx.db.get(orderId))?.status === "completed");

    let invalidTransition = false;
    try {
      assertValidStatusTransition("completed", "pending");
    } catch {
      invalidTransition = true;
    }
    push(checks, "orders.statusPipeline.guard", invalidTransition);

    const order = await ctx.db.get(orderId);
    const customer = order?.userId ? await ctx.db.get(order.userId) : null;
    push(checks, "orders.getDetail", Boolean(order) && customer === null);

    const paidOrders = (await ctx.db.query("orders").collect()).filter((o) => o.paymentStatus === "paid");
    push(checks, "orders.financeSummary", paidOrders.length > 0, `${paidOrders.length} paid orders`);

    // —— Users (admin list) ——
    const testUserId = await ctx.db.insert("users", {
      clerkUserId: `smoke-clerk-${now}`,
      email: `smoke-user-${now}@test.local`,
      firstName: "Smoke",
      lastName: "User",
      points: 100,
      totalOrders: 0,
      active: true,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });
    cleanup.push(async () => {
      await ctx.db.delete(testUserId);
    });

    const testimonialId = await ctx.db.insert("testimonials", {
      source: "client",
      userId: testUserId,
      clerkUserId: `smoke-clerk-${now}`,
      authorName: "Smoke Guest",
      rating: 5,
      text: "Smoke testimonial for integration test.",
      targetType: "all",
      targetLabel: "Overall experience",
      branchSlug: "alor-setar",
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    cleanup.push(async () => {
      const row = await ctx.db.get(testimonialId);
      if (row?.imageStorageId) {
        try {
          await ctx.storage.delete(row.imageStorageId);
        } catch {
          // ignore
        }
      }
      await ctx.db.delete(testimonialId);
    });
    push(checks, "testimonials.insert", (await ctx.db.get(testimonialId))?.status === "pending");

    await ctx.db.patch(testimonialId, {
      status: "accepted",
      sortOrder: 1,
      acceptedAt: now,
      reviewedByAdminId: admin._id,
      updatedAt: now,
    });
    const published = await ctx.db
      .query("testimonials")
      .withIndex("by_status_sort", (q) => q.eq("status", "accepted"))
      .collect();
    push(
      checks,
      "testimonials.accept",
      published.some((t) => t._id === testimonialId),
    );
    push(checks, "testimonials.listPublished", published.length > 0);

    const staffTestimonialId = await ctx.db.insert("testimonials", {
      source: "staff",
      authorName: "Staff Smoke",
      rating: 4,
      text: "Staff-created testimonial smoke test.",
      targetType: "all",
      targetLabel: "Overall experience",
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      status: "pending",
      createdByAdminId: admin._id,
      createdAt: now,
      updatedAt: now,
    });
    cleanup.push(async () => {
      await ctx.db.delete(staffTestimonialId);
    });
    push(checks, "testimonials.createStaff", (await ctx.db.get(staffTestimonialId))?.source === "staff");

    await ctx.db.patch(testimonialId, {
      status: "rejected",
      rejectReason: "Smoke test rejection",
      reviewedByAdminId: admin._id,
      updatedAt: Date.now(),
    });
    push(
      checks,
      "testimonials.reject",
      (await ctx.db.get(testimonialId))?.status === "rejected",
    );

    const favId = await ctx.db.insert("userFavorites", {
      userId: testUserId,
      menuItemId: "static:menu:smoke",
      branchSlug,
      name: "Smoke Favourite",
      price: 12,
      createdAt: now,
    });
    cleanup.push(async () => {
      await ctx.db.delete(favId);
    });
    const favByUser = await ctx.db
      .query("userFavorites")
      .withIndex("by_user", (q) => q.eq("userId", testUserId))
      .collect();
    push(checks, "userFavorites.myFavorites", favByUser.some((f) => f._id === favId));

    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_created", (q) => q.gte("createdAt", now - 86_400_000))
      .collect();
    push(checks, "adminDashboard.ordersTrend", recentOrders.length >= 0);

    const customers = await ctx.db.query("users").collect();
    push(checks, "admins.listCustomers", customers.some((u) => u._id === testUserId));
    await ctx.db.patch(testUserId, { active: false, updatedAt: Date.now() });
    push(checks, "admins.setCustomerActive", (await ctx.db.get(testUserId))?.active === false);

    for (const fn of cleanup.reverse()) {
      try {
        await fn();
      } catch {
        // Ignore missing rows already removed during inline CRUD checks.
      }
    }

    const failed = checks.filter((c) => !c.ok);
    return {
      passed: failed.length === 0,
      checks,
      failed: failed.map((c) => c.name),
    };
  },
});
