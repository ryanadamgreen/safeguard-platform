-- ============================================================
-- Recreate dns_logs RLS policies from scratch.
-- The table was created before the migration ran so policies
-- may not have been applied. Drop and recreate them cleanly.
-- ============================================================

alter table dns_logs enable row level security;

drop policy if exists "dns_logs_insert" on dns_logs;
drop policy if exists "dns_logs_select" on dns_logs;
drop policy if exists "dns_logs_delete" on dns_logs;

-- Devices (anon) can insert — no session required
create policy "dns_logs_insert" on dns_logs
  for insert with check (true);

-- Anyone can read (dashboard uses anon key)
create policy "dns_logs_select" on dns_logs
  for select using (true);

-- Only authenticated users can delete (clear logs)
create policy "dns_logs_delete" on dns_logs
  for delete using (auth.role() = 'authenticated');
