-- ════════════════════════════════════════════════════════════════
--  OP Storage — Supabase Storage buckets for product/profile images
--
--  Run AFTER clean-install.sql. Idempotent.
-- ════════════════════════════════════════════════════════════════

-- ── Product images bucket ──────────────────────────────────────
-- Public read (so the banner shows on product cards everywhere)
-- Authenticated write (admin/reseller uploads)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,                                       -- 10 MB max
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Drop existing policies (idempotent re-runs) ────────────────
drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Authed write product images" on storage.objects;
drop policy if exists "Authed delete product images" on storage.objects;
drop policy if exists "Authed update product images" on storage.objects;

-- ── Public can read every file in product-images ───────────────
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- ── Authenticated users can upload (we'll gate by role server-side) ──
create policy "Authed write product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

-- ── Authenticated users can delete their uploads ───────────────
create policy "Authed delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

create policy "Authed update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');


-- ── Profile-images bucket (used by onboarding avatar/banner pickers) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880,                                        -- 5 MB max
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read profile images" on storage.objects;
drop policy if exists "Authed write profile images" on storage.objects;

create policy "Public read profile images"
  on storage.objects for select
  using (bucket_id = 'profile-images');

create policy "Authed write profile images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-images');


-- ── Verification ───────────────────────────────────────────────
select id, public, file_size_limit
from storage.buckets
where id in ('product-images', 'profile-images');
