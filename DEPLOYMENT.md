# Onyx Services — VPS Deployment Guide

Run Onyx alongside an existing website on the same VPS. We'll bind to a different port (3001), proxy through your existing Nginx, and use PM2 to keep the process alive.

---

## Prerequisites

You should already have on your VPS:
- Nginx serving your other site
- Node.js 20+ installed
- Domain pointed at your VPS (e.g. `onyx.gg`)

If Node isn't installed yet:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

---

## 1. Clone & build on the VPS

```bash
cd /var/www
git clone https://github.com/YOUR/onyx-services.git
cd onyx-services
npm ci
```

---

## 2. Configure environment

Copy the example file and fill in real values:
```bash
cp .env.example .env.local
nano .env.local
```

Required at minimum:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

Set the port (so it doesn't clash with your other site):
```env
PORT=3001
```

---

## 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `onyx-services`, region closest to your VPS
3. Wait ~2 minutes for provisioning
4. Settings → API → copy the three keys into `.env.local`
5. SQL Editor → New query → paste contents of `supabase/schema.sql` → Run
6. Authentication → Providers → enable Email + Discord (optional)
7. Authentication → URL Configuration → Site URL = `https://onyx.gg`

---

## 4. Build

```bash
npm run build
```

Confirm `.next/` directory was created.

---

## 5. Run with PM2

```bash
pm2 start npm --name "onyx" -- start -- -p 3001
pm2 save
pm2 startup     # follow the printed command to enable boot start
```

Confirm it's running:
```bash
pm2 status
pm2 logs onyx --lines 50
```

You should see `Next.js ... ready ... port 3001`.

---

## 6. Add Nginx server block (coexists with existing site)

Open your Nginx sites config:
```bash
sudo nano /etc/nginx/sites-available/onyx.gg
```

Paste:
```nginx
# ── Onyx Services ──────────────────────────────────────
server {
    listen 80;
    server_name onyx.gg www.onyx.gg;

    # Cert lives here after Certbot runs
    location ~ /.well-known/acme-challenge { allow all; }

    # Everything else → Next.js on :3001
    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

Enable & reload:
```bash
sudo ln -s /etc/nginx/sites-available/onyx.gg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Visit `http://onyx.gg` — should render. Your other site still works on its own domain.

---

## 7. HTTPS via Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d onyx.gg -d www.onyx.gg
```

Pick "Redirect HTTP to HTTPS". Certbot rewrites your Nginx block automatically and sets up auto-renewal.

---

## 8. Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://onyx.gg/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_failed`
4. Copy the signing secret → paste as `STRIPE_WEBHOOK_SECRET` in `.env.local`
5. Restart PM2: `pm2 restart onyx`

---

## 9. Updating (the deploy loop)

For future updates:
```bash
cd /var/www/onyx-services
git pull
npm ci
npm run build
pm2 restart onyx
```

---

## Multi-site reminders

| Concern | Solution |
|---|---|
| Port collision   | Other site uses 3000 → Onyx uses 3001. Verify with `sudo lsof -i :3001` |
| Memory           | `pm2 status` shows RAM per process. Bump VPS if tight. |
| Logs separation  | `pm2 logs onyx` filters to Onyx only |
| Different domain | Each Nginx server block keyed by `server_name` — no conflict |
| Same domain, diff path | Add `location /onyx { proxy_pass http://127.0.0.1:3001; }` inside the existing server block — but cleaner to use a subdomain |

---

## Quick troubleshooting

**`pm2 logs onyx` shows port already in use**
Change `PORT=3001` to `3002` in `.env.local` and update Nginx `proxy_pass` to match.

**502 Bad Gateway**
PM2 process probably crashed. Check `pm2 logs onyx --err`.

**Supabase auth not working**
Verify Site URL in Supabase Authentication → URL Configuration matches your live domain exactly (including `https://`).

**Stripe webhook 400**
Check `STRIPE_WEBHOOK_SECRET` is set and matches the endpoint's signing secret. Restart PM2 after change.

---

## Local dev (Windows)

```powershell
cd C:\Users\guilt\onyx-services
npm run dev
# → http://localhost:3000
```

Use `.env.local` for dev too — same Supabase project, just use a separate one if you don't want test data hitting production.
