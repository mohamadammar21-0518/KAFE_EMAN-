import { bookingTimes, isCalendarDate, shopDate } from "./lib/branchHours";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireCanDelete } from "./lib/adminAuth";
import { branchSlug, reservationClosureOutcome } from "./lib/validators";

const adminToken = v.string();

const activeReservationStatus = v.union(
  v.literal("pending"),
  v.literal("progressing"),
  v.literal("cancelled"),
  v.literal("closed"),
);

export const create = mutation({
  args: {
    branchSlug: v.optional(branchSlug),
    /** @deprecated Pass branchSlug */
    branchId: v.optional(branchSlug),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    date: v.string(),
    time: v.string(),
    guests: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim() || !args.email.trim() || !args.phone.trim()) {
      throw new Error("Name, email, and phone are required.");
    }
    if (!args.date.trim() || !args.time.trim()) {
      throw new Error("Date and time are required.");
    }

    if (!Number.isInteger(args.guests) || args.guests < 1 || args.guests > 20) {
      throw new Error("Guest count must be between 1 and 20.");
    }

    const identity = await ctx.auth.getUserIdentity();
    const slug = (args.branchSlug ?? args.branchId)?.trim() || undefined;
    const now = Date.now();
    if (!slug) throw new Error("Please select a branch.");
    const branch = await ctx.db.query("branches").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!branch?.active) throw new Error("This branch is unavailable.");
    if (!isCalendarDate(args.date) || args.date < shopDate(now)) {
      throw new Error("Choose today or a future date.");
    }
    if (!bookingTimes(branch.hours, args.date).includes(args.time)) {
      throw new Error("Choose a booking time within this branch’s opening hours.");
    }

    return await ctx.db.insert("reservations", {
      clerkUserId: identity?.subject,
      branchSlug: slug,
      name: args.name.trim(),
      email: args.email.trim(),
      phone: args.phone.trim(),
      date: args.date.trim(),
      time: args.time.trim(),
      guests: args.guests,
      notes: args.notes?.trim() || undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const list = query({
  args: { adminToken },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const rows = await ctx.db.query("reservations").withIndex("by_created").order("desc").collect();
    return rows;
  },
});

export const updateStatus = mutation({
  args: {
    adminToken,
    reservationId: v.id("reservations"),
    status: activeReservationStatus,
    statusReason: v.optional(v.string()),
    closureOutcome: v.optional(reservationClosureOutcome),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const row = await ctx.db.get(args.reservationId);
    if (!row) throw new Error("Reservation not found.");

    const reason = args.statusReason?.trim();

    if (args.status === "cancelled" && !reason) {
      throw new Error("Please provide a reason for cancellation.");
    }
    if (args.status === "closed" && !args.closureOutcome) {
      throw new Error("Please select how this reservation was closed.");
    }

    const patch: {
      status: typeof args.status;
      updatedAt: number;
      statusReason?: string;
      closureOutcome?: typeof args.closureOutcome;
    } = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "cancelled") {
      patch.statusReason = reason;
      patch.closureOutcome = undefined;
    } else if (args.status === "closed") {
      patch.closureOutcome = args.closureOutcome;
      patch.statusReason = reason || undefined;
    } else {
      patch.statusReason = undefined;
      patch.closureOutcome = undefined;
    }

    await ctx.db.patch(args.reservationId, patch);
  },
});

export const remove = mutation({
  args: {
    adminToken,
    reservationId: v.id("reservations"),
  },
  handler: async (ctx, args) => {
    await requireCanDelete(ctx, args.adminToken);
    const row = await ctx.db.get(args.reservationId);
    if (!row) throw new Error("Reservation not found.");
    await ctx.db.delete(args.reservationId);
    return { ok: true };
  },
});
