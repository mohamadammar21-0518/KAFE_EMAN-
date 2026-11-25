import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  isSuperAdmin,
  normalizeAdminRole,
  requireAdmin,
  requireCanDelete,
  requireSuperAdmin,
  sessionExpiresAt,
} from "./lib/adminAuth";
import { generateSecureToken, hashPassword, hashToken, verifyPassword } from "./lib/password";
import { maskClerkUserId } from "./lib/referenceIds";
import { branchSlug } from "./lib/validators";

const adminTokenArg = { adminToken: v.string() };

export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    if (!username || !args.password) {
      throw new Error("Username and password are required.");
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (!admin || !admin.active) {
      throw new Error("Invalid username or password.");
    }

    const valid = await verifyPassword(args.password, admin.passwordHash, admin.passwordSalt);
    if (!valid) {
      throw new Error("Invalid username or password.");
    }

    const token = generateSecureToken();
    const tokenHash = await hashToken(token);
    const now = Date.now();
    const expiresAt = sessionExpiresAt(now);

    await ctx.db.insert("adminSessions", {
      adminId: admin._id,
      tokenHash,
      expiresAt,
      createdAt: now,
    });

    await ctx.db.patch(admin._id, { updatedAt: now });

    return {
      token,
      expiresAt,
      admin: {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
        email: admin.email,
        role: normalizeAdminRole(admin.role),
      },
    };
  },
});

export const logout = mutation({
  args: adminTokenArg,
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.adminToken.trim());
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { ok: true };
  },
});

export const validateSession = query({
  args: adminTokenArg,
  handler: async (ctx, args) => {
    try {
      const { admin } = await requireAdmin(ctx, args.adminToken);
      return {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
        email: admin.email,
        role: normalizeAdminRole(admin.role),
      };
    } catch {
      return null;
    }
  },
});

export const listCustomers = query({
  args: {
    ...adminTokenArg,
    /** Filter by home branch slug, or `__none__` for users without a branch. */
    branchSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const filter = args.branchSlug?.trim();
    let users =
      filter && filter !== "__none__"
        ? await ctx.db
            .query("users")
            .withIndex("by_branch", (q) => q.eq("branchSlug", filter))
            .collect()
        : await ctx.db.query("users").collect();

    if (filter === "__none__") {
      users = users.filter((u) => !u.branchSlug);
    }

    return users
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((u) => ({
        _id: u._id,
        branchSlug: u.branchSlug,
        clerkUserIdMasked: maskClerkUserId(u.clerkUserId),
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        dateOfBirth: u.dateOfBirth,
        country: u.country,
        region: u.region,
        city: u.city,
        address: u.address,
        avatarUrl: u.avatarUrl,
        points: u.points,
        totalOrders: u.totalOrders,
        active: u.active !== false,
        suspendedUntil: u.suspendedUntil,
        suspensionReason: u.suspensionReason,
        onboardingComplete: u.onboardingComplete ?? false,
        phoneVerified: u.phoneVerified ?? false,
        welcomeBonusGranted: u.welcomeBonusGranted ?? false,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
  },
});

export const getCustomer = query({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .collect();

    const coupons = await ctx.db
      .query("coupons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      ...user,
      active: user.active !== false,
      orders: orders.sort((a, b) => b.createdAt - a.createdAt),
      activeCoupons: coupons.filter((c) => !c.redeemed).length,
    };
  },
});

export const setCustomerBranch = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    branchSlug: v.union(branchSlug, v.literal("")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");

    const slug = args.branchSlug.trim();
    if (slug) {
      const branch = await ctx.db
        .query("branches")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!branch) throw new Error("Branch not found.");
    }

    await ctx.db.patch(args.userId, {
      branchSlug: slug || undefined,
      updatedAt: Date.now(),
    });
  },
});

export const setCustomerActive = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");
    await ctx.db.patch(args.userId, {
      active: args.active,
      updatedAt: Date.now(),
      ...(args.active
        ? { suspendedUntil: undefined, suspensionReason: undefined }
        : {}),
    });
  },
});

const suspendDurationUnit = v.union(
  v.literal("hours"),
  v.literal("days"),
);

export const suspendCustomer = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    duration: v.number(),
    unit: suspendDurationUnit,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");

    const amount = Math.floor(args.duration);
    if (amount < 1 || amount > 365) {
      throw new Error("Duration must be between 1 and 365.");
    }

    const msPerUnit = args.unit === "hours" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const now = Date.now();
    const base = user.suspendedUntil && user.suspendedUntil > now ? user.suspendedUntil : now;
    const suspendedUntil = base + amount * msPerUnit;

    await ctx.db.patch(args.userId, {
      active: true,
      suspendedUntil,
      suspensionReason: args.reason?.trim() || undefined,
      updatedAt: now,
    });

    return { suspendedUntil };
  },
});

export const clearCustomerSuspension = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");
    await ctx.db.patch(args.userId, {
      suspendedUntil: undefined,
      suspensionReason: undefined,
      updatedAt: Date.now(),
    });
  },
});

function usernameFromEmail(email: string): string {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  const base = local.replace(/[^a-z0-9._-]/g, "").slice(0, 28);
  return base || "staff";
}

function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export const getMyAccount = query({
  args: adminTokenArg,
  handler: async (ctx, args) => {
    const { admin } = await requireAdmin(ctx, args.adminToken);
    return {
      _id: admin._id,
      username: admin.username,
      displayName: admin.displayName,
      email: admin.email ?? "",
      role: normalizeAdminRole(admin.role),
      active: admin.active,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  },
});

export const updateMyAccount = mutation({
  args: {
    adminToken: v.string(),
    displayName: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { admin } = await requireAdmin(ctx, args.adminToken);

    const displayName = args.displayName.trim();
    const email = args.email.trim().toLowerCase();
    if (!displayName) throw new Error("Name is required.");
    if (!email || !email.includes("@")) throw new Error("A valid email is required.");

    if (email !== (admin.email ?? "").toLowerCase()) {
      const emailTaken = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      if (emailTaken && emailTaken._id !== admin._id) {
        throw new Error("Another account already uses this email.");
      }
    }

    await ctx.db.patch(admin._id, {
      displayName,
      email,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const changeMyPassword = mutation({
  args: {
    adminToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { admin } = await requireAdmin(ctx, args.adminToken);

    if (!args.currentPassword || !args.newPassword) {
      throw new Error("Current and new password are required.");
    }
    if (args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters.");
    }

    const valid = await verifyPassword(
      args.currentPassword,
      admin.passwordHash,
      admin.passwordSalt,
    );
    if (!valid) {
      throw new Error("Current password is incorrect.");
    }

    const { hash, salt } = await hashPassword(args.newPassword);
    await ctx.db.patch(admin._id, {
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const listStaff = query({
  args: adminTokenArg,
  handler: async (ctx, args) => {
    const { admin: actor } = await requireAdmin(ctx, args.adminToken);
    const rows = await ctx.db.query("admins").collect();
    return rows
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((a) => ({
        _id: a._id,
        username: a.username,
        displayName: a.displayName,
        email: a.email ?? "",
        role: normalizeAdminRole(a.role),
        active: a.active,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        isSelf: a._id === actor._id,
      }));
  },
});

export const createStaff = mutation({
  args: {
    adminToken: v.string(),
    displayName: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { admin: actor } = await requireSuperAdmin(ctx, args.adminToken);

    const displayName = args.displayName.trim();
    const email = args.email.trim().toLowerCase();
    if (!displayName || !email || !email.includes("@")) {
      throw new Error("Name and a valid email are required.");
    }

    const emailTaken = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (emailTaken) {
      throw new Error("An account with this email already exists.");
    }

    let username = usernameFromEmail(email);
    const existingUsernames = new Set(
      (await ctx.db.query("admins").collect()).map((a) => a.username),
    );
    if (existingUsernames.has(username)) {
      let n = 2;
      while (existingUsernames.has(`${username}${n}`)) n += 1;
      username = `${username}${n}`;
    }

    const temporaryPassword = generateTemporaryPassword();
    const { hash, salt } = await hashPassword(temporaryPassword);
    const now = Date.now();

    const staffId = await ctx.db.insert("admins", {
      username,
      passwordHash: hash,
      passwordSalt: salt,
      displayName,
      email,
      role: "staff",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(actor._id, { updatedAt: now });

    return {
      staffId,
      username,
      email,
      displayName,
      temporaryPassword,
    };
  },
});

export const setStaffActive = mutation({
  args: {
    adminToken: v.string(),
    staffId: v.id("admins"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { admin: actor } = await requireSuperAdmin(ctx, args.adminToken);
    const target = await ctx.db.get(args.staffId);
    if (!target) throw new Error("Staff account not found.");
    if (target._id === actor._id) {
      throw new Error("You cannot deactivate your own account.");
    }
    if (isSuperAdmin(target) && !args.active) {
      throw new Error("Super admin accounts cannot be deactivated here.");
    }
    await ctx.db.patch(args.staffId, {
      active: args.active,
      updatedAt: Date.now(),
    });
  },
});

export const removeStaff = mutation({
  args: {
    adminToken: v.string(),
    staffId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const { admin: actor } = await requireSuperAdmin(ctx, args.adminToken);
    const target = await ctx.db.get(args.staffId);
    if (!target) throw new Error("Staff account not found.");
    if (target._id === actor._id) {
      throw new Error("You cannot remove your own account.");
    }
    if (isSuperAdmin(target)) {
      throw new Error("Super admin accounts cannot be removed.");
    }

    const sessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_admin", (q) => q.eq("adminId", target._id))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    await ctx.db.delete(target._id);
  },
});

export const deleteCustomer = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireCanDelete(ctx, args.adminToken);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");

    const coupons = await ctx.db
      .query("coupons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const c of coupons) await ctx.db.delete(c._id);

    await ctx.db.patch(user._id, {
      active: false,
      email: `deleted+${user._id}@removed.local`,
      clerkUserId: `deleted_${user.clerkUserId}`,
      updatedAt: Date.now(),
    });
  },
});
