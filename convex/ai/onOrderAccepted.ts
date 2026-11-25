import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Phase A — AI Learning on Accept
 *
 * When admin accepts an order (pending → confirmed), GROQ analyzes:
 * - Items ordered
 * - Time of day
 * - Customer history
 * - Branch context
 *
 * Stores insights in `aiOrderInsights` for use when order becomes ready.
 */

export const getOrderForAnalysis = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Get customer history
    let customerHistory: { totalOrders: number; points: number; firstName?: string } = {
      totalOrders: 0,
      points: 0,
    };

    if (order.userId) {
      const user = await ctx.db.get(order.userId);
      if (user) {
        customerHistory = {
          totalOrders: user.totalOrders,
          points: user.points,
          firstName: user.firstName,
        };
      }
    }

    // Get branch info
    let branchLabel = order.branchSlug || "Unknown";
    if (order.branchSlug) {
      const branch = await ctx.db
        .query("branches")
        .withIndex("by_slug", (q) => q.eq("slug", order.branchSlug!))
        .unique();
      if (branch) branchLabel = branch.label;
    }

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      userId: order.userId,
      branchLabel,
      branchSlug: order.branchSlug,
      items: order.items,
      total: order.total,
      currency: order.currency || "USD",
      createdAt: order.createdAt,
      customerHistory,
    };
  },
});

export const saveInsights = internalMutation({
  args: {
    orderId: v.id("orders"),
    userId: v.optional(v.id("users")),
    analysisJson: v.string(),
    groqModel: v.string(),
    preferredTone: v.optional(v.string()),
    itemsSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Remove old insights for this order if any
    const existing = await ctx.db
      .query("aiOrderInsights")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    return await ctx.db.insert("aiOrderInsights", {
      orderId: args.orderId,
      userId: args.userId,
      acceptedAt: Date.now(),
      analysisJson: args.analysisJson,
      groqModel: args.groqModel,
      preferredTone: args.preferredTone,
      itemsSummary: args.itemsSummary,
    });
  },
});

export const getInsightsForOrder = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiOrderInsights")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});

/**
 * Main action — called when admin accepts an order.
 * Analyzes the order with GROQ and stores insights.
 */
export const analyzeAcceptedOrder = internalAction({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(internal.ai.onOrderAccepted.getOrderForAnalysis, {
      orderId: args.orderId,
    });

    if (!order) {
      console.warn("analyzeAcceptedOrder: order not found", args.orderId);
      return null;
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.warn("GROQ_API_KEY not set - skipping order analysis");
      return null;
    }

    const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

    const timeOfDay = new Date(order.createdAt).getHours();
    const timeLabel =
      timeOfDay < 12 ? "morning" : timeOfDay < 17 ? "afternoon" : "evening";

    const isRegular = order.customerHistory.totalOrders > 3;
    const customerLabel = isRegular
      ? `returning customer (${order.customerHistory.totalOrders} orders)`
      : "new customer";

    const itemsList = order.items
      .map((i) => `${i.quantity}× ${i.name} (${order.currency} ${i.price.toFixed(2)})`)
      .join(", ");

    const prompt = `You are an AI assistant for Kafe Eman café. Analyze this accepted order and return a JSON object.

Order details:
- Order: ${order.orderNumber}
- Customer: ${order.customerName} (${customerLabel})
- Branch: ${order.branchLabel}
- Time: ${timeLabel}
- Items: ${itemsList}
- Total: ${order.currency} ${order.total.toFixed(2)}

Return ONLY a valid JSON object with these fields:
{
  "preferredTone": "friendly|professional|warm",
  "itemsSummary": "brief 1-sentence description of what was ordered",
  "estimatedPrepNote": "brief prep time estimate based on items",
  "readyMessageHint": "personalized hint for the ready notification message"
}`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 300,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        console.error("GROQ analysis error:", await response.text());
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";

      let analysis: {
        preferredTone?: string;
        itemsSummary?: string;
        estimatedPrepNote?: string;
        readyMessageHint?: string;
      } = {};

      try {
        analysis = JSON.parse(content);
      } catch {
        console.error("Failed to parse GROQ analysis JSON:", content);
      }

      await ctx.runMutation(internal.ai.onOrderAccepted.saveInsights, {
        orderId: args.orderId,
        userId: order.userId,
        analysisJson: content,
        groqModel,
        preferredTone: analysis.preferredTone,
        itemsSummary: analysis.itemsSummary,
      });

      console.log(`Order ${order.orderNumber} analyzed successfully`);
      return analysis;
    } catch (error) {
      console.error("analyzeAcceptedOrder error:", error);
      return null;
    }
  },
});
