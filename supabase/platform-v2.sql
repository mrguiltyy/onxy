-- ════════════════════════════════════════════════════════════════
--  OP Platform v2 — admin user mgmt + flexible products + Discord credit
--
--  Run AFTER all previous migrations.
--  Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ── Profiles: status + Discord linking ──────────────────────────
alter table public.profiles add column if not exists status              text not null default 'active'; -- active / suspended / banned
alter table public.profiles add column if not exists suspended_until     timestamptz;
alter table public.profiles add column if not exists suspended_reason    text;
alter table public.profiles add column if not exists discord_id          text unique;
alter table public.profiles add column if not exists discord_username    text;
alter table public.profiles add column if not exists discord_linked_at   timestamptz;
alter table public.profiles add column if not exists discord_credit_given boolean not null default false;
alter table public.profiles add column if not exists last_ip             text;
alter table public.profiles add column if not exists signup_ip           text;
alter table public.profiles add column if not exists total_spent_cents   bigint not null default 0;
alter table public.profiles add column if not exists referral_code       text unique;

create index if not exists idx_profiles_status   on public.profiles(status);
create index if not exists idx_profiles_role     on public.profiles(role);
create index if not exists idx_profiles_discord  on public.profiles(discord_id);

-- ── Products: hugely expanded customization ─────────────────────
alter table public.products add column if not exists product_type           text not null default 'tool';
  -- tool / source_code / account / subscription / flat / bundle / service
alter table public.products add column if not exists subtitle               text;
alter table public.products add column if not exists long_description       text;
alter table public.products add column if not exists delivery_method        text not null default 'instant_key';
  -- instant_key / email_delivery / manual_review / download_link / account_credentials
alter table public.products add column if not exists download_url           text;
alter table public.products add column if not exists demo_url               text;
alter table public.products add column if not exists youtube_url            text;
alter table public.products add column if not exists gallery_urls           text[] not null default '{}'::text[];
alter table public.products add column if not exists cta_label              text;            -- "Buy now" / "Get source" / "Subscribe"
alter table public.products add column if not exists cta_color              text;            -- hex like #f0a4b7
alter table public.products add column if not exists accent_color           text;            -- hex
alter table public.products add column if not exists badges                 text[] not null default '{}'::text[];
  -- "Hot" / "New" / "Limited" / "VIP only" / "Best seller"
alter table public.products add column if not exists requires_review        boolean not null default false;
alter table public.products add column if not exists original_price_lifetime int;             -- struck-through pricing
alter table public.products add column if not exists original_price_month   int;
alter table public.products add column if not exists discount_pct           int not null default 0;
alter table public.products add column if not exists stock_limited          boolean not null default false;
alter table public.products add column if not exists stock_remaining        int;              -- null = unlimited
alter table public.products add column if not exists social_proof          text;             -- "500+ sold this week" custom string
alter table public.products add column if not exists requirements           text;             -- system requirements / notes
alter table public.products add column if not exists faq                    text;             -- product-specific FAQ markdown
alter table public.products add column if not exists subscription_period    text;             -- monthly / yearly / weekly / quarterly (for subscription type)
alter table public.products add column if not exists support_tier           text not null default 'standard'; -- standard / priority / dedicated
alter table public.products add column if not exists hidden_until           timestamptz;      -- scheduled launches
alter table public.products add column if not exists meta_title             text;             -- SEO title override
alter table public.products add column if not exists meta_description       text;             -- SEO meta description
alter table public.products add column if not exists meta_keywords          text[] not null default '{}'::text[];

-- ── Reseller plans (paid upgrade tiers) ─────────────────────────
create table if not exists public.reseller_plans (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  tagline         text,
  description     text,
  -- pricing
  price_lifetime_cents int,                                      -- one-time fee for lifetime reseller
  price_monthly_cents  int,                                      -- recurring monthly
  price_yearly_cents   int,                                      -- recurring yearly
  -- perks
  features        text[] not null default '{}'::text[],
  max_applications int,                                          -- null = unlimited
  extra_discount_pct int not null default 0,                     -- additional discount on wholesale, on top of approved per-product
  priority_support boolean not null default false,
  -- UI
  featured        boolean not null default false,
  badge           text,                                          -- "Best value" / "Popular" / "Limited"
  cta_label       text default 'Become a reseller',
  sort_order      int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_reseller_plans_active on public.reseller_plans(active, sort_order);

-- ── Profiles: link to active reseller plan ──────────────────────
alter table public.profiles add column if not exists reseller_plan_id        uuid references public.reseller_plans(id);
alter table public.profiles add column if not exists reseller_plan_expires_at timestamptz;
alter table public.profiles add column if not exists reseller_purchased_at   timestamptz;

-- ── CMS pages (FAQs, announcements, blog, generic pages) ───────
create table if not exists public.cms_pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  page_type       text not null default 'page',  -- page / faq / blog / announcement / giveaway
  title           text not null,
  subtitle        text,
  body            text not null,                  -- markdown
  status          text not null default 'draft',  -- draft / published / archived
  featured        boolean not null default false,
  -- SEO
  meta_title       text,
  meta_description text,
  meta_keywords    text[] not null default '{}'::text[],
  og_image_url     text,
  -- meta
  author_id       uuid references public.profiles(id),
  published_at    timestamptz,
  -- counts (denormalized)
  view_count      int not null default 0,
  -- ordering
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_cms_status on public.cms_pages(page_type, status, sort_order);
create index if not exists idx_cms_slug   on public.cms_pages(slug);

-- ── Discord-link credit anti-abuse log ──────────────────────────
create table if not exists public.discord_credit_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  discord_id      text not null,
  discord_username text,
  ip              text,
  user_agent      text,
  amount_cents    int not null default 100,
  granted         boolean not null,
  reject_reason   text,                          -- if granted=false, why
  created_at      timestamptz not null default now()
);

create index if not exists idx_discred_user on public.discord_credit_log(user_id, created_at desc);
create index if not exists idx_discred_disc on public.discord_credit_log(discord_id);
create index if not exists idx_discred_ip   on public.discord_credit_log(ip, created_at desc);

-- ── Wallet ledger (every credit/debit goes here for audit) ──────
-- (transactions table already exists from setup.sql)
alter table public.transactions add column if not exists meta jsonb;
alter table public.transactions add column if not exists actor_id uuid references public.profiles(id); -- who initiated (null = system/self)

-- ── Admin audit log ─────────────────────────────────────────────
create table if not exists public.admin_audit (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  target_id   uuid,                              -- user/product/etc that was acted on
  action      text not null,                    -- suspend_user / credit_user / change_role / etc
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_admin  on public.admin_audit(admin_id, created_at desc);
create index if not exists idx_audit_target on public.admin_audit(target_id, created_at desc);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table public.cms_pages          enable row level security;
alter table public.discord_credit_log enable row level security;
alter table public.admin_audit        enable row level security;
alter table public.reseller_plans     enable row level security;

drop policy if exists rp_select_pub on public.reseller_plans;
create policy rp_select_pub on public.reseller_plans for select using (active = true);

grant all on public.reseller_plans to anon, authenticated, service_role;

drop policy if exists cms_select_pub  on public.cms_pages;
drop policy if exists discred_own     on public.discord_credit_log;

-- Published CMS pages are public
create policy cms_select_pub on public.cms_pages for select using (status = 'published');

-- Users see their own discord credit log entries
create policy discred_own    on public.discord_credit_log for select using (auth.uid() = user_id);

grant all on public.cms_pages,
             public.discord_credit_log,
             public.admin_audit
  to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Discord credit grant function — atomic + idempotent
-- Called from /auth/discord/callback after OAuth.
--
-- Rules:
--   • One credit per profile (ever)
--   • One credit per Discord ID (ever — across all profiles)
--   • Caller must verify the Discord account meets age requirements
--   • Returns true if credit was granted
-- ════════════════════════════════════════════════════════════════
create or replace function public.grant_discord_credit(
  p_user_id        uuid,
  p_discord_id     text,
  p_discord_username text,
  p_ip             text,
  p_user_agent     text,
  p_amount_cents   int default 100
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_existing_user_with_discord uuid;
  v_already_credited           boolean;
  v_already_used               boolean;
  v_ip_count                   int;
begin
  -- Lock profile row
  select discord_credit_given into v_already_credited
    from public.profiles where id = p_user_id for update;

  if v_already_credited then
    return jsonb_build_object('granted', false, 'reason', 'already_credited');
  end if;

  -- Check Discord ID hasn't been used to credit any other profile
  select exists (
    select 1 from public.profiles where discord_id = p_discord_id and discord_credit_given = true and id <> p_user_id
  ) into v_already_used;

  if v_already_used then
    insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, granted, reject_reason)
    values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, false, 'discord_already_used');
    return jsonb_build_object('granted', false, 'reason', 'discord_already_used');
  end if;

  -- Check no other profile is linked to this Discord
  select id into v_existing_user_with_discord
    from public.profiles where discord_id = p_discord_id and id <> p_user_id limit 1;
  if v_existing_user_with_discord is not null then
    insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, granted, reject_reason)
    values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, false, 'discord_linked_elsewhere');
    return jsonb_build_object('granted', false, 'reason', 'discord_linked_elsewhere');
  end if;

  -- IP throttle: max 3 Discord credit grants from one IP per 7 days
  select count(*) into v_ip_count
    from public.discord_credit_log
    where ip = p_ip and granted = true and created_at > now() - interval '7 days';

  if v_ip_count >= 3 then
    insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, granted, reject_reason)
    values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, false, 'ip_throttle');
    return jsonb_build_object('granted', false, 'reason', 'ip_throttle');
  end if;

  -- ALL GOOD — grant the credit
  update public.profiles
    set discord_id = p_discord_id,
        discord_username = p_discord_username,
        discord_linked_at = now(),
        discord_credit_given = true,
        balance_cents = balance_cents + p_amount_cents
    where id = p_user_id;

  insert into public.transactions (user_id, type, amount_cents, description, actor_id, meta)
  values (p_user_id, 'discord_link_bonus', p_amount_cents, 'Linked Discord account', null,
          jsonb_build_object('discord_id', p_discord_id, 'discord_username', p_discord_username));

  insert into public.discord_credit_log (user_id, discord_id, discord_username, ip, user_agent, amount_cents, granted)
  values (p_user_id, p_discord_id, p_discord_username, p_ip, p_user_agent, p_amount_cents, true);

  insert into public.notifications (user_id, type, title, body, link_url)
  values (p_user_id, 'discord_linked', 'Discord linked — $1 credit added',
          'Your wallet has been credited with $1.00 for linking your Discord account.', '/dashboard/balance');

  return jsonb_build_object('granted', true, 'amount_cents', p_amount_cents);
end;
$$;

grant execute on function public.grant_discord_credit to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Admin actions: suspend / credit / change role (use service role)
-- ════════════════════════════════════════════════════════════════
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
  values (p_target_id, case when p_cents >= 0 then 'admin_credit' else 'admin_debit' end, p_cents, p_reason, p_admin_id);
  insert into public.admin_audit (admin_id, target_id, action, details)
  values (p_admin_id, p_target_id, 'credit_user', jsonb_build_object('cents', p_cents, 'reason', p_reason));
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_credit_user to service_role;

-- ════════════════════════════════════════════════════════════════
-- Reseller purchase function — flips role + sets expiry
-- ════════════════════════════════════════════════════════════════
create or replace function public.purchase_reseller_plan(
  p_user_id      uuid,
  p_plan_id      uuid,
  p_billing_cycle text,    -- 'lifetime' / 'monthly' / 'yearly'
  p_paid_cents   bigint
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

  if p_billing_cycle = 'lifetime' then
    v_expiry := null;
  elsif p_billing_cycle = 'monthly' then
    v_expiry := now() + interval '30 days';
  elsif p_billing_cycle = 'yearly' then
    v_expiry := now() + interval '365 days';
  else
    return jsonb_build_object('ok', false, 'reason', 'invalid_cycle');
  end if;

  update public.profiles
    set role = case when role = 'super_admin' then role else 'reseller' end,
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
          format('Your reseller access is active%s. Apply to resell any product from /products.',
                 case when v_expiry is null then ' for life' else format(' until %s', to_char(v_expiry, 'YYYY-MM-DD')) end),
          '/dashboard/applications');

  return jsonb_build_object('ok', true, 'expires_at', v_expiry);
end;
$$;

grant execute on function public.purchase_reseller_plan to authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Seed reseller plans (3 tiers)
-- ════════════════════════════════════════════════════════════════
insert into public.reseller_plans (slug, name, tagline, description, price_lifetime_cents, price_monthly_cents, price_yearly_cents, features, max_applications, extra_discount_pct, priority_support, featured, badge, sort_order)
values
  ('starter', 'Starter Reseller', 'Start your own panel — month to month.',
   'Perfect if you just want to test the waters or run one small tool. Cancel anytime.',
   null, 1499, 14999,
   array['Apply to resell up to 3 products','Wholesale pricing','Use OP auth engine','5 application slots','Standard support'],
   5, 0, false, false, null, 1)
  ,
  ('pro', 'Pro Reseller', 'Real-volume resellers. Best balance of price and perks.',
   E'Full white-label access. Stack additional discount on top of approved per-product wholesale. Priority support queue.\n\nMost resellers pick this.',
   9999, 2999, 29999,
   array['Apply to resell unlimited products','Wholesale pricing + 10% extra discount','Unlimited application slots','Priority support','Discord webhook on events','Custom branding per product'],
   null, 10, true, true, 'Most popular', 2)
  ,
  ('elite', 'Elite Reseller', 'Lifetime access, max discount, hands-on support.',
   E'You get everything plus a dedicated channel with the OP team. Lifetime — pay once, run forever.',
   29999, null, null,
   array['Everything in Pro','+15% extra wholesale discount','Hands-on launch help for your first tool','Featured spotlight on /products','Direct Discord channel with OP team','First access to new tools'],
   null, 15, true, true, 'Lifetime', 3)
on conflict (slug) do nothing;

-- ════════════════════════════════════════════════════════════════
-- Verification
-- ════════════════════════════════════════════════════════════════
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('status','discord_id','discord_credit_given','total_spent_cents','referral_code');
