import { internalMutation, type MutationCtx } from "./_generated/server";
import { getMenuStockImageUrl } from "./lib/menuStockImages";
import { hashPassword } from "./lib/password";

async function ensureDefaultAdmin(ctx: MutationCtx) {
  const username = "admin";
  const existing = await ctx.db
    .query("admins")
    .withIndex("by_username", (q) => q.eq("username", username))
    .unique();

  if (existing) return { adminSeeded: false };

  const { hash, salt } = await hashPassword("admin123");
  const now = Date.now();
  await ctx.db.insert("admins", {
    username,
    passwordHash: hash,
    passwordSalt: salt,
    displayName: "Admin",
    email: "admin@kafe-eman.local",
    role: "superadmin",
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  return { adminSeeded: true };
}

export const seedAdmins = internalMutation({
  args: {},
  handler: async (ctx) => ensureDefaultAdmin(ctx),
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("menuItems").first();
    if (existing) {
      const adminResult = await ensureDefaultAdmin(ctx);
      return { seeded: false, ...adminResult };
    }

    const menuItems = [
      { name: "Signature Espresso", description: "Rich, bold espresso with a velvety crema.", price: 6.5, category: "signature" as const, featured: true, sortOrder: 1, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Velvet Caramel Latte", description: "Silky steamed milk with caramel sweetness.", price: 8.9, category: "signature" as const, featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Classic Cappuccino", description: "Balanced espresso, steamed milk, and foam.", price: 7.8, category: "signature" as const, featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Artisan Cold Brew", description: "Slow-steeped cold brew, smooth and crisp.", price: 25, category: "signature" as const, featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas"] },
      { name: "Vanilla Cloud Latte", description: "Vanilla-infused latte topped with airy foam.", price: 8.4, category: "lattes" as const, featured: true, sortOrder: 1, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Hazelnut Delight", description: "Nutty hazelnut latte with a warm finish.", price: 8.9, category: "lattes" as const, featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Rose Almond Latte", description: "Floral rose notes with almond creaminess.", price: 15, category: "lattes" as const, featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas"] },
      { name: "Honey Cinnamon Latte", description: "Honey sweetness with a cinnamon spice lift.", price: 9.2, category: "lattes" as const, featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Matcha Harmony", description: "Ceremonial matcha blended with creamy milk.", price: 9.8, category: "tea-matcha" as const, featured: true, sortOrder: 1, availableIn: ["alor-setar", "uum-sintok"] },
      { name: "Earl Grey Supreme", description: "Bergamot black tea, fragrant and refined.", price: 12, category: "tea-matcha" as const, featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Chamomile Blossom", description: "Calming chamomile infusion, naturally sweet.", price: 6.8, category: "tea-matcha" as const, featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Jasmine Green Tea", description: "Delicate jasmine aroma with green tea clarity.", price: 6.5, category: "tea-matcha" as const, featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Blueberry Muffin", description: "Buttery muffin with baked blueberry bursts.", price: 6.2, category: "bakery-dessert" as const, featured: true, sortOrder: 1, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Butter Croissant", description: "Flaky, golden croissant with a soft center.", price: 5.9, category: "bakery-dessert" as const, featured: false, sortOrder: 2, availableIn: ["alor-setar", "kepala-batas", "uum-sintok"] },
      { name: "Classic Cheesecake", description: "Creamy cheesecake with a crisp biscuit base.", price: 8.9, category: "bakery-dessert" as const, featured: false, sortOrder: 3, availableIn: ["alor-setar", "kepala-batas"] },
      { name: "Tiramisu Classico", description: "Espresso-soaked layers with cocoa dusting.", price: 9.5, category: "bakery-dessert" as const, featured: false, sortOrder: 4, availableIn: ["alor-setar", "kepala-batas"] },
      { name: "Classic Omelette Plate", description: "Fluffy omelette served with fresh sides.", price: 14.9, category: "breakfast" as const, featured: false, sortOrder: 1, availableIn: ["alor-setar"] },
      { name: "Cheese Croissant Sandwich", description: "Warm croissant sandwich with melted cheese.", price: 11.9, category: "breakfast" as const, featured: false, sortOrder: 2, availableIn: ["alor-setar", "uum-sintok"] },
      { name: "Avocado Toast", description: "Smashed avocado on toast with seasonal garnish.", price: 13.5, category: "breakfast" as const, featured: false, sortOrder: 3, availableIn: ["alor-setar", "uum-sintok"] },
      { name: "Truffle Scrambled Eggs", description: "Creamy eggs finished with truffle aroma.", price: 13.5, category: "breakfast" as const, featured: false, sortOrder: 4, availableIn: ["alor-setar"] },
    ];

    type BranchId = "alor-setar" | "kepala-batas" | "uum-sintok";
    for (const item of menuItems) {
      await ctx.db.insert("menuItems", {
        ...item,
        imageUrl: getMenuStockImageUrl(item.name),
        availableIn: item.availableIn as BranchId[] | undefined,
      });
    }

    const teamMembers = [
      { name: "James Rodriguez", role: "Head Pastry Chef", sortOrder: 1 },
      { name: "Sophia Patel", role: "Executive Chef", sortOrder: 2 },
      { name: "Michelle Taylor", role: "Head Barista", sortOrder: 3 },
      { name: "David Chen", role: "Commis Chef", sortOrder: 4 },
      { name: "Amara Koni", role: "Sous Chef", sortOrder: 5 },
      { name: "Marcus Williams", role: "Culinary Strategist", sortOrder: 6 },
    ];

    for (const member of teamMembers) {
      await ctx.db.insert("teamMembers", member);
    }

    const stats = [
      { value: 15, suffix: "K+", label: "Cups served to happy guests each month.", sortOrder: 1 },
      { value: 8, suffix: "+", label: "Years of passion for coffee & rooted hospitality.", sortOrder: 2 },
      { value: 98, suffix: "%", label: "Loyal guests inspired by our experience.", sortOrder: 3 },
      { value: 10, suffix: "K+", label: "Cups Served", sortOrder: 4 },
      { value: 5, suffix: "K+", label: "Loyal Customers", sortOrder: 5 },
      { value: 8, suffix: "+", label: "Years In Operation", sortOrder: 6 },
      { value: 12, suffix: "+", label: "Global Origins", sortOrder: 7 },
    ];

    for (const stat of stats) {
      await ctx.db.insert("stats", stat);
    }

    const faqs = [
      {
        question: "Can I reserve a table in advance?",
        answer: "Absolutely. You can reserve your table online in just a few simple steps.",
        sortOrder: 1,
      },
      {
        question: "Do you serve dairy-free and vegan options?",
        answer: "Yes, we offer oat, almond, soy, and other plant-based alternatives.",
        sortOrder: 2,
      },
      {
        question: "Where do you source your coffee beans from?",
        answer: "We partner with trusted farms that follow sustainable practices.",
        sortOrder: 3,
      },
      {
        question: "Can I work or hold meetings at the café?",
        answer: "Yes, our space is designed for both casual work sessions and meetings.",
        sortOrder: 4,
      },
      {
        question: "Are non-coffee beverages available?",
        answer:
          "Yes, we offer a variety of non-coffee beverages including teas, fresh juices, smoothies, and specialty drinks to suit every preference.",
        sortOrder: 5,
      },
    ];

    const seedNow = Date.now();
    for (const faq of faqs) {
      await ctx.db.insert("faqs", {
        ...faq,
        active: true,
        createdAt: seedNow,
        updatedAt: seedNow,
      });
    }

    const day = 24 * 60 * 60 * 1000;
    const sampleOrders = [
      {
        orderNumber: "ORD-SEED-001",
        branchId: "alor-setar" as const,
        customerName: "Aina Rahman",
        customerEmail: "aina@example.com",
        items: [{ name: "Signature Espresso", price: 6.5, quantity: 2 }],
        subtotal: 13,
        total: 13,
        status: "completed" as const,
        paymentStatus: "paid" as const,
        paidAt: seedNow - day * 0,
        createdAt: seedNow - day * 0,
      },
      {
        orderNumber: "ORD-SEED-002",
        branchId: "kepala-batas" as const,
        customerName: "Marcus Lee",
        customerEmail: "marcus@example.com",
        items: [{ name: "Vanilla Cloud Latte", price: 8.4, quantity: 1 }, { name: "Blueberry Muffin", price: 6.2, quantity: 2 }],
        subtotal: 20.8,
        total: 20.8,
        status: "ready" as const,
        paymentStatus: "paid" as const,
        paidAt: seedNow - day * 1,
        createdAt: seedNow - day * 1,
      },
      {
        orderNumber: "ORD-SEED-003",
        branchId: "uum-sintok" as const,
        customerName: "Sarah Wong",
        customerEmail: "sarah@example.com",
        items: [{ name: "Matcha Harmony", price: 9.8, quantity: 1 }],
        subtotal: 9.8,
        total: 9.8,
        status: "preparing" as const,
        paymentStatus: "paid" as const,
        paidAt: seedNow - day * 3,
        createdAt: seedNow - day * 3,
      },
      {
        orderNumber: "ORD-SEED-004",
        branchId: "alor-setar" as const,
        customerName: "Daniel Ibrahim",
        customerEmail: "daniel@example.com",
        items: [{ name: "Classic Cappuccino", price: 7.8, quantity: 3 }],
        subtotal: 23.4,
        total: 23.4,
        status: "pending" as const,
        paymentStatus: "pending" as const,
        createdAt: seedNow - day * 0.2,
      },
    ];

    for (const order of sampleOrders) {
      await ctx.db.insert("orders", {
        ...order,
        branchSlug: order.branchId,
        branchId: order.branchId,
        updatedAt: order.createdAt,
      });
    }

    const adminResult = await ensureDefaultAdmin(ctx);

    return {
      seeded: true,
      ...adminResult,
      note: "Run: npx convex run migrations/runAll:run to sync branches, menu, coupons, reservations, and orders.",
    };
  },
});
