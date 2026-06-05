-- ════════════════════════════════════════════════════════════════
-- Onyx Services — Supabase Schema
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Or via CLI:  supabase db push
-- ════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────
create type user_role        as enum ('user', 'reseller', 'support', 'super_admin');
create type tier_t           as enum ('Onyx', 'Slate', 'Carbon', 'Diamond', 'Gold');
create type license_status   as enum ('active', 'expired', 'revoked');
create type rkey_status      as enum ('unused', 'sold', 'revoked');
create type tx_type          as enum ('deposit', 'purchase', 'refund', 'referral', 'reseller_purchase', 'reseller_sale', 'adjustment');
create type ticket_status    as enum ('open', 'in_progress', 'waiting_on_user', 'closed');
create type product_type     as enum ('software', 'file', 'bundle');

-- ── Users (extends auth.users) ──────────────────────────────────
create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique not null,
  email               text unique not null,
  avatar_url          text,
  discord_id          text,
  wallet_balance_cents bigint not null default 0,
  role                user_role not null default 'user',
  tier                tier_t not null default 'Onyx',
  totp_secret         text,
  totp_enabled        boolean not null default false,
  email_verified      boolean not null default false,
  banned_at           timestamptz,
  ban_reason          text,
  referral_code       text unique not null,
  referred_by_id      uuid references public.users(id),

  -- Reseller-specific fields
  reseller_approved_at      timestamptz,
  reseller_discount_percent int not null default 75,
  reseller_keys_generated   int not null default 0,
  reseller_keys_sold        int not null default 0,
  reseller_revenue_cents    bigint not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_users_role on public.users(role);
create index idx_users_referral_code on public.users(referral_code);

-- ── Products ────────────────────────────────────────────────────
create table public.products (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text unique not null,
  name                text not null,
  short_desc          text,
  long_desc           text,
  type                product_type not null default 'software',
  category            text,
  thumbnail_url       text,
  base_price_cents    int not null,
  stock               int,
  max_hwid_slots      int not null default 2,
  current_version     text,
  current_file_key    text,
  current_sha256      text,
  force_update        boolean not null default false,
  is_active           boolean not null default true,
  is_featured         boolean not null default false,
  created_at          timestamptz not null default now()
);

-- Plans per product
create table public.product_plans (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid not null references public.products(id) on delete cascade,
  plan_id             text not null,                -- 'monthly' / 'quarterly' / 'lifetime'
  label               text not null,
  price_cents         int not null,
  duration_days       int,                          -- null = lifetime
  hwid_slots          int not null default 2,
  sort_order          int not null default 0,
  unique (product_id, plan_id)
);

-- ── Licenses ────────────────────────────────────────────────────
-- NOTE: We never store the plaintext key. The user sees it once on issuance.
-- key_lookup_hash = sha256(key) — used as the unique index for auth lookups.
-- This way, even a DB dump doesn't compromise active licenses.

create table public.licenses (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  product_id          uuid not null references public.products(id),
  plan_id             uuid references public.product_plans(id),
  key_lookup_hash     text unique not null,
  key_prefix          text not null,
  status              license_status not null default 'active',
  auto_renew          boolean not null default false,
  hwid_slots_used     int not null default 0,
  hwid_slots_total    int not null default 2,
  expires_at          timestamptz,
  banned_at           timestamptz,
  banned_reason       text,

  -- Pause feature: 1 pause allowed per license. paused_at != null = currently paused.
  paused_at           timestamptz,
  pause_used          boolean not null default false,
  pause_days_remaining int,                                -- snapshot of remaining days when paused

  created_at          timestamptz not null default now()
);

create index idx_licenses_user      on public.licenses(user_id);
create index idx_licenses_key_hash  on public.licenses(key_lookup_hash);

-- ── License auth attempts (brute force protection log) ──────────
create table public.license_auth_attempts (
  id                  bigserial primary key,
  ip                  inet not null,
  key_lookup_hash     text,
  user_agent          text,
  outcome             text not null,                    -- 'success' / 'invalid_key' / 'hwid_limit' / 'rate_limited' / etc
  created_at          timestamptz not null default now()
);

create index idx_attempts_ip_recent  on public.license_auth_attempts(ip,              created_at desc);
create index idx_attempts_key_recent on public.license_auth_attempts(key_lookup_hash, created_at desc);

-- HWID registry per license
create table public.hwid_registry (
  id                  uuid primary key default uuid_generate_v4(),
  license_id          uuid not null references public.licenses(id) on delete cascade,
  hwid_hash           text not null,
  label               text,
  registered_at       timestamptz not null default now(),
  last_seen_at        timestamptz,
  last_ip             inet,
  is_active           boolean not null default true,
  unique (license_id, hwid_hash)
);

-- Active sessions (for live monitoring + heartbeat tracking)
create table public.license_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  license_id          uuid not null references public.licenses(id) on delete cascade,
  hwid_id             uuid references public.hwid_registry(id),
  session_token       text unique not null,
  ip                  inet,
  tool_version        text,
  last_heartbeat_at   timestamptz not null default now(),
  expires_at          timestamptz not null,
  created_at          timestamptz not null default now()
);

create index idx_sessions_token on public.license_sessions(session_token);
create index idx_sessions_license on public.license_sessions(license_id);

-- ── Reseller keys ───────────────────────────────────────────────
create table public.reseller_keys (
  id                  uuid primary key default uuid_generate_v4(),
  reseller_id         uuid not null references public.users(id),
  product_id          uuid not null references public.products(id),
  plan_id             uuid references public.product_plans(id),
  key                 text unique not null,
  cost_paid_cents     int not null,
  retail_price_cents  int not null,
  status              rkey_status not null default 'unused',
  sold_at             timestamptz,
  sold_price_cents    int,
  buyer_email         text,
  redeemed_by_user_id uuid references public.users(id),
  created_at          timestamptz not null default now()
);

create index idx_reseller_keys_reseller on public.reseller_keys(reseller_id);
create index idx_reseller_keys_status on public.reseller_keys(status);

-- ── Subscriptions ───────────────────────────────────────────────
create table public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  license_id          uuid not null references public.licenses(id),
  product_id          uuid not null references public.products(id),
  plan_id             uuid references public.product_plans(id),
  amount_cents        int not null,
  interval_days       int not null,
  status              text not null default 'active',  -- active / cancelled / past_due
  auto_renew          boolean not null default true,
  next_billing_at     timestamptz not null,
  payment_method      text,                            -- 'wallet' / 'card_visa' / etc
  stripe_subscription_id text,
  created_at          timestamptz not null default now(),
  cancelled_at        timestamptz
);

-- ── Orders ──────────────────────────────────────────────────────
create table public.orders (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id),
  product_id          uuid references public.products(id),
  plan_id             uuid references public.product_plans(id),
  license_id          uuid references public.licenses(id),
  amount_cents        int not null,
  discount_cents      int not null default 0,
  coupon_id           uuid,
  payment_method      text not null,                   -- 'wallet' / 'stripe' / 'crypto'
  stripe_session_id   text,
  status              text not null default 'completed',
  created_at          timestamptz not null default now()
);

-- ── Wallet transactions ─────────────────────────────────────────
create table public.wallet_transactions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  type                tx_type not null,
  amount_cents        bigint not null,
  balance_after_cents bigint not null,
  reference_id        uuid,                            -- order/license/reseller_key id
  note                text,
  created_at          timestamptz not null default now()
);

create index idx_tx_user on public.wallet_transactions(user_id, created_at desc);

-- ── Downloads (signed URL tracking) ─────────────────────────────
create table public.downloads (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id),
  product_id          uuid not null references public.products(id),
  token               text unique not null,
  ip                  inet,
  expires_at          timestamptz not null,
  used_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- ── Tickets ─────────────────────────────────────────────────────
create table public.tickets (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id),
  category            text not null,
  priority            text not null default 'medium',
  subject             text not null,
  status              ticket_status not null default 'open',
  created_at          timestamptz not null default now(),
  closed_at           timestamptz
);

create table public.ticket_messages (
  id                  uuid primary key default uuid_generate_v4(),
  ticket_id           uuid not null references public.tickets(id) on delete cascade,
  author_id           uuid not null references public.users(id),
  is_admin            boolean not null default false,
  is_internal_note    boolean not null default false,
  body                text not null,
  created_at          timestamptz not null default now()
);

-- ── Referrals ───────────────────────────────────────────────────
create table public.referrals (
  id                  uuid primary key default uuid_generate_v4(),
  referrer_id         uuid not null references public.users(id),
  referred_id         uuid not null references public.users(id),
  reward_cents        int not null,
  status              text not null default 'pending', -- pending / paid
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- ── IP / activity logs ──────────────────────────────────────────
create table public.ip_logs (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references public.users(id),
  ip                  inet not null,
  country             text,
  city                text,
  is_vpn              boolean default false,
  is_proxy            boolean default false,
  event_type          text not null,                   -- 'login' / 'tool_auth' / 'download' / etc
  user_agent          text,
  created_at          timestamptz not null default now()
);

create index idx_ip_logs_user on public.ip_logs(user_id, created_at desc);

-- ── Flags / security review ─────────────────────────────────────
create table public.flags (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id),
  reason              text not null,
  severity            text not null,                   -- low / medium / high / critical
  source              text not null default 'auto',    -- auto / manual
  resolved_at         timestamptz,
  resolved_by         uuid references public.users(id),
  note                text,
  created_at          timestamptz not null default now()
);

-- ── Redeem codes ────────────────────────────────────────────────
create table public.redeem_codes (
  id                  uuid primary key default uuid_generate_v4(),
  code                text unique not null,
  reward_type         text not null,                   -- license / credit / discount
  reward_payload      jsonb not null,                  -- {product_id, duration_days} or {amount} or {percent}
  max_uses            int,
  uses_count          int not null default 0,
  uses_per_user       int not null default 1,
  expires_at          timestamptz,
  required_tier       tier_t,
  product_id          uuid references public.products(id),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table public.redeem_history (
  id                  uuid primary key default uuid_generate_v4(),
  code_id             uuid not null references public.redeem_codes(id),
  user_id             uuid not null references public.users(id),
  redeemed_at         timestamptz not null default now(),
  unique (code_id, user_id)
);

-- ── Ad spots + campaigns (rental marketplace) ──────────────────
create type ad_status as enum ('scheduled', 'active', 'paused', 'ended');

create table public.ad_spots (
  id                  uuid primary key default uuid_generate_v4(),
  slot_key            text unique not null,             -- 'hero-banner', 'shop-rail', 'footer-strip'
  name                text not null,                    -- "Hero Banner — Homepage"
  location_desc       text,                             -- "Above the fold on /"
  width_px            int,
  height_px           int,
  base_price_cents    int not null default 0,           -- monthly base rent
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table public.ad_campaigns (
  id                  uuid primary key default uuid_generate_v4(),
  spot_id             uuid not null references public.ad_spots(id) on delete cascade,
  advertiser_name     text not null,
  advertiser_email    text,
  image_url           text,
  click_url           text not null,
  alt_text            text,
  starts_at           timestamptz not null default now(),
  ends_at             timestamptz not null,
  paid_cents          int not null default 0,
  impressions_count   bigint not null default 0,
  clicks_count        bigint not null default 0,
  status              ad_status not null default 'scheduled',
  notes               text,
  created_at          timestamptz not null default now()
);

create index idx_campaigns_spot_active on public.ad_campaigns(spot_id, status, starts_at, ends_at);

create table public.ad_events (
  id                  bigserial primary key,
  campaign_id         uuid not null references public.ad_campaigns(id) on delete cascade,
  event_type          text not null,                    -- 'impression' / 'click'
  ip                  inet,
  user_agent          text,
  referer             text,
  created_at          timestamptz not null default now()
);

create index idx_ad_events_campaign on public.ad_events(campaign_id, event_type, created_at desc);

-- ── Audit log ───────────────────────────────────────────────────
create table public.audit_logs (
  id                  uuid primary key default uuid_generate_v4(),
  admin_id            uuid not null references public.users(id),
  action              text not null,                   -- BAN_USER / REVOKE_LICENSE / etc
  target_type         text,
  target_id           uuid,
  payload             jsonb,
  ip                  inet,
  created_at          timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
alter table public.users               enable row level security;
alter table public.licenses            enable row level security;
alter table public.reseller_keys       enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.orders              enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.tickets             enable row level security;
alter table public.ticket_messages     enable row level security;
alter table public.referrals           enable row level security;
alter table public.redeem_history      enable row level security;
alter table public.ip_logs             enable row level security;
alter table public.hwid_registry       enable row level security;
alter table public.license_sessions    enable row level security;

-- Users can read/update their own row
create policy users_select_own on public.users  for select using (auth.uid() = id);
create policy users_update_own on public.users  for update using (auth.uid() = id);

-- Licenses / subs / orders / txns: owner-only
create policy lic_select on public.licenses            for select using (auth.uid() = user_id);
create policy sub_select on public.subscriptions       for select using (auth.uid() = user_id);
create policy ord_select on public.orders              for select using (auth.uid() = user_id);
create policy tx_select  on public.wallet_transactions for select using (auth.uid() = user_id);
create policy tk_select  on public.tickets             for select using (auth.uid() = user_id);
create policy ref_select on public.referrals           for select using (auth.uid() = referrer_id);
create policy hw_select  on public.hwid_registry       for select using (
  exists (select 1 from public.licenses l where l.id = license_id and l.user_id = auth.uid())
);

-- Reseller keys: only the owning reseller can see them
create policy rk_select on public.reseller_keys for select using (auth.uid() = reseller_id);
create policy rk_insert on public.reseller_keys for insert with check (
  auth.uid() = reseller_id
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'reseller')
);

-- Admins bypass — service role connection ignores RLS

-- ════════════════════════════════════════════════════════════════
-- AUTO PROFILE — every auth.user gets a public.users row on signup
-- ════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_username text := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  ref_code     text := coalesce(new.raw_user_meta_data->>'referral_code', null);
  generated    text := 'ONYX-' || upper(substring(md5(new.id::text) from 1 for 8));
begin
  insert into public.users (id, username, email, referral_code, email_verified)
  values (
    new.id,
    raw_username,
    new.email,
    generated,
    new.email_confirmed_at is not null
  );

  -- Link referrer if their code matches
  if ref_code is not null then
    update public.users
    set referred_by_id = (select id from public.users where referral_code = ref_code limit 1)
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
