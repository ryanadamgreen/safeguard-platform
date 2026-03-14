-- ============================================================
-- Allow the DoH endpoint (anon key) to read device blocking state.
-- The device UUID is the DoH token — possession of it proves identity.
-- The anon client in /api/dns-query/[token] needs to check:
--   internet_enabled, schedule_start, schedule_end
-- to enforce per-device blocking and time schedules.
-- ============================================================

create policy "devices_doh_read" on devices
  for select
  using (true);

-- Update last_connected when a device sends a DNS query.
-- The DoH endpoint will call this via anon key.
create policy "devices_doh_update_last_connected" on devices
  for update
  using (true)
  with check (true);
