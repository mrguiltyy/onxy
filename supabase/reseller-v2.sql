-- ════════════════════════════════════════════════════════════════
--  OP Reseller v2 — base + per-tool pricing model
--
--  Replaces the 3-tier reseller_plans flow with a simpler
--  $15 base + $5 per extra tool model (admin-configurable).
--
--  Run AFTER clean-install.sql. Idempotent.
-- ════════════════════════════════════════════════════════════════

-- ── Global reseller pricing config (single row table) ───────────
create table if not exists public.reseller_config (
  id                      smallint primary key default 1,
  base_price_cents        int not null default 1500,    -- $15 — includes 1 tool slot
  per_tool_extra_cents    int not null default 500,     -- $5 per extra tool
  tools_included_base     int not null default 1,
  -- Billing
  billing_cycle           text not null default 'monthly',  -- monthly / yearly / lifetime
  yearly_discount_pct     int not null default 17,
  lifetime_multiplier     numeric(4,2) not null default 7.5, -- lifetime price = monthly * 7.5 (~$112.50 for base)
  -- Wholesale discount
  extra_wholesale_discount_pct int not null default 0,        -- additional discount on top of approved per-product wholesale
  -- Feature flags
  custom_branding         boolean not null default true,
  priority_support        boolean not null default false,
  discord_webhook         boolean not null default true,
  api_access              boolean not null default false,
  -- Constraints
  max_tools_per_reseller  int,                              -- null = no cap
  updated_at              timestamptz not null default now(),
  -- Always one row
  constraint reseller_config_single_row check (id = 1)
);

-- Seed the default config
insert into public.reseller_config (id) values (1) on conflict (id) do nothing;

-- ── Reseller purchase records (one per checkout) ────────────────
create table if not exists public.reseller_purchases (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  product_ids             uuid[] not null,                       -- which products they're authorized to resell
  billing_cycle           text not null default 'monthly',       -- monthly / yearly / lifetime
  base_price_cents        int not null,
  extra_tools_count       int not null default 0,
  extra_tools_total_cents int not null default 0,
  total_cents             int not null,
  paid_at                 timestamptz not null default now(),
  expires_at              timestamptz,                            -- null = lifetime
  status                  text not null default 'active',         -- active / expired / canceled / refunded
  payment_method          text,                                   -- 'wallet' / 'stripe' / 'crypto'
  created_at              timestamptz not null default now()
);

create index if not exists idx_reseller_purchases_user on public.reseller_purchases(user_id, status, paid_at desc);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table public.reseller_config    enable row level security;
alter table public.reseller_purchases enable row level security;

drop policy if exists config_select_pub on public.reseller_config;
drop policy if exists purchases_select_own on public.reseller_purchases;

create policy config_select_pub      on public.reseller_config    for select using (true);
create policy purchases_select_own   on public.reseller_purchases for select using (auth.uid() = user_id);

grant all on public.reseller_config, public.reseller_purchases to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Purchase function — atomic reseller purchase from wallet
-- ════════════════════════════════════════════════════════════════
create or replace function public.purchase_reseller_v2(
  p_user_id        uuid,
  p_product_ids    uuid[],
  p_billing_cycle  text,
  p_paid_cents     bigint
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_balance        bigint;
  v_expiry         timestamptz;
  v_config         record;
  v_extras         int;
  v_correct_total  int;
begin
  -- Load config
  select * into v_config from public.reseller_config where id = 1 for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_config');
  end if;

  -- Validate
  if array_length(p_product_ids, 1) is null or array_length(p_product_ids, 1) < 1 then
    return jsonb_build_object('ok', false, 'reason', 'no_tools_selected');
  end if;

  -- Compute correct total
  v_extras := greatest(0, array_length(p_product_ids, 1) - v_config.tools_included_base);
  v_correct_total := v_config.base_price_cents + (v_extras * v_config.per_tool_extra_cents);

  -- Apply cycle multiplier
  if p_billing_cycle = 'monthly' then
    v_expiry := now() + interval '30 days';
  elsif p_billing_cycle = 'yearly' then
    v_expiry := now() + interval '365 days';
    v_correct_total := round(v_correct_total * 12 * (100 - v_config.yearly_discount_pct) / 100.0);
  elsif p_billing_cycle = 'lifetime' then
    v_expiry := null;
    v_correct_total := round(v_correct_total * v_config.lifetime_multiplier);
  else
    return jsonb_build_object('ok', false, 'reason', 'invalid_cycle');
  end if;

  -- Server-side price check (don't trust client-supplied price)
  if abs(p_paid_cents - v_correct_total) > 1 then
    return jsonb_build_object('ok', false, 'reason', 'price_mismatch',
      'expected', v_correct_total, 'got', p_paid_cents);
  end if;

  -- Wallet check
  select balance_cents into v_balance from public.profiles where id = p_user_id for update;
  if v_balance < v_correct_total then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_balance',
      'needed', v_correct_total, 'have', v_balance);
  end if;

  -- Debit wallet
  update public.profiles
    set role                = case when role = 'super_admin' then role else 'reseller' end,
        balance_cents       = balance_cents - v_correct_total,
        total_spent_cents   = total_spent_cents + v_correct_total
    where id = p_user_id;

  -- Record the purchase
  insert into public.reseller_purchases (user_id, product_ids, billing_cycle,
    base_price_cents, extra_tools_count, extra_tools_total_cents, total_cents,
    expires_at, payment_method)
  values (p_user_id, p_product_ids, p_billing_cycle,
    v_config.base_price_cents, v_extras, v_extras * v_config.per_tool_extra_cents, v_correct_total,
    v_expiry, 'wallet');

  -- Auto-grant the reseller authorizations
  insert into public.reseller_grants (product_id, reseller_id, status, custom_name, approved_at)
  select unnest(p_product_ids), p_user_id, 'approved',
         (select coalesce(custom_name, name) from public.profiles where id = p_user_id),
         now()
  on conflict (product_id, reseller_id) do update
    set status = 'approved', approved_at = now();

  -- Transaction record
  insert into public.transactions (user_id, type, amount_cents, description, meta)
  values (p_user_id, 'reseller_purchase', -v_correct_total,
    format('Reseller plan · %s tool(s) · %s', array_length(p_product_ids, 1), p_billing_cycle),
    jsonb_build_object('product_ids', p_product_ids, 'cycle', p_billing_cycle));

  -- Notification
  insert into public.notifications (user_id, type, title, body, link_url)
  values (p_user_id, 'reseller_activated',
    'Reseller access activated',
    format('You can now resell %s tool(s)%s.',
      array_length(p_product_ids, 1),
      case when v_expiry is null then ' for life' else format(' until %s', to_char(v_expiry, 'YYYY-MM-DD')) end),
    '/dashboard/resells');

  return jsonb_build_object('ok', true, 'total_cents', v_correct_total, 'expires_at', v_expiry);
end;
$$;

grant execute on function public.purchase_reseller_v2 to authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Verification
-- ════════════════════════════════════════════════════════════════
select base_price_cents, per_tool_extra_cents, tools_included_base, billing_cycle
from public.reseller_config;
