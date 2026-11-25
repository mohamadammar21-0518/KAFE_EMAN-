/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminDashboard from "../adminDashboard.js";
import type * as admins from "../admins.js";
import type * as ai_adminAlert from "../ai/adminAlert.js";
import type * as ai_channels_twilio from "../ai/channels/twilio.js";
import type * as ai_channels_vapi from "../ai/channels/vapi.js";
import type * as ai_chat from "../ai/chat.js";
import type * as ai_context from "../ai/context.js";
import type * as ai_messages from "../ai/messages.js";
import type * as ai_notifications from "../ai/notifications.js";
import type * as ai_notifyCustomer from "../ai/notifyCustomer.js";
import type * as ai_onOrderAccepted from "../ai/onOrderAccepted.js";
import type * as ai_testVapi from "../ai/testVapi.js";
import type * as ai_threads from "../ai/threads.js";
import type * as ai_userChat from "../ai/userChat.js";
import type * as branches from "../branches.js";
import type * as contactMessages from "../contactMessages.js";
import type * as faqs from "../faqs.js";
import type * as faqsAdmin from "../faqsAdmin.js";
import type * as health from "../health.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_applyCoupon from "../lib/applyCoupon.js";
import type * as lib_branchDefaults from "../lib/branchDefaults.js";
import type * as lib_branchHours from "../lib/branchHours.js";
import type * as lib_branchMenu from "../lib/branchMenu.js";
import type * as lib_couponCodes from "../lib/couponCodes.js";
import type * as lib_coupons from "../lib/coupons.js";
import type * as lib_currency from "../lib/currency.js";
import type * as lib_entityIds from "../lib/entityIds.js";
import type * as lib_identity from "../lib/identity.js";
import type * as lib_loyalty from "../lib/loyalty.js";
import type * as lib_menuItemHelpers from "../lib/menuItemHelpers.js";
import type * as lib_menuStockImages from "../lib/menuStockImages.js";
import type * as lib_orderLineItems from "../lib/orderLineItems.js";
import type * as lib_orderNumbers from "../lib/orderNumbers.js";
import type * as lib_orderStatusFlow from "../lib/orderStatusFlow.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_referenceIds from "../lib/referenceIds.js";
import type * as lib_slug from "../lib/slug.js";
import type * as lib_tableRegistry from "../lib/tableRegistry.js";
import type * as lib_testimonialHelpers from "../lib/testimonialHelpers.js";
import type * as lib_userAccess from "../lib/userAccess.js";
import type * as lib_users from "../lib/users.js";
import type * as lib_validators from "../lib/validators.js";
import type * as menuCatalog from "../menuCatalog.js";
import type * as menuCategories from "../menuCategories.js";
import type * as menuItems from "../menuItems.js";
import type * as menuItemsAdmin from "../menuItemsAdmin.js";
import type * as migrations_alignAppData from "../migrations/alignAppData.js";
import type * as migrations_backfillCouponCodes from "../migrations/backfillCouponCodes.js";
import type * as migrations_backfillMenuImages from "../migrations/backfillMenuImages.js";
import type * as migrations_backfillOrders from "../migrations/backfillOrders.js";
import type * as migrations_backfillUsers from "../migrations/backfillUsers.js";
import type * as migrations_lib_steps from "../migrations/lib/steps.js";
import type * as migrations_migrateReservationStatuses from "../migrations/migrateReservationStatuses.js";
import type * as migrations_normalizeOrderLineItemIds from "../migrations/normalizeOrderLineItemIds.js";
import type * as migrations_runAll from "../migrations/runAll.js";
import type * as orders from "../orders.js";
import type * as reservations from "../reservations.js";
import type * as seed from "../seed.js";
import type * as seedBranches from "../seedBranches.js";
import type * as siteSettings from "../siteSettings.js";
import type * as smoke from "../smoke.js";
import type * as stats from "../stats.js";
import type * as teamMembers from "../teamMembers.js";
import type * as testimonials from "../testimonials.js";
import type * as userFavorites from "../userFavorites.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminDashboard: typeof adminDashboard;
  admins: typeof admins;
  "ai/adminAlert": typeof ai_adminAlert;
  "ai/channels/twilio": typeof ai_channels_twilio;
  "ai/channels/vapi": typeof ai_channels_vapi;
  "ai/chat": typeof ai_chat;
  "ai/context": typeof ai_context;
  "ai/messages": typeof ai_messages;
  "ai/notifications": typeof ai_notifications;
  "ai/notifyCustomer": typeof ai_notifyCustomer;
  "ai/onOrderAccepted": typeof ai_onOrderAccepted;
  "ai/testVapi": typeof ai_testVapi;
  "ai/threads": typeof ai_threads;
  "ai/userChat": typeof ai_userChat;
  branches: typeof branches;
  contactMessages: typeof contactMessages;
  faqs: typeof faqs;
  faqsAdmin: typeof faqsAdmin;
  health: typeof health;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/applyCoupon": typeof lib_applyCoupon;
  "lib/branchDefaults": typeof lib_branchDefaults;
  "lib/branchHours": typeof lib_branchHours;
  "lib/branchMenu": typeof lib_branchMenu;
  "lib/couponCodes": typeof lib_couponCodes;
  "lib/coupons": typeof lib_coupons;
  "lib/currency": typeof lib_currency;
  "lib/entityIds": typeof lib_entityIds;
  "lib/identity": typeof lib_identity;
  "lib/loyalty": typeof lib_loyalty;
  "lib/menuItemHelpers": typeof lib_menuItemHelpers;
  "lib/menuStockImages": typeof lib_menuStockImages;
  "lib/orderLineItems": typeof lib_orderLineItems;
  "lib/orderNumbers": typeof lib_orderNumbers;
  "lib/orderStatusFlow": typeof lib_orderStatusFlow;
  "lib/password": typeof lib_password;
  "lib/referenceIds": typeof lib_referenceIds;
  "lib/slug": typeof lib_slug;
  "lib/tableRegistry": typeof lib_tableRegistry;
  "lib/testimonialHelpers": typeof lib_testimonialHelpers;
  "lib/userAccess": typeof lib_userAccess;
  "lib/users": typeof lib_users;
  "lib/validators": typeof lib_validators;
  menuCatalog: typeof menuCatalog;
  menuCategories: typeof menuCategories;
  menuItems: typeof menuItems;
  menuItemsAdmin: typeof menuItemsAdmin;
  "migrations/alignAppData": typeof migrations_alignAppData;
  "migrations/backfillCouponCodes": typeof migrations_backfillCouponCodes;
  "migrations/backfillMenuImages": typeof migrations_backfillMenuImages;
  "migrations/backfillOrders": typeof migrations_backfillOrders;
  "migrations/backfillUsers": typeof migrations_backfillUsers;
  "migrations/lib/steps": typeof migrations_lib_steps;
  "migrations/migrateReservationStatuses": typeof migrations_migrateReservationStatuses;
  "migrations/normalizeOrderLineItemIds": typeof migrations_normalizeOrderLineItemIds;
  "migrations/runAll": typeof migrations_runAll;
  orders: typeof orders;
  reservations: typeof reservations;
  seed: typeof seed;
  seedBranches: typeof seedBranches;
  siteSettings: typeof siteSettings;
  smoke: typeof smoke;
  stats: typeof stats;
  teamMembers: typeof teamMembers;
  testimonials: typeof testimonials;
  userFavorites: typeof userFavorites;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
