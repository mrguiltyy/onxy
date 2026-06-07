-- ════════════════════════════════════════════════════════════════
--  OP Onboarding — profile customization, visibility, 2FA flags
--
--  Run AFTER clean-install.sql. Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ── Profile customization fields ───────────────────────────────
alter table public.profiles add column if not exists avatar_url          text;
alter table public.profiles add column if not exists banner_url          text;
alter table public.profiles add column if not exists bio                 text;
alter table public.profiles add column if not exists profile_public      boolean not null default true;
alter table public.profiles add column if not exists onboarded_at        timestamptz;
alter table public.profiles add column if not exists two_factor_enabled  boolean not null default false;
-- Display "Member since" + tier badge
alter table public.profiles add column if not exists tier                text not null default 'free';   -- free / starter / pro / elite
alter table public.profiles add column if not exists tier_expires_at     timestamptz;

create index if not exists idx_profiles_public on public.profiles(profile_public) where profile_public = true;
create index if not exists idx_profiles_onboarded on public.profiles(onboarded_at) where onboarded_at is not null;

-- ── Verification ───────────────────────────────────────────────
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('avatar_url','banner_url','bio','profile_public','onboarded_at','two_factor_enabled','tier')
order by column_name;
