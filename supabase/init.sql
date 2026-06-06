-- ════════════════════════════════════════════════════════════════
--  Onyx Services — v1 minimal schema
--  Paste into Supabase SQL editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Profiles (extends auth.users) ───────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  email           text unique not null,
  balance_cents   bigint not null default 0,
  role            text not null default 'user',           -- 'user' / 'support' / 'super_admin'
  parent_id       text not null default '#1',
  created_at      timestamptz not null default now()
);

-- ── Licenses ────────────────────────────────────────────────────
create table if not exists public.licenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  product         text not null,
  key_full        text not null,                          -- full key (visible to issuer)
  key_prefix      text not null,                          -- first segment for table display
  status          text not null default 'pending',        -- 'active' / 'expired' / 'banned' / 'pending'
  duration_days   int,                                    -- null = lifetime
  expires_at      timestamptz,
  hwid            text,
  ip              text,
  last_seen       timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_licenses_user on public.licenses(user_id, created_at desc);

-- ── Wallet transactions ─────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null,                          -- 'topup' / 'generate' / 'refund' / 'adjustment'
  amount_cents    bigint not null,                        -- positive for credits, negative for debits
  description     text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id, created_at desc);

-- ── Redeem codes (master-account top-up codes) ──────────────────
create table if not exists public.redeem_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  amount_cents    bigint not null,
  used_by         uuid references public.profiles(id),
  used_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ── Activity feed ───────────────────────────────────────────────
create table if not exists public.activity (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  event_type      text not null,                          -- 'generated' / 'banned' / 'redeemed'
  target_label    text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_activity_user on public.activity(user_id, created_at desc);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
alter table public.profiles     enable row level security;
alter table public.licenses     enable row level security;
alter table public.transactions enable row level security;
alter table public.activity     enable row level security;

drop policy if exists prof_select on public.profiles;
drop policy if exists prof_update on public.profiles;
drop policy if exists lic_select  on public.licenses;
drop policy if exists tx_select   on public.transactions;
drop policy if exists act_select  on public.activity;

create policy prof_select on public.profiles     for select using (auth.uid() = id);
create policy prof_update on public.profiles     for update using (auth.uid() = id);
create policy lic_select  on public.licenses     for select using (auth.uid() = user_id);
create policy tx_select   on public.transactions for select using (auth.uid() = user_id);
create policy act_select  on public.activity     for select using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- AUTO-PROFILE TRIGGER
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth.users without profiles
insert into public.profiles (id, username, email)
select u.id, split_part(u.email, '@', 1), u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
