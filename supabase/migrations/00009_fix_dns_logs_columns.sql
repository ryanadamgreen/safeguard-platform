-- ============================================================
-- Fix dns_logs table: add missing device_id and blocked columns.
-- The table was created with only (id, domain, timestamp) so we
-- add the required columns and indexes here.
-- ============================================================

alter table dns_logs
  add column if not exists device_id text not null default '',
  add column if not exists blocked   boolean not null default false;

-- Remove the default now that the column exists
alter table dns_logs
  alter column device_id drop default;

create index if not exists dns_logs_device_id_idx on dns_logs (device_id);
create index if not exists dns_logs_blocked_idx   on dns_logs (blocked);
