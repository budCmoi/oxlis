# OXLIS - Digital Business Marketplace

Modern marketplace web app inspired by Flippa where users can buy and sell digital businesses.

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

## Netlify Deployment

The frontend in `apps/web` is ready for deployment on Netlify.

This repository now includes a root `netlify.toml` that configures Netlify to:

- build from `apps/web`
- run `npm run build`
- use Node.js 20

To deploy:

1. Import the repository into Netlify.
2. Keep the build settings from `netlify.toml`.
3. Add the environment variable `NEXT_PUBLIC_API_URL` in Netlify and point it to your public API, for example `https://api.example.com/api`.
4. Redeploy the site.

Important: this Netlify setup deploys the Next.js frontend only. The Express API in `apps/api` must be hosted separately on a public URL, then exposed to the frontend through `NEXT_PUBLIC_API_URL`.

Optional for smoother zero-downtime rollouts on Netlify with Next.js: set `NETLIFY_NEXT_SKEW_PROTECTION=true` in the Netlify environment variables.

## API + Database Deployment

The backend in `apps/api` is deployable as a separate Netlify site when `apps/api` is used as that site's deploy base, using the included `apps/api/netlify.toml`.

Required production environment variables for the API site:

- `DATABASE_URL`: public PostgreSQL connection string
- `JWT_SECRET`: secret used to sign auth tokens
- `ATTACHMENTS_ENCRYPTION_KEY`: dedicated key for encrypted chat attachments
- `CLIENT_URL`: allowed frontend origin, for example `https://oxlis.netlify.app`

Recommended production flow:

1. Create or connect a PostgreSQL database from your provider of choice.
2. Create a second Netlify site for `apps/api`.
3. Set the four environment variables above on that API site.
4. Deploy the API site and verify `GET /api/health` returns `{ "status": "ok" }`.
5. Run production migrations against the same `DATABASE_URL`:

```bash
cd apps/api
npm run prisma:migrate:deploy
```

6. Seed the production database with the non-destructive demo seed if needed:

```bash
cd apps/api
npm run prisma:seed
```

`npm run prisma:seed` is safe to rerun because it uses stable ids and upserts demo records. Use `npm run prisma:seed:reset` only on disposable environments because it wipes marketplace data before reseeding.

Once the API is public, set `NEXT_PUBLIC_API_URL` on the frontend site to that API URL, for example `https://oxlis-api.netlify.app/api`, then redeploy the frontend site.

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
