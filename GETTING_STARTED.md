# Getting started with Kafe Eman

## Existing local presentation demo

Open a terminal in the folder containing `package.json` and run `npm run dev`. Open the address printed by Vite. This workspace uses its configured Convex development deployment and Clerk development sign-in.

The local staff account seeded for the demo is `admin` / `admin123`. Use your own Clerk account for customer sign-in.

## Fresh installation

1. Install Node.js 22+ and npm.
2. Download or clone your repository, enter the project folder, and run `npm install`.
3. Run `npx convex dev` to create or connect your own Convex project. It writes the deployment and frontend URL to `.env.local`. Keep that terminal open.
4. Create a Clerk application. Configure a JWT template named `convex`, with audience `convex`. Add its publishable key to `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY`.
5. Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex deployment environment to your Clerk issuer URL. The backend must have this value before auth configuration can deploy successfully. If initial setup pauses on this missing variable, set it in the Convex dashboard and rerun `npx convex dev`.
6. In another terminal, initialize a new demo database.

```bash
npx convex run seed:seed
npx convex run seedBranches:seedBranchesAndCategories
npx convex run migrations/runAll:run
npm run dev
```

Use your own service projects. The frontend and backend should refer to the same Convex deployment. Local files take precedence over other Vite environment files, so keep deployment URLs consistent.

## Environment settings

| Setting | Destination | Purpose |
| --- | --- | --- |
| `VITE_CONVEX_URL` | Local frontend environment | Convex client URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Local frontend environment | Customer sign-in |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex environment | Validates Clerk tokens |
| `GROQ_API_KEY` | Convex environment | Free-form chatbot |
| `GROQ_MODEL` | Convex environment, optional | Defaults to `openai/gpt-oss-20b` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_FROM` | Convex environment, optional | Customer SMS |
| `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `VAPI_ASSISTANT_ID` | Convex environment, optional | Customer voice calls |

Use [.env.example](.env.example) for placeholders. Provider secrets belong in Convex settings. The current browser app does not require a Clerk secret key.

## Presentation walkthrough

1. Play the café film and browse the homepage and branch directory.
2. Select a branch and explore the menu with MYR prices.
3. Open Ask Eman, sign in, ask for the menu, then ask a free-form follow-up. Return to the conversation through Chat History.
4. Choose a booking date and time. Published branch hours control the slots. A reservation is a request for staff review.
5. Sign into `/admin/login` and demonstrate orders, reservations, menu editing, messages, and finance.
6. Sign out of the staff account.

Demo card checkout simulates payment using a test card ending in 4242. Development phone verification displays the code on screen. Sample menu, contact, team, statistics, and legal content should be reviewed by the shop before a customer launch.

## Chatbot and notifications

Menu, branch, order-status, loyalty, and coupon starters read database facts without a Groq request. Free-form questions require a working Groq key and tool-capable model.

For ready-order notifications, configure the selected provider. The customer recipient must match a phone number verified by the authentication provider. Keep `BYPASS_PHONE_VERIFICATION` disabled for customer-facing use.

## Verification

```bash
npm run typecheck
npm run lint
npm run test:cafe
npm run build
```

With the development deployment configured, run `npm run test:api`. Database smoke checks create a temporary administrator and clean up test rows. See [the browser checklist](scripts/e2e-checklist.md) for interactive checks.

## Repository hygiene

Keep local environment files and provider credentials out of Git. Review any history you intend to publish, retain collaborator attribution, and confirm code and media permissions before choosing a license.
