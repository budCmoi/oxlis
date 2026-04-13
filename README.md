# OXLIS - Digital Business Marketplace

Modern marketplace web app inspired by Flippa where users can buy and sell digital businesses.

## Stack

- Frontend: Next.js (App Router) + Tailwind CSS + Framer Motion
- Backend: Node.js + Express REST API (TypeScript)
- Database: PostgreSQL + Prisma ORM

## Implemented Features

- Listings with price, revenue, profit, niche, type, tech stack
- Advanced filters on marketplace (price, niche, type)
- Listing detail pages with business metrics and offers
- User authentication (register/login) with JWT
- Seller flow to publish new listings
- Dashboard for listings and offers management
- Messaging system between users (conversations + messages)
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

## Demo Accounts

- `seller@oxlis.dev` / `password123`
- `buyer@oxlis.dev` / `password123`
- `operator@oxlis.dev` / `password123`

The seed loads three sample listings, multiple offers, two conversation threads, and one escrow transaction in `FUNDED` state.

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
