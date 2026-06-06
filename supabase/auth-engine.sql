-- ════════════════════════════════════════════════════════════════
--  OP Auth Engine — auth.gg-style license authentication
--
--  Run AFTER setup.sql. Idempotent — safe to re-run.
--
--  Concept:
--    • A reseller creates an "application" (their WPF tool)
--    • They get an app_id + app_secret to embed in their tool
--    • End users authenticate via license_key + HWID
--    • The tool calls /api/v1/auth/login, /check, /heartbeat
-- ════════════════════════════════════════════════════════════════

-- ── Add 'reseller' role to existing profiles role column ────────
-- (role is already a text column, no change needed — just usage convention)
-- Roles: 'user' / 'reseller' / 'support' / 'super_admin'

-- ── Applications ────────────────────────────────────────────────
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  app_id          text unique not null,                         -- public, embedded in WPF tool (e.g. "op_a8f...")
  name            text not null,
  description     text,
  secret_hash     text not null,                                -- sha256 of app_secret (secret shown once at creation)
  version         text not null default '1.0.0',
  status          text not null default 'active',               -- active / paused / disabled
  hwid_lock       boolean not null default true,                -- bind license to HWID on first login
  version_check   boolean not null default false,               -- reject if client version mismatches
  freeze_users    boolean not null default false,               -- emergency kill switch
  total_users     int not null default 0,
  online_users    int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_applications_owner on public.applications(owner_id, created_at desc);
create index if not exists idx_applications_app_id on public.applications(app_id);

-- ── Extend licenses table for end-user auth ─────────────────────
alter table public.licenses add column if not exists app_id        uuid references public.applications(id) on delete cascade;
alter table public.licenses add column if not exists end_username  text;                                      -- end user's username (optional, for username/pass flow)
alter table public.licenses add column if not exists banned        boolean not null default false;
alter table public.licenses add column if not exists ban_reason    text;
alter table public.licenses add column if not exists hwid_locked_at timestamptz;
alter table public.licenses add column if not exists last_login_at timestamptz;
alter table public.licenses add column if not exists login_count   int not null default 0;

create index if not exists idx_licenses_app on public.licenses(app_id, created_at desc);

-- ── Active sessions (issued on login, refreshed on heartbeat) ───
create table if not exists public.auth_sessions (
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

create index if not exists idx_sessions_token on public.auth_sessions(session_token);
create index if not exists idx_sessions_app on public.auth_sessions(app_id, last_heartbeat desc);

-- ── Auth event log (for security audit, IP tracking) ────────────
create table if not exists public.auth_logs (
  id              uuid primary key default gen_random_uuid(),
  app_id          uuid references public.applications(id) on delete cascade,
  license_id      uuid references public.licenses(id) on delete set null,
  event_type      text not null,                                -- login_success / login_fail / hwid_mismatch / banned_attempt / heartbeat_fail / check_fail
  code            text,                                          -- error code from API
  ip              text,
  hwid            text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_auth_logs_app on public.auth_logs(app_id, created_at desc);
create index if not exists idx_auth_logs_ip on public.auth_logs(ip, created_at desc);

-- ── IP rate limiting (per app, sliding window) ──────────────────
create table if not exists public.auth_throttle (
  ip              text not null,
  app_id          uuid not null references public.applications(id) on delete cascade,
  attempts        int not null default 1,
  window_start    timestamptz not null default now(),
  blocked_until   timestamptz,
  primary key (ip, app_id)
);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table public.applications   enable row level security;
alter table public.auth_sessions  enable row level security;
alter table public.auth_logs      enable row level security;
alter table public.auth_throttle  enable row level security;

drop policy if exists app_select_own   on public.applications;
drop policy if exists app_insert_own   on public.applications;
drop policy if exists app_update_own   on public.applications;
drop policy if exists app_delete_own   on public.applications;
drop policy if exists sess_select_own  on public.auth_sessions;
drop policy if exists log_select_own   on public.auth_logs;

-- Resellers see their own applications. Service role bypasses.
create policy app_select_own  on public.applications  for select using (auth.uid() = owner_id);
create policy app_insert_own  on public.applications  for insert with check (auth.uid() = owner_id);
create policy app_update_own  on public.applications  for update using (auth.uid() = owner_id);
create policy app_delete_own  on public.applications  for delete using (auth.uid() = owner_id);

-- Sessions/logs are read-only to owner via join
create policy sess_select_own on public.auth_sessions for select using (
  exists (select 1 from public.applications a where a.id = app_id and a.owner_id = auth.uid())
);
create policy log_select_own  on public.auth_logs    for select using (
  exists (select 1 from public.applications a where a.id = app_id and a.owner_id = auth.uid())
);

-- ════════════════════════════════════════════════════════════════
-- GRANTS (so authenticated role can hit these tables under RLS)
-- ════════════════════════════════════════════════════════════════
grant all on public.applications,
             public.auth_sessions,
             public.auth_logs,
             public.auth_throttle
  to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- Verification
-- ════════════════════════════════════════════════════════════════
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
