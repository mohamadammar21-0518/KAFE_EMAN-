# End-to-end test checklist

Run after `.env` has `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY`.

## Automated (terminal)

```bash
npm run convex:sync    # push schema + migrations (22 tables)
npm run test:e2e       # sync + health + smoke + typecheck + build
```

Or faster API-only:

```bash
npm run test:api
```

Expected: `smoke:run` → `{ "passed": true }` and `health:ping` → `"tableCount": 22`.

## Convex endpoints exercised by `smoke:run`

| Module | Covered |
|--------|---------|
| `health` | 17-table registry |
| `branches` | listActive, create, update |
| `menuCatalog` | categories by branch |
| `menuCategories` / `menuItemsAdmin` | CRUD |
| `siteSettings` | global row |
| `teamMembers` / `stats` / `faqs` | list + FAQ CRUD |
| `contactMessages` | submit, updateStatus |
| `reservations` | create, status flow |
| `orders` | pipeline + finance data |
| `testimonials` | insert, accept, reject, staff, listPublished |
| `userFavorites` | insert + by_user query |
| `users` / `admins` | customer list, setCustomerActive |
| `admins` | login, session |

Clerk-only (manual browser): `users.syncProfile`, `orders.create`, `testimonials.submit`, `userFavorites.toggle`.

## Manual — storefront

| # | Flow | Pass |
|---|------|------|
| 1 | `/` — stats, testimonials carousel (if accepted rows exist) | |
| 2 | `/menu` — branch menu from Convex | |
| 3 | Sign in (Clerk) → `/account` profile | |
| 4 | Add to cart → checkout → order on account | |
| 5 | `/reservation` — submit booking | |
| 6 | `/contact` — submit message | |
| 7 | Home `#testimonial` — feedback strip → submit (signed in) | |
| 8 | Menu heart — favourite toggles | |

## Manual — admin

| # | Flow | Pass |
|---|------|------|
| 9 | `/admin/login` — `admin` / `admin123` | |
| 10 | `/admin` — KPI tiles + charts update (Live badge) | |
| 11 | `/admin/orders` — status pipeline | |
| 12 | `/admin/finance` — period + branch filter | |
| 13 | `/admin/testimonials` — accept → home carousel | |
| 14 | `/admin/clients` — customer list | |
| 15 | Mobile width — hamburger opens full nav | |
| 16 | Logout → `/admin/login` | |
