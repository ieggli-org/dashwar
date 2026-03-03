# Deploy Dashwar: Vercel (app) + Supabase (database)

This guide explains **where each part of the stack runs** and gives **step-by-step** instructions to get the app live.

---

## Supabase vs Vercel: what runs where?

| Part        | Supabase | Vercel |
|------------|----------|--------|
| **Next.js app** (UI + API) | ❌ No  | ✅ Yes |
| **PostgreSQL database**     | ✅ Yes | ❌ No  |
| **Redis**                  | ❌ No  | ❌ No  |

- **Supabase** = managed **PostgreSQL** (and optionally Auth, Storage). It does **not** host your Next.js app or Redis.
- **Vercel** = host for your **Next.js app** (serverless + edge). It does **not** provide Postgres or Redis.

So “making it available on Supabase” means: **use Supabase as the database**. The app itself runs on **Vercel** (or another host). Redis is **optional** for this app (it’s not used in the code today).

### Is Vercel better for performance?

For a Next.js app, **Vercel is a very good choice**:

- Global edge network, fast cold starts, automatic HTTPS, preview deployments.
- Fits serverless (no long-running background jobs on one machine).
- You keep **one** Postgres (Supabase) and **one** app host (Vercel); no need to run Redis unless you add caching later.

**Recommended setup:** **Vercel (app) + Supabase (Postgres)**. No Redis required for the current app.

---

## Step-by-step deployment

### 1. Supabase (database)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. **New project**  
   - Organization and name (e.g. `dashwar`)  
   - Strong **database password** (save it)  
   - Region close to your users  
   - Create.
3. Wait until the project is **Ready**.
4. **Connection string**  
   - **Settings** → **Database**  
   - **Connection string** → **URI**  
   - Copy the URI. It looks like:
     ```text
     postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your database password.  
   - For serverless (Vercel), use the **pooler** (port **6543**) and **Transaction** mode if Supabase shows that option.
5. **Run migrations and seed once** (from your machine, with the same URI):
   ```bash
   export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
   npm install
   npx tsx lib/db/migrate.ts
   CLEAR_RSS_BREAKING_NEWS=1 npx tsx lib/ingest/run.ts
   ```
   This creates tables and fills initial data + first RSS ingest.  
   Alternatively you can run the SQL from `drizzle/0000_init.sql` in **Supabase → SQL Editor**, then run only the ingest locally:
   ```bash
   DATABASE_URL="<same-uri>" npm run ingest
   ```

You’ll use this **same** `DATABASE_URL` in Vercel.

---

### 2. Vercel (app)

1. Push your code to **GitHub** (if not already).
2. Go to [vercel.com/new](https://vercel.com/new).
3. **Import** the repo (e.g. `ieggli-org/dashwar`).  
   - Framework: **Next.js** (auto-detected).  
   - Root: leave default.
4. **Environment variables** (add before or right after first deploy):
   - **`DATABASE_URL`** = the Supabase connection string from step 1 (same URI you used for migrate + ingest).
   - **`CRON_SECRET`** = a long random string (e.g. `openssl rand -hex 32`). Used to secure the ingest cron endpoint; Vercel Cron will send it automatically.
   - Optional: **`OPENAI_API_KEY`** if you use AI on the Impact page.
   - Do **not** set `NEXT_PUBLIC_API_URL` in production (app uses same-origin).
5. **Deploy**.  
   - Build and deploy. If the build fails, check that `next.config.mjs` does **not** use `output: 'standalone'` (that’s for Docker, not Vercel).
6. **Cron (RSS ingest)**  
   - The repo includes `vercel.json` with a cron that calls `/api/cron/ingest` every 10 minutes.  
   - Vercel sends `Authorization: Bearer <CRON_SECRET>`; the API route checks `CRON_SECRET`, so ensure **`CRON_SECRET`** is set in Vercel.  
   - On the **Hobby** plan you have a limited number of cron jobs; the single ingest job is enough.

Your app will be live at `https://<project>.vercel.app` (or your custom domain).

---

### 3. Optional: custom domain

1. In Vercel: **Project → Settings → Domains**.
2. Add your domain (e.g. `dashwar.leoieggli.me`).
3. At your DNS provider, add the record Vercel shows (usually **CNAME** `dashwar` → `cname.vercel-dns.com`).
4. After DNS propagates, Vercel will serve the app and HTTPS.

---

### 4. Redis (optional)

The app **does not use Redis** in the current code. You can leave **`REDIS_URL`** unset.  
If you later add caching or sessions that need Redis, you can use e.g. **Upstash Redis** (serverless-friendly) and set `REDIS_URL` in Vercel.

---

## Checklist

- [ ] Supabase project created; **DATABASE_URL** (pooler, port 6543) copied.
- [ ] Migrations and seed/ingest run once (locally with Supabase **DATABASE_URL**).
- [ ] Repo connected to Vercel; **DATABASE_URL** and **CRON_SECRET** set.
- [ ] First Vercel deploy successful.
- [ ] (Optional) Custom domain added in Vercel and DNS configured.
- [ ] Open the app URL and confirm feed loads; after ~10 minutes, cron will have run and new RSS items can appear.

---

## Env vars summary (production)

| Variable         | Where / purpose                                      |
|------------------|------------------------------------------------------|
| `DATABASE_URL`   | Supabase → Settings → Database → URI (pooler 6543)   |
| `CRON_SECRET`    | You generate; Vercel Cron uses it for `/api/cron/ingest` |
| `OPENAI_API_KEY` | Optional; for Impact AI analysis                     |
| `REDIS_URL`      | Optional; not used by current app                    |

---

## Hero image on Vercel

The hero image is downloaded by a script in Docker. On Vercel there is no such script. Options:

1. **Static image:** Add a default `public/hero.jpg` in the repo; the hero will always show it unless you change it.
2. **Keep dynamic later:** You could add an API route that fetches an image and caches it (e.g. in Vercel Blob or Supabase Storage) and call it from a cron; for a first deploy, a static `public/hero.jpg` is enough.

---

## Troubleshooting

- **Build fails:** Remove `output: 'standalone'` from `next.config.mjs` if present.
- **DB connection errors:** Use the **pooler** URI (port **6543**), not the direct connection port. Enable **Supabase → Settings → Database → Connection pooling** if needed.
- **Cron not running:** Confirm **CRON_SECRET** is set in Vercel and that the cron in `vercel.json` is deployed (crons run only on production deployments).
- **No new events in feed:** Run ingest once locally with Supabase `DATABASE_URL` to seed; then wait for the next cron run (every 10 minutes) or call `GET /api/cron/ingest` with `Authorization: Bearer <CRON_SECRET>` manually to test.
