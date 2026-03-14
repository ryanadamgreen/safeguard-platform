-- Add app_name column to dns_logs.
-- Populated by the DoH handler when the queried domain matches a known app.
-- NULL means unrecognised / generic web traffic.

alter table dns_logs
  add column if not exists app_name text;

create index if not exists dns_logs_app_name_idx on dns_logs (app_name)
  where app_name is not null;
