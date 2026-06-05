-- ════════════════════════════════════════════════════════════════
-- Onyx Services — Initial seed data
-- Run AFTER schema.sql. Inserts the 8 demo products + their plans.
-- ════════════════════════════════════════════════════════════════

insert into public.products (slug, name, short_desc, long_desc, category, type, base_price_cents, max_hwid_slots, current_version, is_active, is_featured)
values
  ('onyx-rage',    'Onyx Rage',    'High-performance automation engine.',                           'Onyx Rage is our flagship automation tool — precision-built, constantly updated, and impossible to detect. Used by thousands of operators who need an edge.', 'Automation', 'software',  999, 2, '2.1.0', true,  true),
  ('onyx-stealth', 'Onyx Stealth', 'Precision detection bypass for operators at the edge.',          'Cutting edge stealth layer with cryptographic process isolation.',  'Stealth',    'software', 1499, 1, '1.4.2', true,  false),
  ('onyx-core',    'Onyx Core',    'The reliable foundation. Fast, daily-driver, always updated.',   'The foundation. Everything you need, nothing you do not.',          'Utility',    'software',  699, 2, '3.0.1', true,  true),
  ('onyx-apex',    'Onyx Apex',    'Elite tier access. Reserved for serious operators.',             'Our most powerful tool — reserved for serious operators only.',     'Premium',    'software', 2999, 1, '1.0.3', true,  false),
  ('onyx-pulse',   'Onyx Pulse',   'Lightweight automation companion. Quick setup, focused.',        'Lightweight companion automation tool.',                            'Automation', 'software',  499, 2, '0.9.1', true,  false),
  ('onyx-blade',   'Onyx Blade',   'Cutting-edge stealth with cryptographic process isolation.',     'Cutting-edge stealth layer.',                                       'Stealth',    'software', 1799, 1, '2.4.0', true,  false),
  ('onyx-echo',    'Onyx Echo',    'Companion utility for monitoring sessions, HWIDs, tool state.',  'Monitoring companion utility.',                                     'Utility',    'software',  599, 2, '1.2.7', true,  false),
  ('onyx-vortex',  'Onyx Vortex',  'Premium toolset with advanced session orchestration.',           'Premium toolset.',                                                  'Premium',    'software', 2499, 2, '1.5.2', true,  false)
on conflict (slug) do nothing;

-- Insert plans for each product
do $$
declare
  rec record;
begin
  for rec in select id, base_price_cents from public.products loop
    insert into public.product_plans (product_id, plan_id, label, price_cents, duration_days, hwid_slots, sort_order)
    values
      (rec.id, 'monthly',   '1 Month',  rec.base_price_cents,      30,  2, 1),
      (rec.id, 'quarterly', '3 Months', rec.base_price_cents * 2,  90,  2, 2),
      (rec.id, 'lifetime',  'Lifetime', rec.base_price_cents * 5,  null, 2, 3)
    on conflict (product_id, plan_id) do nothing;
  end loop;
end $$;
