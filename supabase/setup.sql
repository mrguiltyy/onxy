-- ════════════════════════════════════════════════════════════════
--  OP Panel — Complete database setup
--
--  Paste THIS WHOLE FILE into Supabase SQL Editor and click Run.
--  This is everything you need. No other scripts required.
--  Idempotent — safe to re-run.
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
  key_full        text not null,
  key_prefix      text not null,
  status          text not null default 'pending',
  duration_days   int,
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
  type            text not null,
  amount_cents    bigint not null,
  description     text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id, created_at desc);

-- ── Redeem codes ────────────────────────────────────────────────
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
  event_type      text not null,
  target_label    text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_activity_user on public.activity(user_id, created_at desc);

-- ── Tickets ─────────────────────────────────────────────────────
create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  subject         text not null,
  category        text not null default 'general',
  priority        text not null default 'medium',
  status          text not null default 'open',
  last_reply_at   timestamptz not null default now(),
  closed_at       timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_tickets_user   on public.tickets(user_id, created_at desc);
create index if not exists idx_tickets_status on public.tickets(status, last_reply_at desc);

create table if not exists public.ticket_messages (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.tickets(id) on delete cascade,
  author_id       uuid not null references public.profiles(id),
  is_admin        boolean not null default false,
  is_internal     boolean not null default false,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ticket_msgs on public.ticket_messages(ticket_id, created_at);

-- ── Announcements ───────────────────────────────────────────────
create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  message         text not null,
  variant         text not null default 'info',
  link_url        text,
  link_label      text,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_announcements_active on public.announcements(is_active, created_at desc);

-- ════════════════════════════════════════════════════════════════
-- GRANTS (required — without these you get "permission denied")
-- These are normally auto-applied by Supabase, but get wiped if you
-- run `drop schema public cascade` to clean up.
-- RLS policies below further restrict what each row can do.
-- ════════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
alter table public.profiles        enable row level security;
alter table public.licenses        enable row level security;
alter table public.transactions    enable row level security;
alter table public.activity        enable row level security;
alter table public.tickets         enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.announcements   enable row level security;

drop policy if exists prof_select     on public.profiles;
drop policy if exists prof_update     on public.profiles;
drop policy if exists lic_select      on public.licenses;
drop policy if exists tx_select       on public.transactions;
drop policy if exists act_select      on public.activity;
drop policy if exists tk_select_own   on public.tickets;
drop policy if exists tk_insert_own   on public.tickets;
drop policy if exists tk_update_own   on public.tickets;
drop policy if exists msg_select_own  on public.ticket_messages;
drop policy if exists msg_insert_own  on public.ticket_messages;
drop policy if exists ann_select_all  on public.announcements;

create policy prof_select     on public.profiles        for select using (auth.uid() = id);
create policy prof_update     on public.profiles        for update using (auth.uid() = id);
create policy lic_select      on public.licenses        for select using (auth.uid() = user_id);
create policy tx_select       on public.transactions    for select using (auth.uid() = user_id);
create policy act_select      on public.activity        for select using (auth.uid() = user_id);

create policy tk_select_own   on public.tickets         for select using (auth.uid() = user_id);
create policy tk_insert_own   on public.tickets         for insert with check (auth.uid() = user_id);
create policy tk_update_own   on public.tickets         for update using (auth.uid() = user_id);

create policy msg_select_own  on public.ticket_messages for select using (
  not is_internal
  and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
);

create policy msg_insert_own  on public.ticket_messages for insert with check (
  auth.uid() = author_id
  and not is_admin
  and not is_internal
  and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
);

create policy ann_select_all  on public.announcements   for select using (is_active);

-- ════════════════════════════════════════════════════════════════
-- AUTO-PROFILE TRIGGER — every auth.user gets a profile row
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

-- Backfill any existing auth.users that don't have a profile yet
insert into public.profiles (id, username, email)
select u.id, split_part(u.email, '@', 1), u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════
-- VERIFICATION (you should see 8 rows after this runs)
-- ════════════════════════════════════════════════════════════════
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
