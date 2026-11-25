import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { placeCall } from "./channels/vapi";
import { sendSms } from "./channels/twilio";
import { hashToken } from "../lib/password";

/**
 * Internal query to validate admin token inside an action context.
 * Actions can't call requireAdmin directly (no db), so we use runQuery.
 */
export const validateAdminToken = internalQuery({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.adminToken?.trim()) return null;
    const tokenHash = await hashToken(args.adminToken.trim());
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!session || session.expiresAt < Date.now()) return null;
    const admin = await ctx.db.get(session.adminId);
    if (!admin || !admin.active) return null;
    return { adminId: admin._id, role: admin.role };
  },
});

/** Place a real Vapi test call */
export const testVapiCall = action({
  args: {
    adminToken: v.string(),
    phoneNumber: v.string(),
    message: v.optional(v.string()),
    customerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.ai.testVapi.validateAdminToken, {
      adminToken: args.adminToken,
    });
    if (!admin) throw new Error("Invalid or expired admin session.");

    const message =
      args.message?.trim() ||
      "Hello! This is a test call from Kafe Eman. Your AI voice notification system is working correctly. Thank you!";

    const result = await placeCall({
      to: args.phoneNumber.trim(),
      message,
      customerName: args.customerName?.trim() || "Valued Customer",
    });

    return {
      channel: "call" as const,
      provider: "vapi" as const,
      success: result.success,
      callId: result.callId,
      error: result.error,
      phoneNumber: args.phoneNumber.trim(),
      message,
    };
  },
});

/** Send a real Twilio test SMS */
export const testTwilioSms = action({
  args: {
    adminToken: v.string(),
    phoneNumber: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.ai.testVapi.validateAdminToken, {
      adminToken: args.adminToken,
    });
    if (!admin) throw new Error("Invalid or expired admin session.");

    const message =
      args.message?.trim() ||
      "Hello from Kafe Eman! Your SMS notification system is working correctly. 🎉";

    const result = await sendSms({
      to: args.phoneNumber.trim(),
      message,
    });

    return {
      channel: "sms" as const,
      provider: "twilio" as const,
      success: result.success,
      sid: result.sid,
      error: result.error,
      phoneNumber: args.phoneNumber.trim(),
      message,
    };
  },
});

/** Returns which env vars are present (not their values) */
export const getIntegrationStatus = action({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.ai.testVapi.validateAdminToken, {
      adminToken: args.adminToken,
    });
    if (!admin) throw new Error("Invalid or expired admin session.");

    return {
      vapi: {
        apiKey: !!process.env.VAPI_API_KEY,
        phoneNumberId: !!process.env.VAPI_PHONE_NUMBER_ID,
        assistantId: !!process.env.VAPI_ASSISTANT_ID,
        configured: !!(process.env.VAPI_API_KEY && process.env.VAPI_PHONE_NUMBER_ID),
      },
      twilio: {
        accountSid: !!process.env.TWILIO_ACCOUNT_SID,
        authToken: !!process.env.TWILIO_AUTH_TOKEN,
        fromNumber: !!process.env.TWILIO_MESSAGING_FROM,
        configured: !!(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_MESSAGING_FROM
        ),
      },
      groq: {
        apiKey: !!process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        configured: !!process.env.GROQ_API_KEY,
      },
    };
  },
});
