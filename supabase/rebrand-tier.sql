-- ════════════════════════════════════════════════════════════════
--  OP Rebrand Tier — sub-accounts / multi-tenant scaffolding
--
--  Run after clean-install.sql + onboarding.sql. Idempotent.
--
--  This sets up the TABLES for tenant sub-accounts. The actual subdomain
--  routing + tenant-scoped queries are a separate code change — this
--  migration is the foundation so the platform can sell rebrand plans now.
-- ════════════════════════════════════════════════════════════════

-- ── Tenants (each rebrand customer gets one) ───────────────────
create table if not exists public.tenants (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,                  -- subdomain identifier, e.g. "phoenix" → phoenix.opweb.app
  name                text not null,
  tagline             text,
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  -- branding
  primary_color       text default '#f0a4b7',
  accent_color        text default '#a2c8ee',
  logo_url            text,
  favicon_url         text,
  custom_domain       text unique,                            -- optional custom domain (e.g. tools.yourdomain.com)
  domain_verified_at  timestamptz,
  -- plan + limits
  plan                text not null default 'starter',        -- starter / pro / elite
  plan_expires_at     timestamptz,
  max_users           int not null default 100,
  max_products        int not null default 10,
  current_users       int not null default 0,
  current_products    int not null default 0,
  -- status
  status              text not null default 'active',         -- active / suspended / disabled
  -- meta
  description         text,
  support_email       text,
  support_discord     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_tenants_owner   on public.tenants(owner_id);
create index if not exists idx_tenants_slug    on public.tenants(slug);
create index if not exists idx_tenants_domain  on public.tenants(custom_domain) where custom_domain is not null;
create index if not exists idx_tenants_status  on public.tenants(status);

-- ── Tenant members (users belonging to a tenant) ───────────────
create table if not exists public.tenant_members (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text not null default 'member',          -- owner / admin / support / member
  status          text not null default 'active',          -- active / suspended / removed
  joined_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_members_tenant  on public.tenant_members(tenant_id, role);
create index if not exists idx_members_user    on public.tenant_members(user_id);

-- ── Rebrand pricing plans (similar to reseller_plans) ───────────
create table if not exists public.rebrand_plans (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  name                 text not null,
  tagline              text,
  description          text,
  -- pricing
  price_monthly_cents  int,
  price_yearly_cents   int,
  price_setup_cents    int default 0,                       -- one-time setup fee
  -- limits
  max_users            int default 100,
  max_products         int default 10,
  custom_domain_allowed boolean not null default false,
  removed_branding     boolean not null default false,      -- "Powered by OP" removable
  api_access           boolean not null default false,
  -- features text
  features             text[] not null default '{}'::text[],
  -- UI
  featured             boolean not null default false,
  badge                text,
  cta_label            text default 'Start rebrand',
  sort_order           int not null default 0,
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);

-- ── Profiles can be linked to a tenant_id directly (so they belong to one panel)
alter table public.profiles add column if not exists tenant_id uuid references public.tenants(id) on delete set null;
create index if not exists idx_profiles_tenant on public.profiles(tenant_id) where tenant_id is not null;

-- Allow products to be tenant-scoped (null = main OP catalog)
alter table public.products add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
create index if not exists idx_products_tenant on public.products(tenant_id) where tenant_id is not null;

-- Licenses too
alter table public.licenses add column if not exists tenant_id uuid references public.tenants(id) on delete set null;
create index if not exists idx_licenses_tenant on public.licenses(tenant_id) where tenant_id is not null;

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table public.tenants        enable row level security;
alter table public.tenant_members enable row level security;
alter table public.rebrand_plans  enable row level security;

drop policy if exists tenant_select_owner on public.tenants;
drop policy if exists tenant_select_member on public.tenants;
drop policy if exists members_select_own on public.tenant_members;
drop policy if exists plans_select_pub on public.rebrand_plans;

-- Owners and members can see their tenant
create policy tenant_select_owner  on public.tenants for select using (auth.uid() = owner_id);
create policy tenant_select_member on public.tenants for select using (
  exists (select 1 from public.tenant_members m where m.tenant_id = id and m.user_id = auth.uid())
);

-- Members can see their own membership rows
create policy members_select_own on public.tenant_members for select using (auth.uid() = user_id);

-- Public plans
create policy plans_select_pub on public.rebrand_plans for select using (active = true);

grant all on public.tenants, public.tenant_members, public.rebrand_plans
  to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Seed 3 rebrand plans
-- ════════════════════════════════════════════════════════════════
insert into public.rebrand_plans (slug, name, tagline, description,
  price_monthly_cents, price_yearly_cents, price_setup_cents,
  max_users, max_products, custom_domain_allowed, removed_branding, api_access,
  features, featured, badge, sort_order)
values
  ('starter-rebrand', 'Starter Rebrand',
   'Run your own mini-OP on a subdomain.',
   'Perfect for testing the waters. Your own subdomain, branded panel, up to 100 users.',
   9900, 99000, 0,
   100, 10, false, false, false,
   array['Subdomain (yourname.opweb.app)','Custom logo + colors','Up to 100 users','Up to 10 products','Standard support'],
   false, null, 1),

  ('pro-rebrand', 'Pro Rebrand',
   'Custom domain + branding removed.',
   E'Real-volume operators. Bring your own domain, remove all "Powered by OP" branding, API access for automation.',
   29900, 299000, 9900,
   1000, 50, true, true, true,
   array['Custom domain','Branding fully removed','Up to 1,000 users','Up to 50 products','REST API access','Priority support'],
   true, 'Most popular', 2),

  ('elite-rebrand', 'Elite Rebrand',
   'Unlimited + dedicated team support.',
   'For serious operators running multiple panels. Unlimited users + products, dedicated support channel, hands-on launch help.',
   99900, 999000, 19900,
   null, null, true, true, true,
   array['Everything in Pro','Unlimited users + products','Dedicated Discord channel','Hands-on launch + setup help','SLA: 4h response time','Custom feature requests'],
   true, 'Lifetime panels', 3)

on conflict (slug) do nothing;

-- ════════════════════════════════════════════════════════════════
-- Verification
-- ════════════════════════════════════════════════════════════════
select slug, name, price_monthly_cents from public.rebrand_plans order by sort_order;
