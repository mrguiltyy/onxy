-- ════════════════════════════════════════════════════════════════
--  OP Marketplace — products, reselling, updates
--
--  Run AFTER setup.sql and auth-engine.sql.
--  Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ── Products ────────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,                           -- url-friendly
  name            text not null,
  tagline         text,                                            -- 1-line pitch
  description     text,                                            -- markdown ok
  image_url       text,
  category        text not null default 'tool',                   -- tool / spoofer / panel / script / other
  status          text not null default 'active',                 -- active / paused / discontinued
  version         text not null default '1.0.0',
  -- direct customer pricing (cents)
  price_day       int,
  price_week      int,
  price_month     int,
  price_lifetime  int,
  -- wholesale reseller pricing (cents) — what resellers pay us per key they generate
  reseller_price_day       int,
  reseller_price_week      int,
  reseller_price_month     int,
  reseller_price_lifetime  int,
  -- reseller program
  reseller_open            boolean not null default true,
  reseller_auto_approve    boolean not null default false,
  -- features list (markdown bullets, displayed as checklist)
  features        text[] not null default '{}'::text[],
  -- support promise to lifetime buyers (text shown on product page)
  lifetime_support boolean not null default true,
  -- ranking / featured
  featured        boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_products_status on public.products(status, featured desc, sort_order);
create index if not exists idx_products_slug on public.products(slug);

-- ── Link existing licenses to products (kept text 'product' for legacy) ──
alter table public.licenses add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.licenses add column if not exists is_lifetime boolean generated always as (duration_days is null and expires_at is null) stored;

create index if not exists idx_licenses_product on public.licenses(product_id);

-- ── Reseller grants (one row per (reseller, product) they're allowed to sell) ──
create table if not exists public.reseller_grants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  reseller_id     uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'pending',                -- pending / approved / rejected / revoked
  -- whitelabel branding
  custom_name     text,                                            -- reseller's name for the tool
  custom_image    text,                                            -- reseller's image
  pitch           text,                                            -- their application pitch
  -- pricing override (allows admin to give custom wholesale)
  discount_pct    int not null default 0,                          -- 0-100, off the standard wholesale
  -- approval audit
  approved_by     uuid references public.profiles(id),
  approved_at     timestamptz,
  rejected_reason text,
  created_at      timestamptz not null default now(),
  unique (product_id, reseller_id)
);

create index if not exists idx_grants_status on public.reseller_grants(status, created_at desc);
create index if not exists idx_grants_reseller on public.reseller_grants(reseller_id, status);

-- ── Product updates (release notes) ─────────────────────────────
create table if not exists public.product_updates (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  version         text not null,
  title           text not null,
  notes           text,                                            -- markdown
  severity        text not null default 'minor',                   -- patch / minor / major / breaking
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_updates_product on public.product_updates(product_id, created_at desc);

-- ── In-app notifications (fan-out target for product updates) ──
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null,                                   -- product_update / reseller_approved / reseller_rejected / lifetime_welcome
  title           text not null,
  body            text,
  link_url        text,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_notifs_user on public.notifications(user_id, is_read, created_at desc);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table public.products         enable row level security;
alter table public.reseller_grants  enable row level security;
alter table public.product_updates  enable row level security;
alter table public.notifications    enable row level security;

drop policy if exists prod_select_public on public.products;
drop policy if exists grant_select_own   on public.reseller_grants;
drop policy if exists grant_insert_own   on public.reseller_grants;
drop policy if exists upd_select_public  on public.product_updates;
drop policy if exists notif_select_own   on public.notifications;
drop policy if exists notif_update_own   on public.notifications;

-- Anyone (signed in or not) can browse active products
create policy prod_select_public on public.products       for select using (status = 'active');

-- Resellers can see/create their own grant requests; admins (service role) bypass
create policy grant_select_own  on public.reseller_grants for select using (auth.uid() = reseller_id);
create policy grant_insert_own  on public.reseller_grants for insert with check (auth.uid() = reseller_id);

-- Anyone can read updates for active products (used on detail page)
create policy upd_select_public on public.product_updates for select using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
);

-- Notifications are private
create policy notif_select_own  on public.notifications   for select using (auth.uid() = user_id);
create policy notif_update_own  on public.notifications   for update using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- GRANTS
-- ════════════════════════════════════════════════════════════════
grant all on public.products,
             public.reseller_grants,
             public.product_updates,
             public.notifications
  to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Fan-out trigger: when a product_update is inserted, notify
-- every approved reseller of that product + the product owner.
-- ════════════════════════════════════════════════════════════════
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
         format('/dashboard/resells')
  from public.reseller_grants rg
  where rg.product_id = new.product_id and rg.status = 'approved';

  return new;
end;
$$;

drop trigger if exists trg_notify_resellers on public.product_updates;
create trigger trg_notify_resellers
  after insert on public.product_updates
  for each row execute function public.notify_resellers_on_update();

-- ════════════════════════════════════════════════════════════════
-- Seed a sample product (optional, easy to drop)
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
  'tool',
  '1.0.0',
  500, 1500, 3500, 9900,
  125, 375, 875, 2475,
  array['HWID protection','Discord notifications','Auto-updater','Priority support (lifetime)'],
  true,
  0
)
on conflict (slug) do nothing;

-- ════════════════════════════════════════════════════════════════
-- Verification
-- ════════════════════════════════════════════════════════════════
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
