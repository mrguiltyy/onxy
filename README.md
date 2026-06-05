# Onyx Services

Production-grade licensing + storefront platform for private software tools.
Hardware-bound DRM, anti-piracy auth engine, wallet payments, reseller program, ad spot rentals, admin panel.

---

## Deploy in 5 minutes

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it `onyx-services`, pick a region close to your users
3. Wait ~90 seconds for provisioning
4. **SQL Editor → New query** → paste the contents of `supabase/init.sql` → **Run**

   This creates 18 tables, all enums + indexes + RLS policies, a `handle_new_user()` trigger, and seeds 8 demo products with 3 plans each. Idempotent — safe to re-run.

5. **Settings → API** → copy these 3 values, you'll paste them into Vercel next:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key

6. **Authentication → URL Configuration** → set:
   - **Site URL** = your Vercel domain (after step 2). For now leave it as `http://localhost:3000` and update after Vercel gives you a domain.

### 2. Push to GitHub

```bash
cd onyx-services
git init                 # if not already
git add .
git commit -m "Initial Onyx Services platform"
gh repo create onyx-services --private --source=. --push
# or: create empty repo on github.com, then:
# git remote add origin https://github.com/YOU/onyx-services.git
# git push -u origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your `onyx-services` repo
3. **Framework** auto-detects Next.js — leave defaults
4. **Environment Variables** — add these (paste keys from Supabase step 1.5):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` `secret` key |
| `CRON_SECRET` | any 32-char random string — `openssl rand -hex 16` |
| `NEXT_PUBLIC_APP_URL` | leave blank, fill in after first deploy |

5. Click **Deploy**. Wait ~2 minutes.
6. Once live, copy your Vercel domain (e.g. `onyx-services-xyz.vercel.app`) and:
   - Set `NEXT_PUBLIC_APP_URL=https://onyx-services-xyz.vercel.app` in Vercel env vars and redeploy
   - In Supabase Authentication → URL Configuration, set **Site URL** to the same value
   - Add `https://onyx-services-xyz.vercel.app/auth/callback` to **Redirect URLs**

### 4. Make yourself an admin

After registering an account at `https://yourdomain/register`, run this in Supabase SQL Editor:

```sql
update public.users set role = 'super_admin' where email = 'YOUR-EMAIL@example.com';
```

Sign out, sign back in. You can now access `/admin` and `/docs`.

### 5. (Optional) Add emails, Stripe, Discord

Each is independent — the platform works without them, but features that depend on them stay dark until configured.

| Feature | Env vars needed | Where to get them |
|---|---|---|
| Transactional emails | `RESEND_API_KEY`, `EMAIL_FROM` | [resend.com](https://resend.com) |
| Stripe checkout | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard |
| Discord OAuth | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Discord Developer Portal |
| Discord webhooks (admin alerts) | `DISCORD_WEBHOOK_URL` | Discord server settings |
| Cloudflare R2 (tool binaries) | `R2_*` (4 vars) | Cloudflare dashboard |

After adding any of these, redeploy on Vercel.

---

## What's automatically running

| Cron job | Schedule | What it does |
|---|---|---|
| `/api/cron/subscription-renewal` | Daily 03:00 UTC | Auto-renews subscriptions where wallet has balance |
| `/api/cron/expiring-licenses` | Daily 09:00 UTC | Sends "expiring in 3 days" emails |
| `/api/cron/cleanup-sessions` | Hourly | Prunes expired license sessions |
| `/api/cron/prune-rate-limits` | Daily 04:00 UTC | Deletes brute-force log rows > 72h old |

Vercel triggers all of these automatically when `CRON_SECRET` is set. Nothing else to configure.

---

## Local dev

```powershell
cd onyx-services
copy .env.example .env.local
# fill in keys in .env.local
npm install
npm run dev
```

Visit http://localhost:3000.

---

## License engine

Your tools talk to four endpoints. See `/docs/wpf-integration` after deploy for full C# example code.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/license/auth` | POST | Tool launch: validate key + HWID, get session |
| `/api/license/heartbeat` | POST | Every 5 min: keep session alive |
| `/api/license/revoke` | POST | Admin: kill session or ban license |
| `/api/tools/[slug]/latest` | GET | Auto-update manifest: version, SHA-256, URL |

Built-in security:
- License keys stored as SHA-256 lookup hashes — DB dumps can't compromise active keys
- Brute-force protection: per-IP and per-key throttling with progressive lockout
- Generic error messaging — attacker can't tell if key exists, is locked, or has wrong HWID
- Session tokens are crypto-random, in-memory only on client, 10-min sliding expiry
- HWID slot claims atomic via DB unique index

---

## Stack

Next.js 16 · React 19 · Tailwind v4 · Supabase Postgres + Auth · Stripe (optional) · Resend (optional) · Cloudflare R2 (optional) · Vercel hosting
