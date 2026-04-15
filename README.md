# OXLIS - Digital Business Marketplace

Full-stack marketplace for buying, selling, and negotiating digital businesses, with listings, messaging, offers, escrow workflows, and seller dashboards.

## Stack

- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Node.js + Express REST API (TypeScript)
- Database: PostgreSQL + Prisma ORM

## Implemented Features

- Listings with price, revenue, profit, niche, type, tech stack
- Advanced filters on marketplace (price, niche, type)
- Listing detail pages with business metrics, gallery, detailed memo, and offers
- User authentication (register/login) with JWT
- Full seller flow to publish and edit listings with structured memo sections and image gallery upload
- Dashboard for listings and offers management
- Messaging system between users (conversations + messages)
- Encrypted chat attachments stored directly in PostgreSQL via Prisma (images, videos, audio, documents)
- Offer / bidding system (create and status update)
- Secure payment simulation using escrow states (initiated/funded/released)

## Project Structure

- `apps/web`: Next.js frontend
- `apps/api`: Express backend + Prisma schema
- `docker-compose.yml`: local PostgreSQL instance

## Quick Start

1. Install dependencies

```bash
cd apps/api && npm install
cd ../web && npm install
```

2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Set a dedicated `ATTACHMENTS_ENCRYPTION_KEY` in `apps/api/.env` for production-grade chat attachment encryption at rest.

If you want Google sign-in, you can either use the direct provider client id (`GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) or configure `FIREBASE_PROJECT_ID` in `apps/api/.env` with the `NEXT_PUBLIC_FIREBASE_*` values in `apps/web/.env.local`.

3. Start PostgreSQL

```bash
docker compose up -d
```

Alternative on macOS with Homebrew:

```bash
brew install postgresql@16
brew postinstall postgresql@16
LC_ALL="en_US.UTF-8" /usr/local/opt/postgresql@16/bin/pg_ctl -D /usr/local/var/postgresql@16 -l /tmp/postgresql@16.log start
/usr/local/opt/postgresql@16/bin/createuser -s postgres
/usr/local/opt/postgresql@16/bin/psql -d postgres -c "ALTER ROLE postgres WITH LOGIN PASSWORD 'postgres';"
/usr/local/opt/postgresql@16/bin/createdb -O postgres oxlis
```

4. Run migrations and generate Prisma client

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

If you already generated the initial migration once, use this instead on the next runs:

```bash
cd apps/api
npx prisma migrate dev
npm run prisma:seed
```

5. Start API and Web apps (two terminals)

```bash
# terminal 1
npm run dev --prefix apps/api

# terminal 2
npm run dev --prefix apps/web
```

Frontend runs on `http://localhost:3000`.
API runs on `http://localhost:4000/api`.

PostgreSQL is now required for auth, dashboard, listings, offers, messaging, and escrow flows.

## Recommended Free Deployment

The cleanest zero-cost path for this codebase is Render Free for both runtime services and a Render Free Postgres database.

This repository now includes a root `render.yaml` blueprint that creates:

- `oxlis-db` as the PostgreSQL database
- `oxlis-web` from `apps/web`
- `oxlis-api` from `apps/api`

Why this path:

- GitHub Pages is not a fit because the app depends on a live API and dynamic Next.js routes
- Vercel Functions are not a fit for the API as-is because Vercel limits request and response bodies to 4.5 MB, while OXLIS currently allows 5 MB listing images and 20 MB chat attachments
- Render Free runs the existing Next.js server and Express API without rewriting uploads, SSE messaging, or Prisma access

### Render Setup

1. Push the repository to GitHub.
2. In Render, create a new Blueprint service from the repository root.
3. Render will read `render.yaml` and provision `oxlis-db`, `oxlis-web`, and `oxlis-api` on the free plan.
4. During creation, provide these API environment variables:

- `CLIENT_URL`
- `GOOGLE_CLIENT_ID`
- `FIREBASE_PROJECT_ID`

5. Provide these frontend environment variables:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

6. After the first deploy, update the cross-service URLs if needed:

- set `CLIENT_URL` on `oxlis-api` to the public frontend origin, for example `https://oxlis-web.onrender.com`
- set `NEXT_PUBLIC_API_URL` on `oxlis-web` to the public API base URL, for example `https://oxlis-api.onrender.com/api`

7. Redeploy both services after those URL values are in place.

Notes:

- `JWT_SECRET` and `ATTACHMENTS_ENCRYPTION_KEY` are generated automatically by the Render blueprint for the API service
- `DATABASE_URL` is injected automatically from the `oxlis-db` Render Postgres instance
- on Render Free, `preDeployCommand` is not available, so the API service runs `npm run prisma:migrate:deploy && npm start` as its start command
- Google sign-in can use either direct provider configuration or Firebase Auth, and the flow is linked to users through Prisma `SocialAccount` rows
- Render Free services spin down after inactivity, so the first request after idle can take around a minute
- Render Free Postgres expires after 30 days, and each workspace can only have one active free Render Postgres database

If you need demo data on the deployed database after migrations:

```bash
cd apps/api
npm run prisma:seed
```

`npm run prisma:seed` is safe to rerun because it uses stable ids and upserts demo records. Use `npm run prisma:seed:reset` only on disposable environments because it wipes marketplace data before reseeding.

## Demo Accounts

- `seller@oxlis.dev` / `password123`
- `buyer@oxlis.dev` / `password123`
- `operator@oxlis.dev` / `password123`

The seed loads three sample listings, multiple offers, two conversation threads, and one escrow transaction in `FUNDED` state.

The seed currently loads 10 listings across SaaS, media, commerce, gaming, mobile, education, and developer-tools categories.

## Smoke Test Workflow

Run the end-to-end API smoke test against the real PostgreSQL database:

```bash
npm run smoke:db
```

The script creates two temporary users, publishes a listing, opens a conversation, exchanges messages, creates and accepts an offer, funds and releases escrow, verifies both dashboards, then cleans up the test records.

Run the targeted business error checks as well:

```bash
npm run test:errors
```

This second script verifies forbidden and invalid flows such as offering on your own listing, unauthorized conversation access, wrong-role escrow actions, and invalid listing payloads.

Run the browser e2e flow against the full stack:

```bash
npm run test:e2e
```

This Playwright scenario covers registration in the UI, listing creation, buyer offer submission, messaging, seller acceptance, buyer funding, seller escrow release, and the final sold state in the dashboard.
It builds the API and web app first, then starts dedicated e2e servers on `http://127.0.0.1:4100` and `http://127.0.0.1:3100`.

The browser flow also covers the new seller composer with structured memo fields, local image upload, gallery ordering, and image removal before publication.

## Continuous Integration

The repository includes a GitHub Actions workflow that:

- builds the API and web app
- provisions PostgreSQL 16 as a service
- applies Prisma migrations and seed data
- starts the API and web app for browser tests
- runs both `npm run smoke:db` and `npm run test:errors`
- runs `npm run test:e2e` with Playwright Chromium

## Main API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `GET /api/listings`
- `GET /api/listings/:id`
- `POST /api/listings`
- `PATCH /api/offers/:id/status`
- `GET /api/dashboard`
- `GET /api/messages/conversations`
- `POST /api/messages/conversations/:id/messages`
- `POST /api/escrow/offers/:offerId/fund`
- `POST /api/escrow/offers/:offerId/release`
