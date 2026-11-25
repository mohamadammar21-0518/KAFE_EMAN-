# Convex data migrations

After schema or feature changes, sync existing database rows with:

```bash
npm run convex:sync
```

Equivalent to:

```bash
npx convex dev --once && npx convex run migrations/runAll:run
```

Safe to **re-run** — each step only patches documents that still need updates.

## What `runAll` does (in order)

| Step | What it fixes |
|------|----------------|
| **adminRoles** | Legacy role `admin` → `staff`; fills missing `email` on `admins` |
| **alignAppData** | Branches, menu catalog, site settings, slugs, contact refs, user home branch |
| **reservationStatuses** | `confirmed` → `progressing`, `rejected` → `cancelled` |
| **reservations** | `updatedAt`, branch aliases, cancel/close required fields |
| **couponCodes** | Missing `KE-XXXXXX` on `coupons` |
| **users** | Default `active`, clear expired suspensions |
| **loyaltyUsers** | `welcomeBonusGranted`, `totalOrders` defaults |
| **orders** | `orderNumber`, `currency`, coupon snapshots, `updatedAt` |
| **loyaltyOrders** | `pointsEarned: 0` on old paid orders (no retroactive +10) |
| **orderLineItemIds** | Legacy ids → `static:menu:…` on line items |
| **menuImages** | Broken/local URLs → stock image URLs |
| **testimonials** | `sortOrder` on accepted rows; `updatedAt` / `acceptedAt` backfill |
| **verify** | Integrity report + counts for all 17 tables |

## Schema reference

Full table list, API modules, and enums: [`../SCHEMA.md`](../SCHEMA.md).

## Verify

```bash
npx convex run health:ping
npx convex run health:tableInventory
npm run test:smoke
```

## People tables

| Table | Who | Admin UI |
|-------|-----|----------|
| `admins` | Panel login (superadmin \| staff) | Staff, My account |
| `users` | Clerk website customers | Clients |
| `adminSessions` | Active admin bearer tokens | (internal) |

Do **not** store Clerk customer data in `admins`.

## Loyalty (`users` + `orders` + `coupons`)

| Rule | Value |
|------|--------|
| Welcome bonus | +20 once (`welcomeBonusGranted`) |
| Successful order | +10 (`orders.pointsEarned` = 10 when awarded) |
| Coupon threshold | 40 points → `free_drink` coupon |

Constants: `convex/lib/loyalty.ts` (mirrored in `src/lib/loyalty.ts`).

## Testimonials

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting admin review |
| `accepted` | Shown on home carousel |
| `rejected` | Hidden from public site |

Submitted by signed-in Clerk users via `testimonials.submit`; reviewed at `/admin/testimonials`.
