-- ════════════════════════════════════════════════════════════════
--  OP CLEAN INSTALL — single file, everything, paste-and-run
--
--  ⚠️  WARNING: DESTRUCTIVE
--  Drops ALL data in public schema (users in auth.users are kept;
--  their profiles + licenses + everything else are deleted).
--
--  Run order:
--    1. Paste this whole file into Supabase SQL Editor
--    2. Run
--    3. (After it succeeds) the verification SELECT at the bottom
--       shows you every table that exists.
-- ════════════════════════════════════════════════════════════════

-- ── 1. WIPE ────────────────────────────────────────────────────
drop schema if exists public cascade;
create schema public;

-- Restore Supabase's default grants on the new schema
grant usage on schema public to anon, authenticated, service_role, postgres;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role, postgres;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role, postgres;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role, postgres;

-- ── 2. EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "pgcrypto";


-- ════════════════════════════════════════════════════════════════
-- TABLES
-- ════════════════════════════════════════════════════════════════

-- ── Profiles (extends auth.users) ──────────────────────────────
create table public.profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  username                 text unique not null,
  email                    text unique not null,
  balance_cents            bigint not null default 0,
  role                     text not null default 'user',         -- 'user' / 'reseller' / 'support' / 'super_admin'
  parent_id                text not null default '#1',
  status                   text not null default 'active',       -- active / suspended / banned
  suspended_until          timestamptz,
  suspended_reason         text,
  -- Discord linking + first-link credit tracking
  discord_id               text unique,
  discord_username         text,
  discord_linked_at        timestamptz,
  discord_credit_given     boolean not null default false,
  -- IP audit
  last_ip                  text,
  signup_ip                text,
  -- spending audit
  total_spent_cents        bigint not null default 0,
  -- referral
  referral_code            text unique,
  -- reseller plan link (filled in when they buy)
  reseller_plan_id         uuid,
  reseller_plan_expires_at timestamptz,
  reseller_purchased_at    timestamptz,
  created_at               timestamptz not null default now()
);

-- ── Reseller plans (paid tiers) ────────────────────────────────
create table public.reseller_plans (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text unique not null,
  name                     text not null,
  tagline                  text,
  description              text,
  price_lifetime_cents     int,
  price_monthly_cents      int,
  price_yearly_cents       int,
  features                 text[] not null default '{}'::text[],
  max_applications         int,                                  -- null = unlimited
  extra_discount_pct       int not null default 0,
  priority_support         boolean not null default false,
  featured                 boolean not null default false,
  badge                    text,
  cta_label                text default 'Become a reseller',
  sort_order               int not null default 0,
  active                   boolean not null default true,
  created_at               timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_reseller_plan_fk
  foreign key (reseller_plan_id) references public.reseller_plans(id) on delete set null;

-- ── Products (the catalog) ─────────────────────────────────────
create table public.products (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text unique not null,
  name                      text not null,
  subtitle                  text,
  tagline                   text,
  description               text,
  long_description          text,
  image_url                 text,
  gallery_urls              text[] not null default '{}'::text[],
  youtube_url               text,
  demo_url                  text,
  download_url              text,
  category                  text not null default 'tool',
  product_type              text not null default 'tool',        -- tool / source_code / account / subscription / flat / bundle / service
  delivery_method           text not null default 'instant_key', -- instant_key / email_delivery / manual_review / download_link / account_credentials
  version                   text not null default '1.0.0',
  status                    text not null default 'active',      -- active / paused / discontinued
  -- pricing (cents)
  price_day                 int,
  price_week                int,
  price_month               int,
  price_lifetime            int,
  original_price_month      int,
  original_price_lifetime   int,
  discount_pct              int not null default 0,
  reseller_price_day        int,
  reseller_price_week       int,
  reseller_price_month      int,
  reseller_price_lifetime   int,
  reseller_open             boolean not null default true,
  reseller_auto_approve     boolean not null default false,
  -- merchandising
  features                  text[] not null default '{}'::text[],
  badges                    text[] not null default '{}'::text[],
  cta_label                 text,
  cta_color                 text,
  accent_color              text,
  social_proof              text,
  requirements              text,
  faq                       text,
  -- inventory
  stock_limited             boolean not null default false,
  stock_remaining           int,
  -- support
  lifetime_support          boolean not null default true,
  support_tier              text not null default 'standard',
  requires_review           boolean not null default false,
  subscription_period       text,                                 -- weekly / monthly / quarterly / yearly
  -- scheduling
  hidden_until              timestamptz,
  -- SEO
  meta_title                text,
  meta_description          text,
  meta_keywords             text[] not null default '{}'::text[],
  -- ranking
  featured                  boolean not null default false,
  sort_order                int not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ── Licenses ───────────────────────────────────────────────────
create table public.licenses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  product             text not null,
  product_id          uuid references public.products(id) on delete set null,
  key_full            text not null,
  key_prefix          text not null,
  status              text not null default 'pending',           -- pending / active / expired / banned
  duration_days       int,
  expires_at          timestamptz,
  hwid                text,
  ip                  text,
  last_seen           timestamptz,
  -- extra meta added across migrations
  end_username        text,
  banned              boolean not null default false,
  ban_reason          text,
  hwid_locked_at      timestamptz,
  last_login_at       timestamptz,
  login_count         int not null default 0,
  -- self-serve HWID resets
  hwid_reset_count    int not null default 0,
  last_hwid_reset_at  timestamptz,
  max_hwid_resets     int not null default 3,
  -- admin notes
  notes               text,
  -- lifetime flag (regular column, NOT generated — kept in sync by trigger)
  is_lifetime         boolean not null default false,
  -- relationship to a registered application (for auth-engine licenses)
  app_id              uuid,                                       -- FK added after applications table is created
  created_at          timestamptz not null default now()
);

-- ── Applications (reseller's own WPF/etc tools using OP auth) ──
create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  app_id          text unique not null,
  name            text not null,
  description     text,
  secret_hash     text not null,
  version         text not null default '1.0.0',
  status          text not null default 'active',                -- active / paused / disabled
  hwid_lock       boolean not null default true,
  version_check   boolean not null default false,
  freeze_users    boolean not null default false,
  total_users     int not null default 0,
  online_users    int not null default 0,
  created_at      timestamptz not null default now()
);

-- Now add FK from licenses.app_id → applications.id
alter table public.licenses
  add constraint licenses_app_id_fk
  foreign key (app_id) references public.applications(id) on delete cascade;

-- ── Auth sessions (issued on /api/v1/auth/login) ───────────────
create table public.auth_sessions (
  id              uuid primary key default gen_random_uuid(),
  license_id      uuid not null references public.licenses(id) on delete cascade,
  app_id          uuid not null references public.applications(id) on delete cascade,
  session_token   text unique not null,
  hwid            text not null,
  ip              text,
  user_agent      text,
  last_heartbeat  timestamptz not null default now(),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

-- ── Auth event audit log ───────────────────────────────────────
create table public.auth_logs (
  id              uuid primary key default gen_random_uuid(),
  app_id          uuid references public.applications(id) on delete cascade,
  license_id      uuid references public.licenses(id) on delete set null,
  event_type      text not null,
  code            text,
  ip              text,
  hwid            text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- ── Auth throttle ──────────────────────────────────────────────
create table public.auth_throttle (
  ip              text not null,
  app_id          uuid not null references public.applications(id) on delete cascade,
  attempts        int not null default 1,
  window_start    timestamptz not null default now(),
  blocked_until   timestamptz,
  primary key (ip, app_id)
);

-- ── Wallet transactions ────────────────────────────────────────
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null,
  amount_cents    bigint not null,
  description     text,
  meta            jsonb,
  actor_id        uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- ── Redeem codes ───────────────────────────────────────────────
create table public.redeem_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  amount_cents    bigint not null,
  used_by         uuid references public.profiles(id),
  used_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ── Activity feed ──────────────────────────────────────────────
create table public.activity (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  event_type      text not null,
  target_label    text,
  created_at      timestamptz not null default now()
);

-- ── Tickets ────────────────────────────────────────────────────
create table public.tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  subject         text not null,
  category        text not null default 'general',
  priority        text not null default 'medium',
  status          text not null default 'open',                  -- open / replied / closed
  last_reply_at   timestamptz not null default now(),
  closed_at       timestamptz,
  license_id      uuid references public.licenses(id) on delete set null,
  auto_diagnosis  text,
  auto_resolved   boolean not null default false,
  is_priority     boolean not null default false,
  created_at      timestamptz not null default now()
);

create table public.ticket_messages (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.tickets(id) on delete cascade,
  author_id       uuid not null references public.profiles(id),
  is_admin        boolean not null default false,
  is_internal     boolean not null default false,
  body            text not null,
  created_at      timestamptz not null default now()
);

-- ── Announcements (banner) ─────────────────────────────────────
create table public.announcements (
  id              uuid primary key default gen_random_uuid(),
  message         text not null,
  variant         text not null default 'info',
  link_url        text,
  link_label      text,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- ── Reseller grants (per-product whitelabel) ───────────────────
create table public.reseller_grants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  reseller_id     uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'pending',               -- pending / approved / rejected / revoked
  custom_name     text,
  custom_image    text,
  pitch           text,
  discount_pct    int not null default 0,
  approved_by     uuid references public.profiles(id),
  approved_at     timestamptz,
  rejected_reason text,
  created_at      timestamptz not null default now(),
  unique (product_id, reseller_id)
);

-- ── Product updates (release notes) ────────────────────────────
create table public.product_updates (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  version         text not null,
  title           text not null,
  notes           text,
  severity        text not null default 'minor',                 -- patch / minor / major / breaking
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- ── Notifications ──────────────────────────────────────────────
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null,
  title           text not null,
  body            text,
  link_url        text,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ── Status page: incidents + uptime checks ─────────────────────
create table public.status_incidents (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  body            text,
  severity        text not null default 'minor',                 -- minor / major / critical
  status          text not null default 'investigating',         -- investigating / identified / monitoring / resolved
  affected        text[] not null default '{}'::text[],          -- 'api'/'dashboard'/'auth'/'payments'
  started_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  created_by      uuid references public.profiles(id)
);

create table public.status_checks (
  id              bigserial primary key,
  service         text not null,
  ok              boolean not null,
  latency_ms      int,
  checked_at      timestamptz not null default now()
);

-- ── CMS pages (blog, FAQ entries, announcements, giveaways) ────
create table public.cms_pages (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  page_type           text not null default 'page',              -- page / faq / blog / announcement / giveaway
  title               text not null,
  subtitle            text,
  body                text not null,
  status              text not null default 'draft',             -- draft / published / archived
  featured            boolean not null default false,
  meta_title          text,
  meta_description    text,
  meta_keywords       text[] not null default '{}'::text[],
  og_image_url        text,
  author_id           uuid references public.profiles(id),
  published_at        timestamptz,
  view_count          int not null default 0,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Discord credit audit log ───────────────────────────────────
create table public.discord_credit_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  discord_id      text not null,
  discord_username text,
  ip              text,
  user_agent      text,
  amount_cents    int not null default 100,
  granted         boolean not null,
  reject_reason   text,
  created_at      timestamptz not null default now()
);

-- ── Admin audit ────────────────────────────────────────────────
create table public.admin_audit (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid references public.profiles(id) on delete set null,
  target_id       uuid,
  action          text not null,
  details         jsonb,
  created_at      timestamptz not null default now()
);


-- ════════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════════
create index idx_profiles_status      on public.profiles(status);
create index idx_profiles_role        on public.profiles(role);
create index idx_profiles_discord     on public.profiles(discord_id);
create index idx_licenses_user        on public.licenses(user_id, created_at desc);
create index idx_licenses_app         on public.licenses(app_id, created_at desc);
create index idx_licenses_product     on public.licenses(product_id);
create index idx_applications_owner   on public.applications(owner_id, created_at desc);
create index idx_applications_app_id  on public.applications(app_id);
create index idx_sessions_token       on public.auth_sessions(session_token);
create index idx_sessions_app         on public.auth_sessions(app_id, last_heartbeat desc);
create index idx_auth_logs_app        on public.auth_logs(app_id, created_at desc);
create index idx_auth_logs_ip         on public.auth_logs(ip, created_at desc);
create index idx_transactions_user    on public.transactions(user_id, created_at desc);
create index idx_activity_user        on public.activity(user_id, created_at desc);
create index idx_tickets_user         on public.tickets(user_id, created_at desc);
create index idx_tickets_status       on public.tickets(status, last_reply_at desc);
create index idx_ticket_msgs          on public.ticket_messages(ticket_id, created_at);
create index idx_announcements_active on public.announcements(is_active, created_at desc);
create index idx_products_status      on public.products(status, featured desc, sort_order);
create index idx_products_slug        on public.products(slug);
create index idx_grants_status        on public.reseller_grants(status, created_at desc);
create index idx_grants_reseller      on public.reseller_grants(reseller_id, status);
create index idx_updates_product      on public.product_updates(product_id, created_at desc);
create index idx_notifs_user          on public.notifications(user_id, is_read, created_at desc);
create index idx_incidents_status     on public.status_incidents(status, started_at desc);
create index idx_checks_service_time  on public.status_checks(service, checked_at desc);
create index idx_cms_status           on public.cms_pages(page_type, status, sort_order);
create index idx_cms_slug             on public.cms_pages(slug);
create index idx_discred_user         on public.discord_credit_log(user_id, created_at desc);
create index idx_discred_disc         on public.discord_credit_log(discord_id);
create index idx_discred_ip           on public.discord_credit_log(ip, created_at desc);
create index idx_reseller_plans_active on public.reseller_plans(active, sort_order);
create index idx_audit_admin          on public.admin_audit(admin_id, created_at desc);
create index idx_audit_target         on public.admin_audit(target_id, created_at desc);


-- ════════════════════════════════════════════════════════════════
-- TRIGGERS / FUNCTIONS
-- ════════════════════════════════════════════════════════════════

-- 1. Auto-create profile when a new auth.users row appears
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

-- Backfill profiles for existing auth.users
insert into public.profiles (id, username, email)
select u.id, split_part(u.email, '@', 1), u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;


-- 2. Keep licenses.is_lifetime in sync (replaces GENERATED column)
create or replace function public.sync_is_lifetime()
returns trigger language plpgsql as $$
begin
  new.is_lifetime := (new.duration_days is null and new.expires_at is null);
  return new;
end;
$$;

drop trigger if exists trg_sync_is_lifetime on public.licenses;
create trigger trg_sync_is_lifetime
  before insert or update on public.licenses
  for each row execute function public.sync_is_lifetime();


-- 3. Lifetime ticket priority flag
create or replace function public.flag_priority_on_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  has_lifetime boolean;
begin
  select exists (
    select 1 from public.licenses
    where user_id = new.user_id
      and is_lifetime = true
      and status = 'active'
  ) into has_lifetime;

  if has_lifetime then
    new.is_priority := true;
    new.priority    := 'high';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_flag_priority on public.tickets;
create trigger trg_flag_priority
  before insert on public.tickets
  for each row execute function public.flag_priority_on_ticket();


-- 4. Fan-out product updates to approved resellers as notifications
create or replace function public.notify_resellers_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  prod_name text;
begin
  select name into prod_name from public.products where id = new.product_id;

  insert into public.notifications (user_id, type, title, body, link_url)
  select rg.reseller_id,
         'product_update',
         format('%s · v%s released', coalesce(prod_name, 'Product'), new.version),
         coalesce(new.title, '') || E'\n' || coalesce(new.notes, ''),
         '/dashboard/resells'
  from public.reseller_grants rg
  where rg.product_id = new.product_id and rg.status = 'approved';

  return new;
end;
$$;

drop trigger if exists trg_notify_resellers on public.product_updates;
create trigger trg_notify_resellers
  after insert on public.product_updates
  for each row execute function public.notify_resellers_on_update();


-- 5. Discord credit grant — atomic + idempotent + anti-abuse
create or replace function public.grant_discord_credit(
  p_user_id          uuid,
  p_discord_id       text,
  p_discord_username text,
  p_ip               text,
  p_user_agent       text,
  p_amount_cents     int default 100
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_already_credited boolean;
  v_already_used     boolean;
  v_existing_user    uuid;
  v_ip_count         int;
begin
  select discord_credit_given into v_already_credited
    from public.profiles where id = p_user_id for update;

  if v_already_credited then
    return jsonb_build_object('granted', false, 'reason', 'already_credited');
  end if;

  select exists (
    select 1 from public.profiles
    where discord_id = p_discord_id and discord_credit_given = true and id <> p_user_id
  ) into v_already_used;
  if v_already_used then
    insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, granted, reject_reason)
    values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, false, 'discord_already_used');
    return jsonb_build_object('granted', false, 'reason', 'discord_already_used');
  end if;

  select id into v_existing_user
    from public.profiles where discord_id = p_discord_id and id <> p_user_id limit 1;
  if v_existing_user is not null then
    insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, granted, reject_reason)
    values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, false, 'discord_linked_elsewhere');
    return jsonb_build_object('granted', false, 'reason', 'discord_linked_elsewhere');
  end if;

  select count(*) into v_ip_count
    from public.discord_credit_log
    where ip = p_ip and granted = true and created_at > now() - interval '7 days';

  if v_ip_count >= 3 then
    insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, granted, reject_reason)
    values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, false, 'ip_throttle');
    return jsonb_build_object('granted', false, 'reason', 'ip_throttle');
  end if;

  update public.profiles
    set discord_id           = p_discord_id,
        discord_username     = p_discord_username,
        discord_linked_at    = now(),
        discord_credit_given = true,
        balance_cents        = balance_cents + p_amount_cents
    where id = p_user_id;

  insert into public.transactions (user_id, type, amount_cents, description, meta)
  values (p_user_id, 'discord_link_bonus', p_amount_cents, 'Linked Discord account',
          jsonb_build_object('discord_id', p_discord_id, 'discord_username', p_discord_username));

  insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, amount_cents, granted)
  values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, p_amount_cents, true);

  insert into public.notifications (user_id, type, title, body, link_url)
  values (p_user_id, 'discord_linked',
          'Discord linked — $1 credit added',
          'Your wallet has been credited with $1.00 for linking your Discord account.',
          '/dashboard/balance');

  return jsonb_build_object('granted', true, 'amount_cents', p_amount_cents);
end;
$$;


-- 6. Admin credit user
create or replace function public.admin_credit_user(
  p_admin_id  uuid,
  p_target_id uuid,
  p_cents     bigint,
  p_reason    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set balance_cents = balance_cents + p_cents where id = p_target_id;
  insert into public.transactions (user_id, type, amount_cents, description, actor_id)
  values (p_target_id,
          case when p_cents >= 0 then 'admin_credit' else 'admin_debit' end,
          p_cents, p_reason, p_admin_id);
  insert into public.admin_audit (admin_id, target_id, action, details)
  values (p_admin_id, p_target_id, 'credit_user', jsonb_build_object('cents', p_cents, 'reason', p_reason));
  return jsonb_build_object('ok', true);
end;
$$;


-- 7. Purchase reseller plan
create or replace function public.purchase_reseller_plan(
  p_user_id        uuid,
  p_plan_id        uuid,
  p_billing_cycle  text,
  p_paid_cents     bigint
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_balance bigint;
  v_expiry  timestamptz;
begin
  select balance_cents into v_balance from public.profiles where id = p_user_id for update;
  if v_balance < p_paid_cents then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_balance');
  end if;

  if p_billing_cycle = 'lifetime' then     v_expiry := null;
  elsif p_billing_cycle = 'monthly' then   v_expiry := now() + interval '30 days';
  elsif p_billing_cycle = 'yearly' then    v_expiry := now() + interval '365 days';
  else  return jsonb_build_object('ok', false, 'reason', 'invalid_cycle');
  end if;

  update public.profiles
    set role                    = case when role = 'super_admin' then role else 'reseller' end,
        reseller_plan_id        = p_plan_id,
        reseller_plan_expires_at = v_expiry,
        reseller_purchased_at   = now(),
        balance_cents           = balance_cents - p_paid_cents,
        total_spent_cents       = total_spent_cents + p_paid_cents
    where id = p_user_id;

  insert into public.transactions (user_id, type, amount_cents, description, meta)
  values (p_user_id, 'reseller_purchase', -p_paid_cents,
          format('Reseller plan (%s)', p_billing_cycle),
          jsonb_build_object('plan_id', p_plan_id, 'cycle', p_billing_cycle));

  insert into public.notifications (user_id, type, title, body, link_url)
  values (p_user_id, 'reseller_activated',
          'Welcome to the reseller program',
          format('Your reseller access is active%s.',
                 case when v_expiry is null then ' for life' else format(' until %s', to_char(v_expiry, 'YYYY-MM-DD')) end),
          '/dashboard/applications');

  return jsonb_build_object('ok', true, 'expires_at', v_expiry);
end;
$$;


-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.licenses          enable row level security;
alter table public.applications      enable row level security;
alter table public.auth_sessions     enable row level security;
alter table public.auth_logs         enable row level security;
alter table public.auth_throttle     enable row level security;
alter table public.transactions      enable row level security;
alter table public.activity          enable row level security;
alter table public.tickets           enable row level security;
alter table public.ticket_messages   enable row level security;
alter table public.announcements     enable row level security;
alter table public.products          enable row level security;
alter table public.reseller_grants   enable row level security;
alter table public.product_updates   enable row level security;
alter table public.notifications     enable row level security;
alter table public.status_incidents  enable row level security;
alter table public.status_checks     enable row level security;
alter table public.cms_pages         enable row level security;
alter table public.discord_credit_log enable row level security;
alter table public.admin_audit       enable row level security;
alter table public.reseller_plans    enable row level security;

-- Profiles
create policy prof_select on public.profiles for select using (auth.uid() = id);
create policy prof_update on public.profiles for update using (auth.uid() = id);

-- Licenses
create policy lic_select on public.licenses for select using (auth.uid() = user_id);

-- Applications (owned by the reseller)
create policy app_select on public.applications for select using (auth.uid() = owner_id);
create policy app_insert on public.applications for insert with check (auth.uid() = owner_id);
create policy app_update on public.applications for update using (auth.uid() = owner_id);
create policy app_delete on public.applications for delete using (auth.uid() = owner_id);

-- Sessions / logs (view if you own the app)
create policy sess_select on public.auth_sessions for select using (
  exists (select 1 from public.applications a where a.id = app_id and a.owner_id = auth.uid())
);
create policy log_select  on public.auth_logs    for select using (
  exists (select 1 from public.applications a where a.id = app_id and a.owner_id = auth.uid())
);

-- Transactions / activity
create policy tx_select  on public.transactions for select using (auth.uid() = user_id);
create policy act_select on public.activity     for select using (auth.uid() = user_id);

-- Tickets
create policy tk_select_own  on public.tickets for select using (auth.uid() = user_id);
create policy tk_insert_own  on public.tickets for insert with check (auth.uid() = user_id);
create policy tk_update_own  on public.tickets for update using (auth.uid() = user_id);

create policy msg_select_own on public.ticket_messages for select using (
  not is_internal
  and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
);
create policy msg_insert_own on public.ticket_messages for insert with check (
  auth.uid() = author_id and not is_admin and not is_internal
  and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
);

-- Announcements / public reads
create policy ann_select on public.announcements for select using (is_active);

-- Products
create policy prod_select_public on public.products for select using (status = 'active');

-- Reseller grants
create policy grant_select_own on public.reseller_grants for select using (auth.uid() = reseller_id);
create policy grant_insert_own on public.reseller_grants for insert with check (auth.uid() = reseller_id);

-- Product updates — anyone can read updates for active products
create policy upd_select_public on public.product_updates for select using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
);

-- Notifications
create policy notif_select_own on public.notifications for select using (auth.uid() = user_id);
create policy notif_update_own on public.notifications for update using (auth.uid() = user_id);

-- Status
create policy incidents_select_public on public.status_incidents for select using (true);
create policy checks_select_public    on public.status_checks    for select using (true);

-- CMS — published pages are public
create policy cms_select_pub on public.cms_pages for select using (status = 'published');

-- Discord credit log — own only
create policy discred_own on public.discord_credit_log for select using (auth.uid() = user_id);

-- Reseller plans — public for active
create policy rp_select_pub on public.reseller_plans for select using (active = true);


-- ════════════════════════════════════════════════════════════════
-- GRANTS (required — RLS still enforces row visibility)
-- ════════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

grant execute on function public.grant_discord_credit       to anon, authenticated, service_role;
grant execute on function public.admin_credit_user          to service_role;
grant execute on function public.purchase_reseller_plan     to authenticated, service_role;


-- ════════════════════════════════════════════════════════════════
-- SEED DATA — reseller plans (3 tiers)
-- ════════════════════════════════════════════════════════════════
insert into public.reseller_plans (slug, name, tagline, description,
  price_lifetime_cents, price_monthly_cents, price_yearly_cents,
  features, max_applications, extra_discount_pct, priority_support, featured, badge, sort_order)
values
  ('starter', 'Starter Reseller',
   'Start your own panel — month to month.',
   'Perfect if you just want to test the waters or run one small tool. Cancel anytime.',
   null, 1499, 14999,
   array['Apply to resell up to 3 products','Wholesale pricing','Use OP auth engine','5 application slots','Standard support'],
   5, 0, false, false, null, 1),
  ('pro', 'Pro Reseller',
   'Real-volume resellers. Best balance of price and perks.',
   E'Full white-label access. Stack additional discount on top of approved per-product wholesale. Priority support queue.',
   9999, 2999, 29999,
   array['Apply to resell unlimited products','Wholesale pricing + 10% extra discount','Unlimited application slots','Priority support','Discord webhook on events','Custom branding per product'],
   null, 10, true, true, 'Most popular', 2),
  ('elite', 'Elite Reseller',
   'Lifetime access, max discount, hands-on support.',
   'You get everything plus a dedicated channel with the OP team. Lifetime — pay once, run forever.',
   29999, null, null,
   array['Everything in Pro','+15% extra wholesale discount','Hands-on launch help for your first tool','Featured spotlight on /products','Direct Discord channel with OP team','First access to new tools'],
   null, 15, true, true, 'Lifetime', 3);


-- ════════════════════════════════════════════════════════════════
-- SEED — one sample product so /products has something
-- ════════════════════════════════════════════════════════════════
insert into public.products (slug, name, tagline, description, category, version,
  price_day, price_week, price_month, price_lifetime,
  reseller_price_day, reseller_price_week, reseller_price_month, reseller_price_lifetime,
  features, featured, sort_order)
values (
  'sample-tool',
  'Sample Tool',
  'Example product — replace with your real tool.',
  E'## What it does\n\nThis is a sample product entry. Edit or delete it from /admin/products.\n\n## What you get\n\n- Drop-in WPF tool with built-in OP auth\n- HWID-bound licensing\n- 24/7 support for lifetime buyers',
  'tool', '1.0.0',
  500, 1500, 3500, 9900,
  125, 375, 875, 2475,
  array['HWID protection','Discord notifications','Auto-updater','Priority support (lifetime)'],
  true, 0
);


-- ════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════
select table_name, '✓' as status
from information_schema.tables
where table_schema = 'public'
order by table_name;
