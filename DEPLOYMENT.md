# Deploy Dashwar to GitHub, Supabase, and dashwar.leoieggli.me

**Quick path (Vercel + Supabase only):** See **[docs/DEPLOY_VERCEL_SUPABASE.md](docs/DEPLOY_VERCEL_SUPABASE.md)** for a step-by-step that explains Supabase vs Vercel, performance, and cron for RSS ingest.

This guide covers: (1) pushing the repo to your GitHub org, (2) using Supabase as the database, (3) deploying the app on Vercel, and (4) adding the custom domain **dashwar.leoieggli.me**.

---

## 1. Add the project to GitHub (ieggli-org)

You need to create the repository under [ieggli-org](https://github.com/ieggli-org) and push the code. Run these in your project root (replace `YOUR_GITHUB_USERNAME` if you use HTTPS and need to authenticate).

### Option A: Create repo on GitHub first, then push

1. **Create the repo**
   - Go to [github.com/organizations/ieggli-org/repositories/new](https://github.com/organizations/ieggli-org/repositories/new)
   - Repository name: `dashwar`
   - Visibility: Public (or Private)
   - Do **not** add a README, .gitignore, or license (we already have them)
   - Click **Create repository**

2. **Push from your machine**
   ```bash
   cd /path/to/dashwar
   git init
   git add .
   git commit -m "Initial commit: Dashwar conflict information system"
   git branch -M main
   git remote add origin https://github.com/ieggli-org/dashwar.git
   git push -u origin main
   ```
   If GitHub asks for auth, use a [Personal Access Token](https://github.com/settings/tokens) (repo scope) or SSH.

### Option B: Using GitHub CLI

```bash
cd /path/to/dashwar
git init
git add .
git commit -m "Initial commit: Dashwar conflict information system"
gh repo create ieggli-org/dashwar --private --source=. --push
```

---

## 2. Supabase (database)

Supabase gives you a Postgres database. Use it as `DATABASE_URL` for the app.

1. **Create a project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in
   - **New project** → pick org, name (e.g. `dashwar`), database password, region
   - Wait until the project is ready

2. **Get the connection string**
   - In the project: **Settings** → **Database**
   - Under **Connection string** choose **URI**
   - Copy the URI. It looks like:
     ```
     postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your database password
   - For serverless (e.g. Vercel), use **Transaction** mode (port **6543**); the URI above is for the pooler

3. **Run migrations and seed**
   - Locally, set `DATABASE_URL` to the Supabase URI, then:
   ```bash
   export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
   npm install
   npx tsx lib/db/migrate.ts
   npm run ingest
   ```
   - Or use the Supabase SQL Editor: open `drizzle/0000_init.sql`, run its contents, then run ingest from your machine with the same `DATABASE_URL`.

After this, use this same `DATABASE_URL` in Vercel (and any other environment).

---

## 3. Deploy on Vercel

Vercel runs the Next.js app and will later get the domain **dashwar.leoieggli.me**.

1. **Import the repo**
   - Go to [vercel.com/new](https://vercel.com/new)
   - **Import** → choose **ieggli-org/dashwar** (or connect GitHub and select the repo)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** leave default
   - **Build and Output Settings:** leave default

2. **Environment variables**
   - Before deploying, add in Vercel (Project → Settings → Environment Variables):
     - `DATABASE_URL` = your Supabase connection string (from step 2)
   - Optional: `OPENAI_API_KEY` (for Impact page AI analysis)
   - Do **not** set `NEXT_PUBLIC_API_URL` in production; the app uses same-origin requests when that is unset.
   - Click **Deploy**.

   - If the Vercel build fails, try removing `output: 'standalone'` from `next.config.mjs` (that option is for self-hosted Docker; Vercel uses its own output).

3. **Migrations and seed on first deploy**
   - After the first deploy, run migrations and seed once. Either:
     - Use **Vercel → Project → Settings → Environment Variables** and run locally with `DATABASE_URL` pointing to Supabase, then:
       ```bash
       DATABASE_URL="<supabase-uri>" npx tsx lib/db/migrate.ts
       DATABASE_URL="<supabase-uri>" npm run ingest
       ```
     - Or add a one-off **Build Command** that runs migrate + ingest (optional; not required if you ran them locally).

Your app will be live at `https://dashwar-xxx.vercel.app` (or your project URL).

---

## 4. Custom domain: dashwar.leoieggli.me

You want the app to be at **dashwar.leoieggli.me**. That means: Vercel serves the app, and your domain’s DNS points the subdomain to Vercel.

### 4.1 Add domain in Vercel

1. In Vercel: open your **dashwar** project → **Settings** → **Domains**
2. Add: `dashwar.leoieggli.me`
3. Vercel will show you what to add in DNS (usually a **CNAME** record or an **A** record). Write it down.

Typical instructions from Vercel:

- **CNAME:**  
  - Name/host: `dashwar` (or `dashwar.leoieggli.me` depending on the DNS UI)  
  - Value/target: `cname.vercel-dns.com`
- Or **A:**  
  - Name: `dashwar`  
  - Value: `76.76.21.21` (Vercel’s IP; confirm in Vercel’s UI)

### 4.2 Add the DNS record (Google Workspace / Squarespace)

Your domain **leoieggli.me** is managed where you bought it or where DNS is hosted (often Google Domains, Squarespace, or Cloudflare). You only add a record for the **subdomain** `dashwar`.

- **Google Domains / Google Workspace (DNS)**
  - Go to [domains.google.com](https://domains.google.com) → **My Domains** → **leoieggli.me** → **DNS** (or **Manage** → **DNS**)
  - Add a **Custom resource record**:
    - Type: **CNAME**
    - Name: `dashwar`
    - Value: `cname.vercel-dns.com`
    - TTL: 3600 (or default)
  - Save.

- **Squarespace**
  - **Settings** → **Domains** → **leoieggli.me** → **DNS Settings** (or **Advanced settings**)
  - Add a **CNAME** record:
    - Host: `dashwar`
    - Points to: `cname.vercel-dns.com`
  - Save.

- **Other (Cloudflare, Namecheap, etc.)**
  - In the DNS section for **leoieggli.me**, add:
    - Type: **CNAME**
    - Name: `dashwar` (or `dashwar.leoieggli.me` if the panel requires the full name)
    - Target: `cname.vercel-dns.com`

Propagation can take a few minutes up to 48 hours. Vercel will show the domain as valid when it’s correct.

### 4.3 HTTPS

Vercel will issue an SSL certificate for `dashwar.leoieggli.me` automatically once the CNAME is correct. No extra steps needed.

---

## Checklist

- [ ] Repo pushed to **github.com/ieggli-org/dashwar**
- [ ] Supabase project created and **DATABASE_URL** copied
- [ ] Migrations and seed run (locally with Supabase `DATABASE_URL` or via SQL Editor + ingest)
- [ ] Vercel project created from **ieggli-org/dashwar**, **DATABASE_URL** set
- [ ] First deploy successful
- [ ] Domain **dashwar.leoieggli.me** added in Vercel
- [ ] CNAME (or A) record for `dashwar` added at your DNS provider
- [ ] After DNS propagates, open **https://dashwar.leoieggli.me** and confirm the app loads

---

## Env vars summary (production)

| Variable            | Where to get it                          |
|---------------------|------------------------------------------|
| `DATABASE_URL`      | Supabase → Settings → Database → URI     |
| `OPENAI_API_KEY`    | Optional; for Impact AI analysis         |
| `NEXT_PUBLIC_*`     | Only if you need overrides; else leave unset for same-origin |

***Redis is optional; the app runs without it. For production you can leave `REDIS_URL` unset unless you add caching later.
