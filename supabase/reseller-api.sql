-- ════════════════════════════════════════════════════════════════
--  OP Reseller API — seller keys + per-project access scopes
--
--  Resellers use sellerkeys to call /api/seller/v1/ — they create
--  license keys, list their own keys, reset HWIDs, etc.
--
--  Run after clean-install.sql. Idempotent.
-- ════════════════════════════════════════════════════════════════

-- ── Seller keys (one or more per reseller) ─────────────────────
create table if not exists public.seller_keys (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  -- Public key prefix (shown in dashboard) + hash of secret (for verification)
  key_prefix         text unique not null,        -- e.g. "ops_a1b2c3"
  key_hash           text not null,                -- SHA-256 of the full secret
  -- Label (user can name their keys)
  name               text not null default 'Default key',
  -- Scope — null = all reseller's products; non-null = only these products
  scoped_product_ids uuid[],
  -- Stats
  last_used_at       timestamptz,
  request_count      bigint not null default 0,
  -- Status
  active             boolean not null default true,
  expires_at         timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists idx_seller_keys_user on public.seller_keys(user_id, active);
create index if not exists idx_seller_keys_prefix on public.seller_keys(key_prefix);

-- ── API request log (per seller key) ────────────────────────────
create table if not exists public.seller_api_log (
  id              bigserial primary key,
  seller_key_id   uuid references public.seller_keys(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  endpoint        text not null,                    -- 'createkey', 'getkeys', etc.
  ip              text,
  status_code     int,
  request_params  jsonb,
  error_code      text,
  latency_ms      int,
  created_at      timestamptz not null default now()
);

create index if not exists idx_api_log_seller on public.seller_api_log(seller_key_id, created_at desc);
create index if not exists idx_api_log_user on public.seller_api_log(user_id, created_at desc);

-- ── Track how licenses were created (admin / dashboard / api) ──
alter table public.licenses add column if not exists created_via text default 'dashboard';
-- 'dashboard' / 'admin' / 'api' / 'reseller'
alter table public.licenses add column if not exists created_by_seller_key uuid references public.seller_keys(id) on delete set null;

-- ── Default duration config per product (what 30d/7d/etc map to) ──
-- This makes the API match AuthGuards-style getdaymaps output
create table if not exists public.product_durations (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  duration_key    text not null,                    -- '1d', '7d', '30d', '300d', 'lifetime'
  duration_label  text not null,                    -- '1 Day' / '30 Days' / 'Lifetime'
  duration_days   int,                              -- null = lifetime
  price_cents     int,                              -- optional override of product pricing
  sort_order      int not null default 0,
  active          boolean not null default true,
  unique (product_id, duration_key)
);

create index if not exists idx_product_durations on public.product_durations(product_id, active, sort_order);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table public.seller_keys enable row level security;
alter table public.seller_api_log enable row level security;
alter table public.product_durations enable row level security;

drop policy if exists sk_select_own on public.seller_keys;
drop policy if exists sk_insert_own on public.seller_keys;
drop policy if exists sk_update_own on public.seller_keys;
drop policy if exists sk_delete_own on public.seller_keys;
drop policy if exists log_select_own on public.seller_api_log;
drop policy if exists dur_select_pub on public.product_durations;

create policy sk_select_own on public.seller_keys for select using (auth.uid() = user_id);
create policy sk_insert_own on public.seller_keys for insert with check (auth.uid() = user_id);
create policy sk_update_own on public.seller_keys for update using (auth.uid() = user_id);
create policy sk_delete_own on public.seller_keys for delete using (auth.uid() = user_id);
create policy log_select_own on public.seller_api_log for select using (auth.uid() = user_id);
create policy dur_select_pub on public.product_durations for select using (active = true);

grant all on public.seller_keys, public.seller_api_log, public.product_durations to anon, authenticated, service_role;
grant usage, select on sequence public.seller_api_log_id_seq to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Seed default duration config for the sample product
-- ════════════════════════════════════════════════════════════════
insert into public.product_durations (product_id, duration_key, duration_label, duration_days, price_cents, sort_order, active)
select id, '1d',       '1 Day',    1,    price_day,      1, true from public.products where slug = 'sample-tool'
on conflict (product_id, duration_key) do nothing;

insert into public.product_durations (product_id, duration_key, duration_label, duration_days, price_cents, sort_order, active)
select id, '7d',       '7 Days',   7,    price_week,     2, true from public.products where slug = 'sample-tool'
on conflict (product_id, duration_key) do nothing;

insert into public.product_durations (product_id, duration_key, duration_label, duration_days, price_cents, sort_order, active)
select id, '30d',      '30 Days',  30,   price_month,    3, true from public.products where slug = 'sample-tool'
on conflict (product_id, duration_key) do nothing;

insert into public.product_durations (product_id, duration_key, duration_label, duration_days, price_cents, sort_order, active)
select id, 'lifetime', 'Lifetime', null, price_lifetime, 4, true from public.products where slug = 'sample-tool'
on conflict (product_id, duration_key) do nothing;

-- ════════════════════════════════════════════════════════════════
-- Verification
-- ════════════════════════════════════════════════════════════════
select 'seller_keys table created' as status;
