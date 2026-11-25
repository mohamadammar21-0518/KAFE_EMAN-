# Kafe Eman — Convex data model

Source of truth: [`schema.ts`](./schema.ts). Table metadata: [`lib/tableRegistry.ts`](./lib/tableRegistry.ts).

## Quick commands

| Task | Command |
|------|---------|
| Push schema + run migrations | `npm run convex:sync` |
| Table counts | `npx convex run health:ping` |
| Full inventory (counts + features) | `npx convex run health:tableInventory` |
| Integration smoke test | `npm run test:smoke` |
| Seed demo data | `npm run convex:seed` |

## All tables (17)

| Table | Group | Used by |
|-------|--------|---------|
| `branches` | Locations & menu | Admin Branches, branch picker, currency |
| `menuCategories` | Locations & menu | Admin Menu, `menuCatalog` |
| `menuItems` | Locations & menu | Menu page, cart, favourites |
| `teamMembers` | Website content | About page |
| `stats` | Website content | Home / About stats |
| `faqs` | Website content | FAQ sections, Admin FAQ |
| `siteSettings` | Website content | Footer, contact, Admin Content |
| `contactMessages` | Guest engagement | Contact form, Admin Get In Touch |
| `testimonials` | Guest engagement | Feedback CTA, carousel, Admin Testimonials |
| `reservations` | Commerce | Reservation form, Admin Reservations |
| `orders` | Commerce | Checkout, Admin Orders/Finance, Account |
| `coupons` | Commerce | Loyalty, checkout, Account rewards |
| `users` | Customers | Clerk account, Admin Clients |
| `userFavorites` | Customers | Menu hearts, Account favourites |
| `phoneVerifications` | Customers | Onboarding phone verify |
| `admins` | Admin auth | Panel login, Admin Staff |
| `adminSessions` | Admin auth | `adminToken` sessions |

## API modules (public)

| Module | Role |
|--------|------|
| `branches` | Branch CRUD + `listActive` |
| `menuCategories` / `menuItemsAdmin` | Admin menu CRUD |
| `menuCatalog` | Storefront menu by branch |
| `menuItems` | Legacy/public list helper |
| `orders` | Checkout, admin order/finance APIs |
| `reservations` | Booking + admin status |
| `users` | Clerk profile, loyalty, onboarding, orders |
| `userFavorites` | Favourites toggle/list |
| `contactMessages` | Contact form + admin inbox |
| `testimonials` | Submit feedback, publish carousel, admin review |
| `faqs` / `faqsAdmin` | Public FAQ + admin CRUD |
| `siteSettings` | Global contact/social settings |
| `teamMembers` / `stats` | Marketing content |
| `admins` | Login, staff, client management |
| `adminDashboard` | Dashboard charts/KPIs |
| `health` | `ping`, `tableInventory` |

Internal: `seed`, `seedBranches`, `smoke`, `migrations/*`.

## Status enums (`lib/validators.ts`)

- **orders**: `pending` → `confirmed` → `preparing` → `ready` → `completed` \| `cancelled`
- **payment**: `pending` \| `paid` \| `refunded` \| `failed`
- **reservations**: `pending` → `progressing` → `closed` \| `cancelled`
- **contactMessages**: `pending` \| `read` \| `archived`
- **testimonials**: `pending` \| `accepted` \| `rejected`
- **admins.role**: `superadmin` \| `staff`

## Migrations

See [`migrations/README.md`](./migrations/README.md). Safe to re-run `migrations/runAll:run` after deploy.

## Storage

`testimonials.imageStorageId` → Convex file storage; public URL via `ctx.storage.getUrl` at submit/accept time.

## Key indexes (match query code)

| Table | Index | Used for |
|-------|--------|----------|
| `orders` | `by_created`, `by_payment_created`, `by_branch_created` | Dashboard, finance, branch orders |
| `users` | `by_clerk`, `by_created`, `by_branch` | Auth profile, signups, admin clients |
| `coupons` | `by_user_redeemed` | Active loyalty coupons at checkout |
| `testimonials` | `by_status_sort`, `by_status_created`, `by_source_created` | Carousel, admin filters |
| `contactMessages` | `by_status_created`, `by_created` | Admin inbox, pending counts |
| `reservations` | `by_status_created`, `by_created` | Admin reservations |
| `menuItems` | `by_branch_sort`, `by_category_id_sort` | Menu catalog & admin CRUD |
| `adminSessions` | `by_token_hash` | Panel `adminToken` validation |

Registry metadata for every table: [`lib/tableRegistry.ts`](./lib/tableRegistry.ts).
