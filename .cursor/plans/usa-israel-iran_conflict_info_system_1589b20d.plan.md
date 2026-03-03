---
name: USA-Israel-Iran Conflict Info System
overview: "Plan for a real-time conflict information system: product summary, v1 features, data sources, architecture, risks, success metrics, and technical design (Next.js, Docker Compose, visualizations, env-based config)."
todos: []
isProject: false
---

# Real-Time USA/Israel–Iran Conflict Information System — Plan

---

## 1. One-Page Product Summary

**What it is:** A web-based system that aggregates, normalizes, and presents real-time information about the USA–Israel–Iran conflict (and related actors) with clear timestamps, source attribution, and optional visualizations (timeline, map, actor graph, charts).

**For whom:** Researchers, journalists, policymakers, educators, and the general public who need a single, structured view of developments.

**Main value:** One place to follow breaking news, official statements, diplomatic/military/humanitarian updates, and fact-checks—with filters, search, and optional alerts—while making source and verification status explicit.

---

## 2. v1 Feature Set (Prioritized)


| #   | Feature                             | Description                                                                                                                 |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Chronological feed (timeline)**   | Single timeline of all items with filters: country/actor, event type, source type.                                          |
| 2   | **Source attribution**              | Every item shows source name and link to original; stored in DB.                                                            |
| 3   | **Search + filters**                | Full-text search; filters by date range, topic, actor, event type.                                                          |
| 4   | **Event schema for visuals**        | Stored events include: involved countries/actors, event type, date, source, optional location—ready for graph, map, charts. |
| 5   | **Connection/network graph**        | Nodes = countries/actors; edges = relationship/conflict type from tagged events.                                            |
| 6   | **Map view**                        | Events by location (country/region), optional clustering; optional lines for “same event” connections.                      |
| 7   | **Time-based / categorical chart**  | At least one: e.g. event count by country over time (line/bar) or event type distribution (bar/pie).                        |
| 8   | **Real-time updates**               | Polling (e.g. every N minutes) or simple push; configurable interval via env.                                               |
| 9   | **Unverified / conflicting labels** | “Unconfirmed” and multi-source display where applicable.                                                                    |
| 10  | **Disclaimer + sensitivity**        | Footer disclaimer; policy for sensitive content (e.g. no graphic media by default, optional age/sensitivity gate).          |


Stretch for v1: in-app or email alerts for high-priority/user-selected topics (can be v1.1).

---

## 3. Proposed Source List (Types for Later Vetting)

- **News wires / major outlets:** Reuters, AP, AFP — APIs or RSS where available.
- **Official channels:** US/IL/IR government and military spokespersons; verified official social or press releases (RSS/APIs or manual).
- **Conflict monitors / NGOs:** e.g. ACLED, International Crisis Group — APIs or periodic export/import.
- **Multilateral:** UN, IAEA — official feeds or RSS.
- **Optional (strict verification):** Curated X/social with clear “unverified” labeling.

**Types:** Free API, RSS, scrapers, manual curation. Concrete endpoints and keys to be selected in a later phase; all accessed via env-configured keys and base URLs.

---

## 4. Architecture (One Paragraph)

**Sources → Ingest → Store → API → Front end.** External sources (RSS, APIs, optional scrapers) are polled on a schedule (or triggered) by an ingest service/job. Raw or normalized items are written to Postgres (events table with actors, type, date, location, source, link). Optional Redis for cache/session. Next.js API routes (or server actions) read from DB and serve filtered/sorted data. The front end (App Router) renders the timeline, search, map, connection graph, and charts; real-time behavior is achieved by polling the API at a set interval or via simple push (e.g. SSE/long polling in a later iteration). No hardcoded hosts or secrets; all config via environment variables.

---

## 5. Risks and Mitigations


| Risk                                 | Mitigation                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Source availability / rate limits    | Multiple source types; fallback to RSS/manual; respect rate limits and backoff.                |
| Misinformation / bias                | Strict attribution; “unconfirmed” labels; link to fact-checking; avoid single-source reliance. |
| Sensitive content / casualty numbers | Policy: no graphic media by default; optional sensitivity toggle; disclaimer on sourcing.      |
| Hosting / jurisdiction               | Document env-based deployment; choose region and compliance (e.g. GDPR) per deployment.        |


---

## 6. Success Metrics

- **Update frequency:** e.g. target latency (e.g. < 60 min for breaking items when sources permit).
- **Coverage:** Number of integrated sources and event types.
- **Reliability:** Uptime of ingest and API; clear “misconfigured” or “degraded” state when env/sources fail.
- **User:** Optional feedback channel or simple satisfaction metric for v1.1.

---

## 7. Technical Design

### 7.1 Stack and Repo Layout

- **Framework:** Next.js (App Router), TypeScript.
- **Run locally:** Docker Compose: `app` (Next.js), `postgres`, optional `redis`. Same `docker-compose.yml` for all devs; no host-specific paths.
- **Deployment:** Env-only config; deploy as Docker, Vercel, or other; `.env.example` with all keys and placeholders; no defaults for production secrets (fail fast or show “misconfigured”).

### 7.2 Real-Time Behavior (v1)

- **Definition:** “Real-time” = sub-hour updates via scheduled polling (e.g. every 15–30 min); optional in-app “live” ticker that polls the API every 1–2 min.
- **Aggregation vs alerts:** v1 = aggregate and display only; optional alert rules (e.g. “major escalation” or user-selected topics) as v1.1.

### 7.3 Data Model (for Visuals and Feed)

- **Events table (minimal for v1):** `id`, `title`, `body` (or summary), `event_type` (e.g. breaking_news, official_statement, diplomatic, military, humanitarian, fact_check), `occurred_at` (timestamp), `ingested_at`, `source_id`, `source_url`, `location` (country/region or geo), `actors` (array or JSON: e.g. `["USA","Israel","Iran"]`), optional `escalation_level` or `category` tag.
- **Sources table:** `id`, `name`, `type` (wire, official, ngo, etc.), `base_url`, `is_verified`.
- **Graph and charts:** Connection graph and time/category charts read from this schema (actors + event_type + date + source).

### 7.4 Docker Compose (Local)

- **Services:**  
  - `**app` (or `web`):** Next.js — Dockerfile; dev with volume mount + hot reload, or production build for prod-like run.  
  - `**postgres`:** Persistent volume; port exposed for local only.  
  - `**redis` (optional):** Cache/session; port exposed for local only.
- **Network:** Single Compose network; app uses `postgres:5432`, `redis:6379`.
- **Env:** `env_file: .env.local` (or `.env`); same vars as deployment. No host-specific paths or IPs.

### 7.5 Environment Variables

- `DATABASE_URL` — Postgres connection string.  
- `REDIS_URL` — Optional; cache/session.  
- `NEWS_API_KEY` / per-source keys — External APIs; names TBD per source.  
- `NEXT_PUBLIC`_* — Client: map provider URL, analytics, feature flags, `NEXT_PUBLIC_API_URL` if needed.  
- `API_BASE_URL` — Server-side API base for server-to-server if used.  
- No production defaults for secrets; document in `.env.example` with placeholders.

### 7.6 Visualizations (Recap)

- **Connection/network graph:** Nodes = countries/actors; edges = event type / relationship (from `actors` + `event_type`).  
- **Map:** Events by `location`; optional clustering; optional lines for shared events.  
- **Timeline:** Horizontal/time-ordered view with filters (country, type).  
- **Charts:** Event count by country over time; event type distribution; optional simple “escalation” index over time if defined.

### 7.7 Users, Use Cases, and Multi-Language

- **Primary users:** Researchers, journalists, policymakers, general public.  
- **Use cases:** Daily briefing, breaking-news monitoring, research, teaching.  
- **Multi-language:** Plan for i18n (e.g. English + Farsi/Arabic) in schema and UI labels; actual translations can be phase 2.

### 7.8 Reliability and Ethics (Recap)

- Unverified/conflicting: “Unconfirmed” label; show multiple sources where available.  
- Sensitive content: No graphic content by default; optional gate; clear disclaimer.  
- Disclaimer: “System aggregates sources; does not guarantee accuracy”; link to fact-checking where relevant.

---

## 8. Deliverables Checklist

- One-page product summary  
- v1 feature set (5–10 items)  
- Proposed source list with types  
- Architecture paragraph  
- Risks and one mitigation each  
- Success metrics  
- Tech stack: Next.js + Docker Compose; env-only; visuals (graph, map, timeline, chart)

---

## 9. Suggested File and Folder Structure (for Implementation)

- **Root:** `docker-compose.yml`, `.env.example`, `README.md`, `package.json`, `tsconfig.json`, `next.config.`*.  
- **App:** `app/` (App Router): `layout.tsx`, `page.tsx` (landing/feed), `feed/`, `map/`, `graph/`, `charts/`, `api/` (e.g. `api/events`, `api/sources`).  
- **Ingest:** `lib/ingest/` or `jobs/` for feed polling and DB writes.  
- **DB:** Migrations (e.g. Drizzle, Prisma, or raw SQL); `events`, `sources` tables.  
- **Docker:** `Dockerfile` for Next.js; Compose services `app`, `postgres`, optional `redis`.

This plan is ready to be implemented in the empty `dashwar` workspace with the above stack and structure.