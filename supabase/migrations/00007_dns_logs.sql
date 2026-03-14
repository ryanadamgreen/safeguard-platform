-- ============================================================
-- DNS query log table
-- Written to by the DoH endpoint on every DNS query.
-- Read by the DNS Monitor dashboard.
-- ============================================================

create table if not exists dns_logs (
  id         uuid        primary key default gen_random_uuid(),
  device_id  text        not null,
  domain     text        not null,
  blocked    boolean     not null default false,
  timestamp  timestamptz not null default now()
);

create index if not exists dns_logs_device_id_idx on dns_logs (device_id);
create index if not exists dns_logs_timestamp_idx  on dns_logs (timestamp desc);

-- RLS: devices can insert (no session), dashboard can read
alter table dns_logs enable row level security;

create policy "dns_logs_insert" on dns_logs
  for insert with check (true);

create policy "dns_logs_select" on dns_logs
  for select using (true);

create policy "dns_logs_delete" on dns_logs
  for delete using (auth.role() = 'authenticated');
