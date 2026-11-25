import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";
import { getFunctionName } from "convex/server";

// Exercise the registered functions locally. No account, deployment or provider credentials are required.
const vite = await createServer({
  configFile: false,
  envDir: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: "custom",
});
after(() => vite.close());
const { chat } = await vite.ssrLoadModule("/convex/ai/chat.ts");
const { beginTurn, saveTurn } = await vite.ssrLoadModule("/convex/ai/messages.ts");
const { normalizeAndValidateOrderLines } = await vite.ssrLoadModule("/convex/lib/orderLineItems.ts");

function chatFixture() {
  const commits = [];
  const customer = {
    branchLabel: "Test Café",
    currency: "MYR",
    activeOrders: [],
    orderHistory: [],
    myReservations: [],
    activeCoupons: [],
    menuByCategory: [{ category: "Coffee", items: [{ name: "Espresso", price: 6.5, outOfStock: true }] }],
    branchHours: ["Monday 9–5"],
    branchList: [],
    points: 20,
    pointsToNextCoupon: 20,
    featuredItems: [],
    email: "fixture@example.invalid",
  };
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject: "test-user" }) },
    runQuery: async () => customer,
    runMutation: async (ref, args) => {
      if (getFunctionName(ref).endsWith(":beginTurn"))
        return { userId: "u1", history: [{ role: "user", content: "I prefer coffee" }] };
      commits.push(args);
      return "thread1";
    },
  };
  return { ctx, commits };
}

test("all six starters return database facts without contacting an AI provider", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => {
    throw Error("Unexpected network request");
  });
  const { ctx, commits } = chatFixture();
  for (const [message, expected] of [
    ["Show me today's full menu", /Espresso · MYR 6.50 \(out of stock\)/],
    ["Where is my order right now?", /no active orders/],
    ["What's featured today?", /no featured items/],
    ["How many loyalty points do I have?", /20 loyalty points/],
    ["What are the branch hours?", /Monday 9–5/],
    ["Do I have any reward coupons?", /no active reward coupons/],
  ]) {
    const result = await chat._handler(ctx, { message });
    assert.match(result.message, expected);
  }
  assert.equal(commits.length, 6);
  assert.equal(fetch.mock.callCount(), 0);
});

test("branch directory keeps each location's details together and skips the AI provider", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => { throw Error("Unexpected network request"); });
  const { DEFAULT_BRANCHES } = await vite.ssrLoadModule("/convex/lib/branchDefaults.ts");
  const { ctx } = chatFixture();
  ctx.runQuery = async () => ({ branchList: DEFAULT_BRANCHES });
  const { message } = await chat._handler(ctx, { message: "Show me all branches" });
  const entries = message.split("\n\n");
  assert.equal(entries.length, 3);
  for (const [index, branch] of DEFAULT_BRANCHES.entries()) {
    assert.ok(entries[index].startsWith("**" + branch.label + "**"));
    assert.ok(entries[index].includes(branch.address));
    assert.ok(branch.hours.every((hours) => entries[index].includes(hours)));
    assert.ok(!entries[index].includes(branch.slug));
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("free-form follow-ups use history and branch records, and provider failures leave no half-turn", async (t) => {
  const previous = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "test-only";
  t.after(() => {
    if (previous === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previous;
  });
  const { ctx, commits } = chatFixture();
  const fetch = t.mock.method(globalThis, "fetch", async (_url, options) => {
    const { messages } = JSON.parse(options.body);
    assert.equal(messages[1].content, "I prefer coffee");
    assert.match(messages.at(-1).content, /Espresso/);
    assert.doesNotMatch(options.body, /fixture@example.invalid/);
    return Response.json({ choices: [{ message: { content: "Try the featured coffee." } }] });
  });
  await chat._handler(ctx, { message: "What should I try?", threadId: "thread1" });
  assert.equal(commits[0].threadId, "thread1");
  fetch.mock.mockImplementation(async (_url, options) => {
    const body = JSON.parse(options.body);
    if (body.tools) {
      assert.doesNotMatch(options.body, /"points":20/);
      return Response.json({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "lookup",
                  type: "function",
                  function: { name: "read_my_account", arguments: JSON.stringify({ sections: ["rewards"] }) },
                },
              ],
            },
          },
        ],
      });
    }
    const result = body.messages.at(-1);
    assert.equal(result.tool_call_id, "lookup");
    assert.deepEqual(Object.keys(JSON.parse(result.content)), ["rewards"]);
    assert.equal(JSON.parse(result.content).rewards.points, 20);
    return Response.json({ choices: [{ message: { content: "You have 20 points." } }] });
  });
  assert.equal(
    (await chat._handler(ctx, { message: "What is my rewards balance?" })).message,
    "You have 20 points.",
  );
  fetch.mock.mockImplementation(async () => new Response(null, { status: 429 }));
  await assert.rejects(chat._handler(ctx, { message: "Another idea?" }), /busy/);
  assert.equal(commits.length, 2);
});

test("requests validate message length and sign-in before querying customer records", async () => {
  const { ctx, commits } = chatFixture();
  for (const message of [" ", "a".repeat(2001)])
    await assert.rejects(chat._handler(ctx, { message }), /2,000/);
  ctx.auth.getUserIdentity = async () => null;
  await assert.rejects(chat._handler(ctx, { message: "menu" }), /sign in/);
  assert.equal(commits.length, 0);
});

test("thread ownership and the per-account request limit are checked before history or writes", async () => {
  const user = { _id: "u1", chatRequestTimes: [] };
  const ctx = {
    db: {
      query: () => ({ withIndex: () => ({ unique: async () => user }) }),
      get: async () => ({ userId: "u2" }),
    },
  };
  await assert.rejects(beginTurn._handler(ctx, { clerkUserId: "c1", threadId: "other" }), /unavailable/);
  await assert.rejects(saveTurn._handler(ctx, { userId: "u1", threadId: "other" }), /unavailable/);
  user.chatRequestTimes = Array(10).fill(Date.now());
  await assert.rejects(beginTurn._handler(ctx, { clerkUserId: "c1" }), /wait a minute/);
});

test("checkout resolves legacy lines to branch catalog prices and enforces quantities and stock", async () => {
  const item = { _id: "item1", categoryId: "cat1", branchSlug: "a", name: "Coffee", price: 4, sortOrder: 1 };
  const db = {
    query: (table) => {
      const rows = table === "menuCategories" ? [{ _id: "cat1", active: true, sortOrder: 1 }] : [item];
      return { withIndex: () => ({ collect: async () => rows }), collect: async () => rows };
    },
  };
  const line = { name: "Coffee", price: 4, quantity: 2 };
  const order = (changes) => normalizeAndValidateOrderLines({ db }, [{ ...line, ...changes }], "a");
  assert.equal((await order({}))[0].price, 4);
  await assert.rejects(order({ price: 3 }), /price.*changed/);
  await assert.rejects(order({ quantity: 1.5 }), /quantity/);
  item.outOfStock = true;
  await assert.rejects(order({}), /unavailable/);
});

test("customer context keeps currencies separate and reads only owned or verified-email bookings", async () => {
  const { buildCustomerContext } = await vite.ssrLoadModule("/convex/ai/context.ts");
  const identity = { subject: "c1", email: "verified@example.invalid", emailVerified: true };
  const orders = ["MYR", "USD"].map((currency, i) => ({
    _id: "order" + i, clerkUserId: "c1", userId: "u1", status: "completed", total: 10,
    currency, createdAt: 1, items: [{ name: "Latte", price: 5, quantity: 1 }, { name: "Latte", price: 5, quantity: 1 }],
  }));
  const tables = {
    users: [{ _id: "u1", clerkUserId: "c1", email: "editable@example.invalid", points: 0 }],
    orders, reservations: [
      { clerkUserId: "c1", date: "owned", createdAt: 3 },
      { email: identity.email, date: "guest", createdAt: 2 },
      { clerkUserId: "someone-else", email: identity.email, date: "other", createdAt: 4 },
      { email: "editable@example.invalid", date: "editable", createdAt: 5 },
    ],
  };
  const ctx = { auth: {getUserIdentity: async () => identity}, db: { query(table) {
    let rows = [...(tables[table] ?? [])];
    const cursor = {
      withIndex(_index, select) {
        const builder = {eq(key, value) { rows = rows.filter((r) => r[key] === value); return builder; }};
        select?.(builder); return cursor;
      },
      order() {return cursor;}, take: async (n) => rows.slice(0, n),
      unique: async () => rows[0] ?? null, collect: async () => rows,
    };
    return cursor;
  } } };
  const read = () => buildCustomerContext._handler(ctx, { clerkUserId: "c1" });
  const data = await read();
  assert.deepEqual(data.spendingSummary.byCurrency.map((r) => [r.currency, r.totalSpent]), [["MYR",10],["USD",10]]);
  assert.equal(data.mostOrderedItems[0].orderedInXOrders, 2);
  assert.equal(data.mostOrderedItems[0].totalQuantity, 4);
  assert.deepEqual(data.myReservations.map((r) => r.date), ["owned","guest"]);
  identity.emailVerified = false;
  assert.deepEqual((await read()).myReservations.map((r) => r.date), ["owned"]);
});

test("new order alert persists without an AI service", async () => {
  const { notifyNewOrder } = await vite.ssrLoadModule("/convex/ai/adminAlert.ts");
  const writes = [];
  await notifyNewOrder._handler({db:{
    get: async () => ({orderNumber:"ORD-12",customerName:"Ari",items:[{quantity:3}],currency:"MYR",total:9}),
    insert: async (table,row) => writes.push({table,row}),
  }}, {orderId:"o1"});
  assert.equal(writes[0].table, "aiNotifications");
  assert.equal(writes[0].row.read, false);
  assert.match(writes[0].row.message, /3 items · MYR 9.00/);
});

test("customer alerts distinguish onboarding codes from a provider-verified contact number", async () => {
  const { getOrderForNotification } = await vite.ssrLoadModule("/convex/ai/notifyCustomer.ts");
  const phone = "+60100000000";
  const user = { phone, phoneVerified: true };
  const order = { _id: "o", userId: "u", customerPhone: phone, customerName: "Test Customer", status: "ready" };
  const ctx = { db: { get: async (id) => id === "o" ? order : user,
    query: () => ({withIndex: () => ({first: async () => null})}) } };
  const read = () => getOrderForNotification._handler(ctx, {orderId: "o"});
  assert.equal((await read()).phoneVerified, false);
  user.verifiedContactPhone = phone;
  assert.equal((await read()).phoneVerified, true);
  user.phone = "+60200000000";
  assert.equal((await read()).phoneVerified, false);
});

test("booking dates preserve calendar days and follow the shop schedule", async () => {
  const { calendarDate, bookingTimes, isCalendarDate, shopDate } = await vite.ssrLoadModule("/convex/lib/branchHours.ts");
  assert.equal(calendarDate(new Date(2026, 10, 25)), "2026-11-25");
  assert.equal(shopDate(Date.parse("2026-11-24T17:00:00Z")), "2026-11-25");
  assert.equal(isCalendarDate("2026-02-30"), false);
  assert.deepEqual(bookingTimes(["Monday – Friday: 9:00 AM – 11:00 PM", "Closed Saturday & Sunday"], "2026-11-28"), []);
  assert.deepEqual(bookingTimes(["Tuesday – Sunday: 5:00 PM – 11:00 PM", "Closed on Mondays"], "2026-11-30"), []);
  const saturday = bookingTimes(["Saturday: 3:00 PM – 10:00 PM", "Sunday – Friday: 11:00 AM – 11:00 PM"], "2026-11-28");
  assert.equal(saturday[0], "15:00");
  assert.equal(saturday.at(-1), "21:00");
});
