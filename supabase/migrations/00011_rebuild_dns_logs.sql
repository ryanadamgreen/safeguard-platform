-- ============================================================
-- Rebuild dns_logs for the DoH logging pipeline.
-- The original table was designed for NextDNS/simulated data
-- (required mac_address, home_id, categories etc.).
-- The DoH endpoint only knows: device_id, domain, blocked, timestamp.
-- Drop and recreate with the correct schema.
-- ============================================================

drop table if exists dns_logs cascade;

create table dns_logs (
  id         uuid        primary key default gen_random_uuid(),
  device_id  text        not null,
  domain     text        not null,
  blocked    boolean     not null default false,
  timestamp  timestamptz not null default now()
);

create index dns_logs_device_id_idx on dns_logs (device_id);
create index dns_logs_timestamp_idx  on dns_logs (timestamp desc);
create index dns_logs_blocked_idx    on dns_logs (blocked);

alter table dns_logs enable row level security;

-- Devices (anon key, no session) can insert
create policy "dns_logs_insert" on dns_logs
  for insert with check (true);

-- Anyone can read
create policy "dns_logs_select" on dns_logs
  for select using (true);

-- Only authenticated users can delete (clear logs in dashboard)
create policy "dns_logs_delete" on dns_logs
  for delete using (auth.role() = 'authenticated');
