-- ============================================================
-- Add AB's iPhone 16 with real device UUID (DoH token)
-- Ensures home + child AB exist first (safe to re-run)
-- ============================================================

-- Ensure Meadow House exists
insert into homes (id, name, address, router_id, nextdns_profile_id) values
  ('a0000000-0000-0000-0000-000000000001', 'Meadow House', '14 Oak Lane, Manchester, M1 4QR', 'unifi-001', 'ndns-abc123')
on conflict (id) do nothing;

-- Ensure child AB exists
insert into children (id, initials, age, home_id) values
  ('b0000000-0000-0000-0000-000000000001', 'AB', 14, 'a0000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Insert AB's iPhone 16
-- The device id IS the DoH token — the mobileconfig profile will point to:
--   /api/dns-query/14a16b29-bc98-4d30-b236-fd3e561666f7
insert into devices (
  id,
  name,
  type,
  mac_address,
  child_id,
  home_id,
  internet_enabled,
  manufacturer,
  os_type,
  model_prediction
) values (
  '14a16b29-bc98-4d30-b236-fd3e561666f7',
  'AB''s iPhone 16',
  'phone',
  '14:A1:6B:29:BC:98',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  true,
  'Apple',
  'iOS',
  'iPhone 16'
)
on conflict (id) do nothing;
