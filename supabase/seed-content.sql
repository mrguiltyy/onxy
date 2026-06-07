-- ════════════════════════════════════════════════════════════════
--  OP starter content seed
--
--  Run after clean-install.sql + onboarding.sql.
--  Creates 4 launch blog posts so /blog has something to show.
--  Safe to re-run — uses ON CONFLICT (slug) DO NOTHING.
-- ════════════════════════════════════════════════════════════════

insert into public.cms_pages (slug, page_type, title, subtitle, body, status, featured, meta_title, meta_description, meta_keywords, published_at, view_count, sort_order)
values
  (
    'welcome-to-op',
    'blog',
    'Welcome to OP — a fresh take on the resell panel',
    'Marketplace, reseller program, and embedded auth engine in one platform.',
    E'## What OP is\n\nOP combines three things that have historically been three separate websites:\n\n1. **A marketplace** for private software tools, where lifetime buyers get ongoing support included.\n2. **A reseller program** with white-label branding and wholesale pricing for approved resellers.\n3. **An auth engine** — a drop-in SDK in 7 languages (C#, C++, Python, Node, Java, VB.NET, plus raw REST) for adding HWID-locked licensing to your own apps.\n\nWe built OP because the existing options (auth.gg, KeyAuth, etc.) are clunky, expensive, or both. Our goal: ship a tool you actually enjoy using, with prices that make sense, and rock-solid uptime.\n\n## What you get on day one\n\n- 1-minute signup (email or Discord OAuth)\n- $1 free wallet credit when you link Discord\n- HWID-locked license keys with self-serve resets\n- Per-IP brute-force protection baked in\n- Live system status at /status\n- Drop-in SDK for your own tools — see /dashboard/docs after sign-in\n\n## What''s next\n\nWe''re shipping fast. Upcoming:\n\n- **Rebrand tier** — buy your own white-label panel on a subdomain. Run YOUR own tools and users, on our infrastructure.\n- **Stripe webhook automation** for instant key delivery\n- **Discord role sync** — auto-grant Discord roles based on license status\n- **AI-powered ticket triage**\n\nQuestions? Open a ticket or hop in our [Discord](https://discord.gg/onxy).',
    'published',
    true,
    'Welcome to OP — Marketplace + Auth Engine for Private Tools',
    'OP combines a private tools marketplace, a reseller program, and a 7-language auth engine SDK into one platform. Start free or upgrade for reseller wholesale pricing.',
    array['OP', 'auth panel', 'authgg alternative', 'KeyAuth alternative', 'resell panel', 'license keys'],
    now() - interval '2 days',
    0,
    1
  ),
  (
    'how-the-auth-engine-works',
    'blog',
    'How the OP auth engine works in 10 lines of code',
    'C# example. Same flow in 6 other languages — and raw REST for everything else.',
    E'## The three calls\n\nEvery tool that uses OP auth makes the same three calls:\n\n1. `POST /api/v1/auth/login` — exchange a license key + HWID for a session token\n2. `POST /api/v1/auth/check` — one-shot validate (call once on startup)\n3. `POST /api/v1/auth/heartbeat` — call every 60-120 seconds to keep the session alive\n\nThat''s it. No webhooks, no callbacks, no socket connections.\n\n## C# example\n\n```csharp\nvar auth = new OPAuth("op_xxx", "ops_xxx", "1.0.0");\nvar result = await auth.LoginAsync(licenseKeyFromUser);\nif (!result.Success) {\n    MessageBox.Show(result.Message);\n    Application.Current.Shutdown();\n    return;\n}\n\nauth.StartHeartbeat(\n    TimeSpan.FromSeconds(60),\n    onInvalidated: () => Application.Current.Shutdown()\n);\n```\n\nThat''s the whole flow. HWID generation, brute-force throttling, session token storage, ban-list enforcement — all handled by the SDK.\n\n## Security stack\n\n- **App secrets** are SHA-256 hashed in the database. Even our admins can''t recover them — only rotate.\n- **Session tokens** are 64-character hex, constant-time compared\n- **HWID** is bound on first login; mismatches are rejected\n- **Rate limiting**: 10 failed attempts per IP per app per minute → 5-minute block\n- **Heartbeat** means we can kick banned users without waiting for them to re-login\n\n## Get started\n\nReseller-tier users get unlimited applications. Sign up, upgrade to a reseller plan, and hit /dashboard/docs to see the full SDK for your language.',
    'published',
    true,
    'How the OP Auth Engine Works — 10-line C# Example + 7 Language SDKs',
    'Add HWID-locked license validation to your .NET / C++ / Python / Node / Java / VB.NET tool in 10 lines. Constant-time compare, brute-force protection, heartbeat sessions.',
    array['OP auth engine', 'C# license SDK', 'HWID locking', 'KeyAuth alternative', 'auth.gg alternative', 'private tool licensing'],
    now() - interval '5 days',
    0,
    2
  ),
  (
    'reseller-program-explained',
    'blog',
    'OP reseller program, explained',
    'White-label our catalog, set your own branding, pay wholesale. Here''s the math.',
    E'## The pitch\n\nIf you have an audience — Discord server, YouTube channel, niche community — but no time to build and maintain tools, the reseller program is for you. You pay a flat plan fee, then per-key wholesale on whatever you generate.\n\n## Plans\n\n- **Starter** — $14.99/mo. 5 application slots, wholesale pricing, standard support.\n- **Pro** — $29.99/mo or $99 lifetime. Unlimited applications, +10% wholesale discount on top of standard, priority support, Discord webhook for events. *(Most popular.)*\n- **Elite** — $299 lifetime. Everything in Pro, +15% extra discount, hands-on launch help, featured spotlight on /products, dedicated Discord channel.\n\n## How wholesale works\n\nLet''s say one of our tools retails at $50 lifetime. The wholesale price is $12.50 (25%). On Pro your effective price is $11.25; on Elite it''s $10.62.\n\nYou charge your customers whatever you want — typically retail or close to it. The spread is yours.\n\n## How approvals work\n\n1. Buy a reseller plan from /reseller (wallet or Stripe)\n2. Browse /products and click "Apply to resell" on any product you want to sell\n3. Submit your branded name + pitch + (optional) custom image\n4. Admin reviews within 24h — most legit applications get auto-approved\n5. Once approved, you can generate keys for that product at your wholesale rate\n\n## Updates and notifications\n\nThe second we ship a product update, every approved reseller of that product gets:\n\n- An in-app notification\n- A Discord webhook ping (if you have a server hooked up)\n- Email notification\n\nNo more "did this update? when?" — you''ll always know first.\n\n## When you outgrow reselling\n\nIf you''re moving real volume and want full white-label control (your own subdomain, your own users, your own products), the **rebrand** tier is coming. Ask in Discord for early access pricing.',
    'published',
    false,
    'OP Reseller Program — White-Label Wholesale Pricing Explained',
    'Three reseller plans starting at $14.99/mo. White-label our catalog, set your own pricing, get +10–15% wholesale discount on Pro/Elite. Update notifications included.',
    array['OP reseller', 'reseller program', 'white label software', 'auth panel reseller', 'license key wholesale'],
    now() - interval '7 days',
    0,
    3
  ),
  (
    'hwid-reset-the-right-way',
    'blog',
    'HWID reset — when, why, and how often you can do it',
    'Three free resets per license, one every 24 hours. Here''s the policy and the reasoning.',
    E'## Why we lock HWID at all\n\nWithout HWID locking, anyone could buy a key and post it on Telegram. The seller loses control, the buyer gets ripped off, the tool gets reverse-engineered by whoever cares enough.\n\nWith HWID locking, the license is tied to your specific computer (CPU + motherboard fingerprint). Move computers? You need a reset.\n\n## How many resets you get\n\n- **3 self-serve resets** per license, ever\n- **24-hour cooldown** between resets\n- After 3, ask an admin via ticket (lifetime buyers get priority on this)\n\nThese numbers are deliberate. Most users never need a reset. The 3 we give you cover legitimate cases (new PC, hardware upgrade, motherboard swap) without enabling cheap key-sharing.\n\n## How to actually reset\n\n1. Go to /dashboard/licenses and click the license that''s locked to your old hardware\n2. The detail page shows the current HWID hash (first 12 chars) and how many resets you have left\n3. Click **Reset HWID** and confirm\n4. Open your tool — the next login will bind your current device automatically\n\nNo waiting, no ticket needed.\n\n## What if my tool says HWID mismatch but I haven''t changed hardware?\n\nRun the **troubleshooter** at /dashboard/troubleshoot. It checks your license state against what the API saw and tells you exactly what''s wrong. About 80% of HWID complaints are actually a different bug (wrong app_id, rate limit, license expired) that the troubleshooter spots in 5 seconds.\n\n## What if I changed multiple components at once?\n\nNo problem. The HWID is a hash of CPU + motherboard. As long as those two haven''t both changed, you might be fine without a reset. If both did change, use one of your 3 resets.\n\nQuestions? FAQ at /faq covers the edge cases.',
    'published',
    false,
    'OP HWID Reset — Policy, Limits, and How to Self-Serve',
    'Each license gets 3 free HWID resets with a 24-hour cooldown. Use them from your dashboard. Lifetime buyers get priority on manual resets after that.',
    array['HWID reset', 'license HWID', 'hardware lock', 'OP support', 'HWID mismatch fix'],
    now() - interval '10 days',
    0,
    4
  )
on conflict (slug) do nothing;

-- ── Verification ───────────────────────────────────────────────
select slug, title, status, published_at::date as published
from public.cms_pages
where page_type = 'blog'
order by published_at desc;
