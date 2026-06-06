-- ════════════════════════════════════════════════════════════════
--  Onyx Panel — Phase 2 schema additions
--  Paste into Supabase SQL editor after init.sql. Safe to re-run.
--
--  Adds:  tickets, ticket_messages, announcements
-- ════════════════════════════════════════════════════════════════

-- ── Tickets ─────────────────────────────────────────────────────
create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  subject         text not null,
  category        text not null default 'general',          -- 'general' / 'billing' / 'technical' / 'hwid_reset'
  priority        text not null default 'medium',           -- 'low' / 'medium' / 'high'
  status          text not null default 'open',             -- 'open' / 'replied' / 'closed'
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
  is_internal     boolean not null default false,           -- hidden from customer
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ticket_msgs on public.ticket_messages(ticket_id, created_at);

-- ── Announcements (banner on dashboard) ─────────────────────────
create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  message         text not null,
  variant         text not null default 'info',             -- 'info' / 'warn' / 'success' / 'brand'
  link_url        text,
  link_label      text,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_announcements_active on public.announcements(is_active, created_at desc);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
alter table public.tickets         enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.announcements   enable row level security;

drop policy if exists tk_select_own  on public.tickets;
drop policy if exists tk_insert_own  on public.tickets;
drop policy if exists tk_update_own  on public.tickets;
drop policy if exists msg_select_own on public.ticket_messages;
drop policy if exists msg_insert_own on public.ticket_messages;
drop policy if exists ann_select_all on public.announcements;

-- Users can read + create + (eventually) close their own tickets
create policy tk_select_own  on public.tickets         for select using (auth.uid() = user_id);
create policy tk_insert_own  on public.tickets         for insert with check (auth.uid() = user_id);
create policy tk_update_own  on public.tickets         for update using (auth.uid() = user_id);

-- Users can read non-internal messages on their tickets + post replies
create policy msg_select_own on public.ticket_messages for select using (
  not is_internal
  and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
);
create policy msg_insert_own on public.ticket_messages for insert with check (
  auth.uid() = author_id
  and not is_admin
  and not is_internal
  and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid())
);

-- Announcements visible to anyone signed in
create policy ann_select_all on public.announcements   for select using (is_active);

-- (Admin operations all use service_role which bypasses RLS)
