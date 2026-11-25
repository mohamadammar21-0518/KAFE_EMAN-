# Kafe Eman

A café website and management demo for three branches in Kedah, Malaysia. Built collaboratively by **malit mohamut** and **Ammar**.

The project combines a promotional storefront, branch menus, customer accounts, a café chatbot, and a staff dashboard.

![Kafe Eman presentation artwork](public/Images/kafe-eman-header.webp)

*Presentation artwork from the supplied generated café film.*

## Features

- **Storefront** — café film, animated editorial sections, branch directions, FAQs, and responsive layouts.
- **Branch menus** — Alor Setar, Kepala Batas, and UUM Sintok, with MYR pricing and server-side checkout price and availability checks.
- **Customer accounts** — Clerk sign-in, favourites, order history, loyalty points, and reward coupons.
- **Ask Eman** — authenticated chat with saved conversations, branch information, order lookups, and rewards.
- **Bookings and contact** — table requests based on published branch hours, plus contact messages.
- **Staff dashboard** — orders, reservations, menu management, customers, feedback, finance summaries, and website content.
- **Order alerts** — staff notifications from saved orders, with optional Groq analysis and Twilio/Vapi customer notifications.

## Demo status

This is a **presentation demo**. Card checkout simulates payment using a test card ending in 4242. Phone onboarding displays a development verification code. Menu items, contact details, statistics, team profiles, and legal content include samples for the shop to review.

Customer sign-in uses Clerk. The frontend runs locally while the configured Convex development deployment provides the database and backend functions.

## Stack

| Layer | Technology |
| --- | --- |
| Interface | React 19, TypeScript, React Router 7 |
| Build and styling | Vite 6, Tailwind CSS 4 |
| Motion | Framer Motion |
| Backend | Convex |
| Customer authentication | Clerk |
| Café assistant | Groq chat completions and account lookup tools |
| Optional notifications | Twilio SMS and Vapi voice |

## Run locally

Requirements include Node.js 22+, npm, and your own Convex and Clerk projects.

```bash
npm install
npx convex dev
```

Complete Convex project setup, then configure the Clerk JWT issuer on that deployment. Add your Clerk publishable key to the generated `.env.local` file.

```env
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=YOUR_CLERK_PUBLISHABLE_KEY
```

The Clerk JWT template must be named `convex` and have audience `convex`. Set its issuer URL in the Convex environment as `CLERK_JWT_ISSUER_DOMAIN`.

Initialize a new development database in another terminal.

```bash
npx convex run seed:seed
npx convex run seedBranches:seedBranchesAndCategories
npx convex run migrations/runAll:run
npm run dev
```

Open the local address printed by Vite. The detailed setup and presentation walkthrough are in [GETTING_STARTED.md](GETTING_STARTED.md).

The seed creates the development staff account `admin` / `admin123`. Use it only for the local demo and change the password before exposing that deployment to other users.

## AI assistant

Set `GROQ_API_KEY` in the **Convex deployment environment**. The default model is `openai/gpt-oss-20b`; `GROQ_MODEL` can override it with a tool-capable Groq model.

Suggested menu, branch, order-status, loyalty, and coupon questions read from the database directly. Free-form questions use Groq, which can request selected account records. Conversation ownership, per-account request limits, and atomic question/answer saves are enforced by the backend.

Provider credentials belong in Convex environment settings. Values prefixed with `VITE_` are included in the browser bundle.

## Checks

```bash
npm run typecheck
npm run lint
npm run test:cafe
npm run build
```

The local regression suite covers chat starters, account tool lookups, provider failures, thread ownership, checkout validation, currencies, reservation ownership, and calendar dates and opening hours.

For a configured development deployment, `npm run test:api` runs health and database smoke checks. The smoke test creates a temporary administrator and cleans up its test records.

`npm run test:e2e` syncs the backend, applies migrations, runs API checks, and checks and builds the frontend. It requires deployment access and changes the configured database. Browser walkthroughs are listed in [scripts/e2e-checklist.md](scripts/e2e-checklist.md).

## Project layout

```text
convex/           Database schema, backend functions, AI actions, migrations
src/admin/       Staff dashboard and authentication
src/components/  Shared interface, storefront sections, cart, and chatbot
src/pages/       Public and customer pages
src/hooks/       Client data and interaction hooks
public/Images/   Presentation media
scripts/         Regression checks and verification utilities
```

## Hosting

`npm run build` generates `dist/`. The included `wrangler.jsonc` supports Cloudflare Workers static assets with single-page application routing. Authenticated deployment uses `npx wrangler deploy` after Cloudflare login.

Use your own frontend environment variables when building. Configure Clerk for the hosted domain and connect the intended Convex deployment. Temporary preview URLs from development sessions can expire.

## Credentials, attribution, and media

Local `.env` files, dependencies, and build output are excluded from Git. Use [.env.example](.env.example) for placeholder names and configure your own services.

The public snapshot credits the original collaborators above. The private development repository retains the earlier Git history.

Branding, generated presentation media, stock menu imagery, and attributed visitor photographs are used in the demo. Confirm permissions for a customer-facing release. No open-source license has been selected for this repository.
