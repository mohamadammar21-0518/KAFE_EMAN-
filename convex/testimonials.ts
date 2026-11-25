import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/adminAuth";
import {
  displayNameFromUser,
  resolveTestimonialImageUrl,
} from "./lib/testimonialHelpers";
import {
  testimonialSource,
  testimonialStatus,
  testimonialTargetType,
  branchSlug,
} from "./lib/validators";
import { getOrCreateUser, requireIdentity } from "./lib/users";

const adminToken = v.string();

function clampRating(value: number) {
  const n = Math.round(value);
  if (n < 1 || n > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }
  return n;
}

function resolveSource(row: { source?: "client" | "staff" }) {
  return row.source ?? "client";
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const generateStaffUploadUrl = mutation({
  args: { adminToken },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    return await ctx.storage.generateUploadUrl();
  },
});

export const submit = mutation({
  args: {
    rating: v.number(),
    text: v.string(),
    subtitle: v.optional(v.string()),
    targetType: testimonialTargetType,
    categoryId: v.optional(v.id("menuCategories")),
    menuItemId: v.optional(v.id("menuItems")),
    branchSlug: v.optional(branchSlug),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const user = await getOrCreateUser(ctx, identity);

    const text = args.text.trim();
    if (text.length < 10) {
      throw new Error("Please write at least 10 characters for your feedback.");
    }

    const rating = clampRating(args.rating);
    const slug = args.branchSlug?.trim() || user.branchSlug;

    if (args.targetType === "category" && !args.categoryId) {
      throw new Error("Please select a menu category.");
    }
    if (args.targetType === "menuItem" && !args.menuItemId) {
      throw new Error("Please select a menu item.");
    }

    let targetLabel: string | undefined;
    if (args.targetType === "category" && args.categoryId) {
      const cat = await ctx.db.get(args.categoryId);
      if (!cat) throw new Error("Category not found.");
      targetLabel = cat.label;
    } else if (args.targetType === "menuItem" && args.menuItemId) {
      const item = await ctx.db.get(args.menuItemId);
      if (!item) throw new Error("Menu item not found.");
      targetLabel = item.name;
    } else if (args.targetType === "all") {
      targetLabel = "Overall experience";
    }

    const imageUrl = await resolveTestimonialImageUrl(ctx, {
      targetType: args.targetType,
      categoryId: args.categoryId,
      menuItemId: args.menuItemId,
      branchSlug: slug,
      imageStorageId: args.imageStorageId,
    });

    const now = Date.now();
    return await ctx.db.insert("testimonials", {
      source: "client",
      userId: user._id,
      clerkUserId: identity.subject,
      authorName: displayNameFromUser(user),
      subtitle: args.subtitle?.trim() || undefined,
      rating,
      text,
      targetType: args.targetType,
      categoryId: args.categoryId,
      menuItemId: args.menuItemId,
      targetLabel,
      branchSlug: slug,
      imageUrl,
      imageStorageId: args.imageStorageId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Staff-created testimonial (Actual tab) — starts pending like client submissions. */
export const createStaff = mutation({
  args: {
    adminToken,
    authorName: v.string(),
    subtitle: v.optional(v.string()),
    rating: v.number(),
    text: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    branchSlug: v.optional(branchSlug),
    targetLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { admin } = await requireAdmin(ctx, args.adminToken);

    const authorName = args.authorName.trim();
    const text = args.text.trim();
    if (!authorName) throw new Error("Guest name is required.");
    if (text.length < 10) {
      throw new Error("Please write at least 10 characters for the testimonial.");
    }

    const rating = clampRating(args.rating);
    const slug = args.branchSlug?.trim();
    const imageUrl =
      args.imageUrl?.trim() ||
      (await resolveTestimonialImageUrl(ctx, {
        targetType: "all",
        branchSlug: slug,
        imageStorageId: args.imageStorageId,
      }));

    const now = Date.now();
    return await ctx.db.insert("testimonials", {
      source: "staff",
      authorName,
      subtitle: args.subtitle?.trim() || undefined,
      rating,
      text,
      targetType: "all",
      targetLabel: args.targetLabel?.trim() || "Featured guest",
      branchSlug: slug,
      imageUrl,
      imageStorageId: args.imageStorageId,
      status: "pending",
      createdByAdminId: admin._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Published testimonials for the home page carousel. */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("testimonials")
      .withIndex("by_status_sort", (q) => q.eq("status", "accepted"))
      .collect();

    return rows
      .sort((a, b) => {
        const ao = a.sortOrder ?? a.acceptedAt ?? a.createdAt;
        const bo = b.sortOrder ?? b.acceptedAt ?? b.createdAt;
        return ao - bo;
      })
      .map((row) => ({
        _id: row._id,
        text: row.text,
        author: row.authorName,
        role: row.subtitle ?? row.targetLabel ?? "Guest",
        rating: row.rating,
        image: row.imageUrl,
        targetLabel: row.targetLabel,
        source: resolveSource(row),
      }));
  },
});

export const listForAdmin = query({
  args: {
    adminToken,
    source: v.optional(testimonialSource),
    status: v.optional(testimonialStatus),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    let rows;
    if (args.source && args.status) {
      rows = await ctx.db
        .query("testimonials")
        .withIndex("by_source_created", (q) => q.eq("source", args.source!))
        .collect();
      rows = rows.filter((r) => r.status === args.status);
    } else if (args.source) {
      rows = await ctx.db
        .query("testimonials")
        .withIndex("by_source_created", (q) => q.eq("source", args.source!))
        .collect();
    } else if (args.status) {
      rows = await ctx.db
        .query("testimonials")
        .withIndex("by_status_created", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      rows = await ctx.db.query("testimonials").collect();
    }

    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((row) => ({
        ...row,
        source: resolveSource(row),
      }));
  },
});

export const accept = mutation({
  args: {
    adminToken,
    testimonialId: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    const { admin } = await requireAdmin(ctx, args.adminToken);
    const row = await ctx.db.get(args.testimonialId);
    if (!row) throw new Error("Testimonial not found.");
    if (row.status === "accepted") return row._id;

    const accepted = await ctx.db
      .query("testimonials")
      .withIndex("by_status_sort", (q) => q.eq("status", "accepted"))
      .collect();
    const maxSort = accepted.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), 0);
    const now = Date.now();

    await ctx.db.patch(args.testimonialId, {
      status: "accepted",
      sortOrder: maxSort + 1,
      acceptedAt: now,
      reviewedByAdminId: admin._id,
      updatedAt: now,
    });
    return args.testimonialId;
  },
});

export const reject = mutation({
  args: {
    adminToken,
    testimonialId: v.id("testimonials"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { admin } = await requireAdmin(ctx, args.adminToken);
    const row = await ctx.db.get(args.testimonialId);
    if (!row) throw new Error("Testimonial not found.");

    const reason = args.reason.trim();
    if (reason.length < 3) {
      throw new Error("Please provide a reason for rejection (at least 3 characters).");
    }

    await ctx.db.patch(args.testimonialId, {
      status: "rejected",
      rejectReason: reason,
      reviewedByAdminId: admin._id,
      updatedAt: Date.now(),
    });
  },
});

/** Any active admin or staff may delete testimonials. */
export const remove = mutation({
  args: {
    adminToken,
    testimonialId: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const row = await ctx.db.get(args.testimonialId);
    if (!row) throw new Error("Testimonial not found.");
    if (row.imageStorageId) {
      await ctx.storage.delete(row.imageStorageId);
    }
    await ctx.db.delete(args.testimonialId);
  },
});
