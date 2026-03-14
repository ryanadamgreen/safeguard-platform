-- ============================================================
-- Seed realistic test data
-- Runs as postgres superuser so bypasses RLS
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ── Test users in auth.users ──
-- Password for both: TestPass123!

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, confirmation_token
) values
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@safeguard.test',
    extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Sarah Admin"}'::jsonb,
    ''
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'jane@safeguard.test',
    extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Jane Doe"}'::jsonb,
    ''
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'john@safeguard.test',
    extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "John Smith"}'::jsonb,
    ''
  )
on conflict (id) do nothing;

-- ── Identities (required for email login) ──

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    '{"sub": "a1b2c3d4-0000-0000-0000-000000000001", "email": "admin@safeguard.test"}'::jsonb,
    'email', now(), now(), now()
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000002',
    '{"sub": "a1b2c3d4-0000-0000-0000-000000000002", "email": "jane@safeguard.test"}'::jsonb,
    'email', now(), now(), now()
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000003',
    'a1b2c3d4-0000-0000-0000-000000000003',
    'a1b2c3d4-0000-0000-0000-000000000003',
    '{"sub": "a1b2c3d4-0000-0000-0000-000000000003", "email": "john@safeguard.test"}'::jsonb,
    'email', now(), now(), now()
  )
on conflict (id) do nothing;

-- ── Profiles ──
-- The trigger may have already created these, so upsert

insert into profiles (id, email, full_name, role) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'admin@safeguard.test', 'Sarah Admin', 'platform_admin'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'jane@safeguard.test', 'Jane Doe', 'home_manager'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'john@safeguard.test', 'John Smith', 'home_manager')
on conflict (id) do update set
  role = excluded.role,
  full_name = excluded.full_name;


-- ── Homes ──

insert into homes (id, name, address, router_id, nextdns_profile_id) values
  ('a0000000-0000-0000-0000-000000000001', 'Meadow House', '14 Oak Lane, Manchester, M1 4QR', 'unifi-001', 'ndns-abc123'),
  ('a0000000-0000-0000-0000-000000000002', 'Riverside Lodge', '7 River Street, Leeds, LS2 8HT', 'unifi-002', 'ndns-def456')
on conflict (id) do nothing;


-- ── User-Home assignments ──

insert into user_homes (user_id, home_id, role_label) values
  ('a1b2c3d4-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Registered Manager'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Registered Manager'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Deputy Manager')
on conflict do nothing;


-- ── Children ──

insert into children (id, initials, age, home_id) values
  ('b0000000-0000-0000-0000-000000000001', 'AB', 14, 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'CD', 12, 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'EF', 16, 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000004', 'GH', 13, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000005', 'IJ', 15, 'a0000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;


-- ── Devices ──

insert into devices (id, name, type, mac_address, child_id, home_id, last_connected, internet_enabled, schedule_start, schedule_end, manufacturer, hostname, os_type, model_prediction, dhcp_fingerprint) values
  (
    'c0000000-0000-0000-0000-000000000001',
    'AB''s iPhone', 'phone', 'AA:BB:CC:11:22:33',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    now() - interval '25 minutes', true, '08:00', '20:00',
    'Apple', 'ABs-iPhone', 'iOS', 'iPhone 14', '1,3,6,15,119,252'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'AB''s iPad', 'tablet', 'AA:BB:CC:44:55:66',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    now() - interval '1 hour', true, null, null,
    'Apple', 'ABs-iPad', 'iPadOS', 'iPad Air', '1,3,6,15,119,252'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'CD''s Samsung', 'phone', 'DD:EE:FF:11:22:33',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    now() - interval '10 minutes', true, '08:00', '19:00',
    'Samsung', 'Galaxy-S23', 'Android', 'Galaxy S23', '1,3,6,15,28,51,58,59'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'EF''s Laptop', 'laptop', '11:22:33:AA:BB:CC',
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    now() - interval '12 hours', false, '09:00', '21:00',
    'HP', 'HP-Pavilion', 'Windows', 'HP Pavilion 15', '1,3,6,15,31,33,43'
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'GH''s Phone', 'phone', '44:55:66:DD:EE:FF',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    now() - interval '2 hours', true, '07:00', '20:00',
    'Apple', 'GHs-iPhone', 'iOS', 'iPhone 13', '1,3,6,15,119,252'
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'IJ''s Tablet', 'tablet', '77:88:99:AA:BB:CC',
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000002',
    now() - interval '45 minutes', true, '08:00', '21:00',
    'Samsung', 'Galaxy-Tab-S9', 'Android', 'Galaxy Tab S9', '1,3,6,15,28,51,58,59'
  )
on conflict (id) do nothing;


-- ── Unknown Devices ──

insert into unknown_devices (id, mac_address, manufacturer, device_type, first_detected, home_id, blocked) values
  ('d0000000-0000-0000-0000-000000000001', 'FF:AA:BB:CC:DD:01', 'Samsung', 'Phone', now() - interval '4 hours', 'a0000000-0000-0000-0000-000000000001', true),
  ('d0000000-0000-0000-0000-000000000002', 'FF:AA:BB:CC:DD:02', null, null, now() - interval '7 hours', 'a0000000-0000-0000-0000-000000000001', true),
  ('d0000000-0000-0000-0000-000000000003', 'FF:AA:BB:CC:DD:03', 'Apple', 'Phone', now() - interval '30 minutes', 'a0000000-0000-0000-0000-000000000002', true)
on conflict (id) do nothing;


-- ── Safeguarding Reports ──

insert into safeguarding_reports (id, child_id, child_initials, device_name, category, domain, action, timestamp, home_id) values
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'AB', 'AB''s iPhone', 'gambling', 'bet365.com', 'blocked', now() - interval '35 minutes', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'AB', 'AB''s iPhone', 'gambling', 'williamhill.com', 'blocked', now() - interval '31 minutes', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'AB', 'AB''s iPad', 'gambling', 'paddypower.com', 'blocked', now() - interval '28 minutes', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'EF', 'EF''s Laptop', 'proxy_vpn', 'nordvpn.com', 'blocked', now() - interval '12 hours', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'CD', 'CD''s Samsung', 'adult_content', 'explicit-site.example.com', 'blocked', now() - interval '14 hours', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'AB', 'AB''s iPhone', 'gambling', 'betfair.com', 'blocked', now() - interval '22 minutes', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'AB', 'AB''s iPhone', 'gambling', 'skybet.com', 'blocked', now() - interval '18 minutes', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 'GH', 'GH''s Phone', 'violence', 'violent-content.example.com', 'blocked', now() - interval '3 hours', 'a0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005', 'IJ', 'IJ''s Tablet', 'self_harm', 'self-harm-forum.example.com', 'blocked', now() - interval '6 hours', 'a0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'CD', 'CD''s Samsung', 'drugs', 'drug-info.example.com', 'blocked', now() - interval '26 hours', 'a0000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;


-- ── Safeguarding Alerts ──

insert into safeguarding_alerts (id, child_initials, category, timestamp, home_id, type, details, attempts) values
  ('f0000000-0000-0000-0000-000000000001', 'AB', 'gambling', now() - interval '18 minutes', 'a0000000-0000-0000-0000-000000000001', 'pattern', '5 gambling attempts within 1 hour', 5),
  ('f0000000-0000-0000-0000-000000000002', 'EF', 'proxy_vpn', now() - interval '12 hours', 'a0000000-0000-0000-0000-000000000001', 'single', null, null),
  ('f0000000-0000-0000-0000-000000000003', 'CD', 'adult_content', now() - interval '14 hours', 'a0000000-0000-0000-0000-000000000001', 'single', null, null),
  ('f0000000-0000-0000-0000-000000000004', 'GH', 'violence', now() - interval '3 hours', 'a0000000-0000-0000-0000-000000000002', 'single', null, null),
  ('f0000000-0000-0000-0000-000000000005', 'IJ', 'self_harm', now() - interval '6 hours', 'a0000000-0000-0000-0000-000000000002', 'single', null, null)
on conflict (id) do nothing;


-- ── Device Fingerprints ──

insert into device_fingerprints (device_id, manufacturer, hostname, os_type, model_prediction, dhcp_fingerprint) values
  ('c0000000-0000-0000-0000-000000000001', 'Apple', 'ABs-iPhone', 'iOS', 'iPhone 14', '1,3,6,15,119,252'),
  ('c0000000-0000-0000-0000-000000000002', 'Apple', 'ABs-iPad', 'iPadOS', 'iPad Air', '1,3,6,15,119,252'),
  ('c0000000-0000-0000-0000-000000000003', 'Samsung', 'Galaxy-S23', 'Android', 'Galaxy S23', '1,3,6,15,28,51,58,59'),
  ('c0000000-0000-0000-0000-000000000004', 'HP', 'HP-Pavilion', 'Windows', 'HP Pavilion 15', '1,3,6,15,31,33,43'),
  ('c0000000-0000-0000-0000-000000000005', 'Apple', 'GHs-iPhone', 'iOS', 'iPhone 13', '1,3,6,15,119,252'),
  ('c0000000-0000-0000-0000-000000000006', 'Samsung', 'Galaxy-Tab-S9', 'Android', 'Galaxy Tab S9', '1,3,6,15,28,51,58,59')
on conflict (id) do nothing;
