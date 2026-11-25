import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { sendSms } from "./channels/twilio";
import { placeCall } from "./channels/vapi";

/**
 * Phase B & C — Notify customer when order is ready
 *
 * When admin marks order as ready (preparing → ready):
 * 1. Load order + customer phone + aiOrderInsights
 * 2. GROQ drafts personalized ready message
 * 3. Send via Twilio SMS (primary)
 * 4. Optionally place VAPI voice call
 * 5. Log all attempts in aiNotificationLog
 */

export const getOrderForNotification = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Get customer details
    let customerPhone = order.customerPhone;
    let phoneVerified = false;
    let firstName = order.customerName.split(" ")[0];
    let notifyChannel: string = "sms"; // default

    if (order.userId) {
      const user = await ctx.db.get(order.userId);
      if (user) {
        customerPhone = user.phone || customerPhone;
        // The onboarding demo code alone does not establish control of this number.
        phoneVerified = Boolean(customerPhone && user.verifiedContactPhone === customerPhone);
        firstName = user.firstName || firstName;
        notifyChannel = user.notifyChannel ?? "sms";
      }
    }

    // Get branch info
    let branchLabel = order.branchSlug || "our branch";
    if (order.branchSlug) {
      const branch = await ctx.db
        .query("branches")
        .withIndex("by_slug", (q) => q.eq("slug", order.branchSlug!))
        .unique();
      if (branch) branchLabel = branch.label;
    }

    // Get GROQ insights from accept phase
    const insights = await ctx.db
      .query("aiOrderInsights")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone,
      phoneVerified,
      firstName,
      userId: order.userId,
      branchLabel,
      items: order.items,
      total: order.total,
      currency: order.currency || "USD",
      status: order.status,
      notifyChannel,
      insights: insights
        ? {
            preferredTone: insights.preferredTone,
            itemsSummary: insights.itemsSummary,
            analysisJson: insights.analysisJson,
          }
        : null,
    };
  },
});

export const logNotification = internalMutation({
  args: {
    orderId: v.id("orders"),
    channel: v.union(v.literal("sms"), v.literal("call")),
    provider: v.union(v.literal("twilio"), v.literal("vapi")),
    externalId: v.optional(v.string()),
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiNotificationLog", {
      orderId: args.orderId,
      channel: args.channel,
      provider: args.provider,
      externalId: args.externalId,
      status: args.status,
      error: args.error,
      createdAt: Date.now(),
    });
  },
});

/**
 * Main action — called when order status becomes "ready"
 */
export const notifyOrderReady = internalAction({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(
      internal.ai.notifyCustomer.getOrderForNotification,
      { orderId: args.orderId },
    );

    if (!order) {
      console.warn("notifyOrderReady: order not found", args.orderId);
      return { sent: false, reason: "Order not found" };
    }

    if (order.status !== "ready") return { sent: false, reason: "Order is no longer ready" };

    // Skip if no phone
    if (!order.customerPhone) {
      console.warn(`Order ${order.orderNumber}: no phone number, skipping notification`);
      return { sent: false, reason: "No phone number on file" };
    }

    // Skip if phone not verified (security — don't send to unverified numbers)
    const bypassVerification = process.env.BYPASS_PHONE_VERIFICATION === "true";
    if (!order.phoneVerified && !bypassVerification) {
      console.warn(`Order ${order.orderNumber}: phone not verified, skipping notification`);
      return { sent: false, reason: "Phone not verified" };
    }

    // Build personalized message with GROQ
    const message = await buildReadyMessage(order);

    // Determine channels to use
    const channel = order.notifyChannel || "sms";
    const results: Array<{ channel: string; success: boolean; id?: string; error?: string }> = [];

    // Always send SMS unless "call" only
    if (channel === "sms" || channel === "both") {
      const smsResult = await sendSms({
        to: order.customerPhone,
        message,
      });

      await ctx.runMutation(internal.ai.notifyCustomer.logNotification, {
        orderId: args.orderId,
        channel: "sms",
        provider: "twilio",
        externalId: smsResult.sid,
        status: smsResult.success ? "sent" : "failed",
        error: smsResult.error,
      });

      results.push({ channel: "sms", ...smsResult });
      console.log(`SMS to ${order.orderNumber}: ${smsResult.success ? "sent" : "failed"}`);
    }

    // Place voice call if configured
    if (channel === "call" || channel === "both") {
      const callResult = await placeCall({
        to: order.customerPhone,
        message,
        customerName: order.firstName,
      });

      await ctx.runMutation(internal.ai.notifyCustomer.logNotification, {
        orderId: args.orderId,
        channel: "call",
        provider: "vapi",
        externalId: callResult.callId,
        status: callResult.success ? "sent" : "failed",
        error: callResult.error,
      });

      results.push({ channel: "call", ...callResult });
      console.log(`VAPI call to ${order.orderNumber}: ${callResult.success ? "sent" : "failed"}`);
    }

    return {
      sent: results.some((r) => r.success),
      results,
      message,
    };
  },
});

async function buildReadyMessage(order: {
  firstName: string;
  orderNumber: string;
  branchLabel: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  currency: string;
  insights: {
    preferredTone?: string;
    itemsSummary?: string;
  } | null;
}): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;

  // Fallback message if GROQ not available
  const fallback = `Hi ${order.firstName}! Your order #${order.orderNumber} is ready for pickup at ${order.branchLabel}. Please collect it at your earliest convenience.`;

  if (!groqApiKey) {
    return fallback;
  }

  const tone = order.insights?.preferredTone || "friendly";
  const itemsSummary =
    order.insights?.itemsSummary ||
    order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ");

  const prompt = `Write a short, ${tone} SMS notification for a café customer.

Details:
- Customer first name: ${order.firstName}
- Order number: ${order.orderNumber}
- Branch: ${order.branchLabel}
- Items: ${itemsSummary}
- Total: ${order.currency} ${order.total.toFixed(2)}

Rules:
- Keep it under 160 characters (one SMS)
- Be warm and ${tone}
- Include the order number and branch name
- Tell them to come collect their order
- Do NOT include URLs or links
- Write only the message text, nothing else`;

  try {
    const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error("GROQ message build error:", await response.text());
      return fallback;
    }

    const data = await response.json();
    const msg = data.choices?.[0]?.message?.content?.trim();
    return msg || fallback;
  } catch (error) {
    console.error("buildReadyMessage error:", error);
    return fallback;
  }
}
