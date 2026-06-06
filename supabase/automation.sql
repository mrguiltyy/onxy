-- ════════════════════════════════════════════════════════════════
--  OP Automation — self-service columns + status page
--
--  Run AFTER setup.sql, auth-engine.sql, marketplace.sql.
--  Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ── Licenses: self-service HWID reset tracking ──────────────────
alter table public.licenses add column if not exists hwid_reset_count   int not null default 0;
alter table public.licenses add column if not exists last_hwid_reset_at timestamptz;
alter table public.licenses add column if not exists max_hwid_resets    int not null default 3;
alter table public.licenses add column if not exists notes              text;            -- internal notes (admin only)

-- ── Status page incidents ───────────────────────────────────────
create table if not exists public.status_incidents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  severity    text not null default 'minor',          -- minor / major / critical
  status      text not null default 'investigating', -- investigating / identified / monitoring / resolved
  affected    text[] not null default '{}'::text[],   -- 'api' / 'dashboard' / 'auth' / 'payments'
  started_at  timestamptz not null default now(),
  resolved_at timestamptz,
  created_by  uuid references public.profiles(id)
);

create index if not exists idx_incidents_status on public.status_incidents(status, started_at desc);

-- ── Service uptime checks (simple availability log) ─────────────
create table if not exists public.status_checks (
  id          bigserial primary key,
  service     text not null,                          -- 'api' / 'auth' / 'dashboard'
  ok          boolean not null,
  latency_ms  int,
  checked_at  timestamptz not null default now()
);

create index if not exists idx_checks_service_time on public.status_checks(service, checked_at desc);

-- Keep only last 30 days of checks (run from a cron later)
-- delete from public.status_checks where checked_at < now() - interval '30 days';

-- ── Tickets: link to license + auto-diagnosis fields ────────────
alter table public.tickets add column if not exists license_id           uuid references public.licenses(id) on delete set null;
alter table public.tickets add column if not exists auto_diagnosis       text;            -- bot's first-pass analysis
alter table public.tickets add column if not exists auto_resolved        boolean not null default false;
alter table public.tickets add column if not exists is_priority          boolean not null default false;  -- flagged for lifetime buyers etc.

-- Trigger: any lifetime license owner gets is_priority=true on their tickets
create or replace function public.flag_priority_on_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  has_lifetime boolean;
begin
  select exists (
    select 1 from public.licenses
    where user_id = new.user_id
      and (duration_days is null and expires_at is null)
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

-- ════════════════════════════════════════════════════════════════
-- RLS / Grants for new tables
-- ════════════════════════════════════════════════════════════════
alter table public.status_incidents enable row level security;
alter table public.status_checks    enable row level security;

drop policy if exists incidents_select_public on public.status_incidents;
drop policy if exists checks_select_public    on public.status_checks;

-- Anyone can read incidents and uptime checks (public status page)
create policy incidents_select_public on public.status_incidents for select using (true);
create policy checks_select_public    on public.status_checks    for select using (true);

grant all on public.status_incidents to anon, authenticated, service_role;
grant all on public.status_checks    to anon, authenticated, service_role;
grant usage, select on sequence public.status_checks_id_seq to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Verification
-- ════════════════════════════════════════════════════════════════
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'licenses'
  and column_name in ('hwid_reset_count','last_hwid_reset_at','max_hwid_resets','notes');
