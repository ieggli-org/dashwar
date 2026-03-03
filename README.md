# Dashwar — USA/Israel–Iran Conflict Information System

Real-time aggregation of conflict-related news, official statements, and events with source attribution, timeline, map, connection graph, and charts.

## Stack

- **Next.js** (App Router), TypeScript
- **Postgres** (Drizzle ORM), optional **Redis**
- **Docker Compose** for local run (app, postgres, redis)

All configuration via **environment variables**; no hardcoded hosts or secrets. See [.env.example](.env.example).

## Run locally (one command, with Docker)

With Docker Desktop running and `.env.local` in place:

```bash
./scripts/local-up.sh
```

Or via npm (same steps: start Postgres + Redis, migrate, seed, then dev server):

```bash
npm run local:up
```

Then open [http://localhost:3000](http://localhost:3000).

## Quick start (local without Docker)

1. Copy env and set database:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/dashwar)
   ```
2. Install and migrate:
   ```bash
   npm install
   DATABASE_URL="postgresql://..." npx tsx lib/db/migrate.ts
   npm run ingest   # seeds mock data
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Quick start (Docker Compose)

1. Create env file:
   ```bash
   cp .env.example .env.local
   ```
2. Start Postgres and Redis, then run the app in dev mode (migrate, seed, and hot reload run automatically):
   ```bash
   docker compose up postgres redis -d
   docker compose run --rm -p "3000:3000" dev
   ```
   If port 3000 is in use, use another host port: `-p "3010:3000"`. Then open http://localhost:3000 (or 3010).
3. To reset and re-seed the database (e.g. after pulling new mock data), run from the project root:
   ```bash
   docker compose run --rm dev sh -c "npm install && npm run db:refresh"
   ```
   Or build and run the production image:
   ```bash
   docker compose up postgres redis -d
   docker compose run --service-ports app
   ```
   For the production-like `app` service, run migrations and seed once (e.g. from host with `DATABASE_URL=postgresql://dashwar:dashwar@localhost:5432/dashwar npm run ingest`).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (required) |
| `REDIS_URL` | Optional cache/session |
| `NEWS_API_KEY` / per-source keys | External APIs (TBD) |
| `NEXT_PUBLIC_API_URL` | Front-end API base (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | Timeline poll interval in ms (default 120000) |
| `API_BASE_URL` | Server-side API base if needed |

See [.env.example](.env.example) for the full list.

## Features (v1)

- **Timeline:** Chronological feed with filters (actor, event type, source type, date range) and search; source attribution and “Unconfirmed” labels.
- **Map:** Events by location (country or lat/lon); click marker for details.
- **Connection graph:** Nodes = countries/actors; edges = shared events.
- **Charts:** Event count by country, event type distribution, events by country over time.
- **Real-time:** Configurable polling for the timeline.
- **Disclaimer** and sensitivity note in the footer.

## Project structure

- `app/` — Next.js App Router (pages, API routes)
- `lib/db/` — Drizzle schema, migration, getDb
- `lib/ingest/` — Mock seed and ingest entrypoint
- `components/` — Header, Footer
- `drizzle/` — SQL migrations

## Deployment

Use the same env vars per environment (staging, production). No host-specific paths in Compose. You can deploy the Next.js app as:

- **Docker:** Use the provided Dockerfile; point `DATABASE_URL` and `REDIS_URL` to your managed Postgres/Redis.
- **Vercel + Supabase + custom domain:** See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step: push to [GitHub ieggli-org](https://github.com/ieggli-org), use Supabase as Postgres, deploy on Vercel, and add **dashwar.leoieggli.me**.
- **Vercel (generic):** Deploy the Next.js app; use Vercel env for `DATABASE_URL` and other vars. Run migrations and ingest from a separate runner or CI.
