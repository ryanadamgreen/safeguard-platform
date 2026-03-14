-- ============================================================
-- SafeGuard Platform – Full Database Schema
-- ============================================================

-- ── ENUMS ──

create type user_role as enum ('platform_admin', 'home_manager');

create type device_type as enum (
  'phone', 'tablet', 'laptop', 'desktop',
  'gaming_console', 'smart_tv', 'other'
);

create type safeguarding_category as enum (
  'adult_content', 'gambling', 'violence',
  'drugs', 'self_harm', 'proxy_vpn'
);

create type report_action as enum ('blocked', 'allowed');

create type alert_type as enum ('single', 'pattern');


-- ── PROFILES ──
-- Extends Supabase auth.users with app-specific fields.

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        user_role not null default 'home_manager',
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── HOMES ──

create table homes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  address             text not null,
  router_id           text not null,
  nextdns_profile_id  text not null,
  created_at          timestamptz not null default now()
);


-- ── USER ↔ HOME ASSIGNMENTS ──

create table user_homes (
  user_id   uuid not null references profiles(id) on delete cascade,
  home_id   uuid not null references homes(id) on delete cascade,
  role_label text, -- e.g. 'Registered Manager', 'Deputy Manager'
  created_at timestamptz not null default now(),
  primary key (user_id, home_id)
);


-- ── CHILDREN ──
-- Minimal data only: initials + age. No full names.

create table children (
  id          uuid primary key default gen_random_uuid(),
  initials    text not null check (char_length(initials) between 1 and 4),
  age         int not null check (age between 0 and 25),
  home_id     uuid not null references homes(id) on delete cascade,
  created_at  timestamptz not null default now()
);


-- ── DEVICES ──

create table devices (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  type              device_type not null default 'other',
  mac_address       text not null,
  child_id          uuid references children(id) on delete set null,
  home_id           uuid not null references homes(id) on delete cascade,
  last_connected    timestamptz,
  internet_enabled  boolean not null default true,
  schedule_start    time,          -- null = all day
  schedule_end      time,
  manufacturer      text,
  hostname          text,
  os_type           text,
  model_prediction  text,
  dhcp_fingerprint  text,
  created_at        timestamptz not null default now()
);

create index idx_devices_home on devices(home_id);
create index idx_devices_mac on devices(mac_address);
create index idx_devices_child on devices(child_id);


-- ── UNKNOWN DEVICES ──

create table unknown_devices (
  id              uuid primary key default gen_random_uuid(),
  mac_address     text not null,
  manufacturer    text,
  device_type     text,
  first_detected  timestamptz not null default now(),
  home_id         uuid not null references homes(id) on delete cascade,
  blocked         boolean not null default true,
  created_at      timestamptz not null default now()
);

create index idx_unknown_devices_home on unknown_devices(home_id);


-- ── SAFEGUARDING REPORTS ──

create table safeguarding_reports (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references children(id) on delete cascade,
  child_initials  text not null,
  device_name     text not null,
  category        safeguarding_category not null,
  domain          text not null,
  action          report_action not null,
  timestamp       timestamptz not null default now(),
  home_id         uuid not null references homes(id) on delete cascade
);

create index idx_reports_home on safeguarding_reports(home_id);
create index idx_reports_child on safeguarding_reports(child_id);
create index idx_reports_category on safeguarding_reports(category);
create index idx_reports_timestamp on safeguarding_reports(timestamp desc);


-- ── SAFEGUARDING ALERTS ──

create table safeguarding_alerts (
  id              uuid primary key default gen_random_uuid(),
  child_initials  text not null,
  category        safeguarding_category not null,
  timestamp       timestamptz not null default now(),
  home_id         uuid not null references homes(id) on delete cascade,
  type            alert_type not null default 'single',
  details         text,
  attempts        int,
  resolved        boolean not null default false,
  resolved_at     timestamptz,
  resolved_by     uuid references profiles(id)
);

create index idx_alerts_home on safeguarding_alerts(home_id);
create index idx_alerts_unresolved on safeguarding_alerts(home_id) where not resolved;


-- ── DNS LOGS (raw ingestion from NextDNS) ──

create table dns_logs (
  id          uuid primary key default gen_random_uuid(),
  mac_address text not null,
  domain      text not null,
  status      text not null,            -- 'allowed' or 'blocked'
  categories  text[] not null default '{}',
  reasons     text[] not null default '{}',
  home_id     uuid not null references homes(id) on delete cascade,
  timestamp   timestamptz not null default now()
);

create index idx_dns_logs_home on dns_logs(home_id);
create index idx_dns_logs_mac on dns_logs(mac_address);
create index idx_dns_logs_timestamp on dns_logs(timestamp desc);


-- ── DEVICE FINGERPRINTS (for MAC randomisation matching) ──

create table device_fingerprints (
  id                uuid primary key default gen_random_uuid(),
  device_id         uuid not null references devices(id) on delete cascade,
  manufacturer      text,
  hostname          text,
  os_type           text,
  model_prediction  text,
  dhcp_fingerprint  text,
  recorded_at       timestamptz not null default now()
);

create index idx_fingerprints_device on device_fingerprints(device_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table homes enable row level security;
alter table user_homes enable row level security;
alter table children enable row level security;
alter table devices enable row level security;
alter table unknown_devices enable row level security;
alter table safeguarding_reports enable row level security;
alter table safeguarding_alerts enable row level security;
alter table dns_logs enable row level security;
alter table device_fingerprints enable row level security;

-- ── Helper: check if user is assigned to a home ──

create or replace function user_has_home(check_home_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_homes
    where user_id = auth.uid()
      and home_id = check_home_id
  );
$$;

-- ── Helper: check if user is a platform admin ──

create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'platform_admin'
  );
$$;


-- PROFILES: users see own profile
create policy "Users read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users update own profile"
  on profiles for update
  using (id = auth.uid());


-- HOMES: admins see all, managers see assigned
create policy "Admins read all homes"
  on homes for select
  using (is_platform_admin());

create policy "Managers read assigned homes"
  on homes for select
  using (user_has_home(id));

create policy "Admins manage homes"
  on homes for all
  using (is_platform_admin());


-- USER_HOMES: admins manage, users see own
create policy "Admins manage user_homes"
  on user_homes for all
  using (is_platform_admin());

create policy "Users see own assignments"
  on user_homes for select
  using (user_id = auth.uid());


-- CHILDREN: only managers of that home (admins CANNOT see)
create policy "Managers read children"
  on children for select
  using (user_has_home(home_id) and not is_platform_admin());

create policy "Managers manage children"
  on children for all
  using (user_has_home(home_id) and not is_platform_admin());


-- DEVICES: only managers of that home
create policy "Managers read devices"
  on devices for select
  using (user_has_home(home_id));

create policy "Managers manage devices"
  on devices for all
  using (user_has_home(home_id));


-- UNKNOWN DEVICES: only managers of that home
create policy "Managers read unknown devices"
  on unknown_devices for select
  using (user_has_home(home_id));

create policy "Managers manage unknown devices"
  on unknown_devices for all
  using (user_has_home(home_id));


-- SAFEGUARDING REPORTS: managers only (admins CANNOT see)
create policy "Managers read reports"
  on safeguarding_reports for select
  using (user_has_home(home_id) and not is_platform_admin());

create policy "System insert reports"
  on safeguarding_reports for insert
  with check (user_has_home(home_id));


-- SAFEGUARDING ALERTS: managers only (admins CANNOT see)
create policy "Managers read alerts"
  on safeguarding_alerts for select
  using (user_has_home(home_id) and not is_platform_admin());

create policy "Managers update alerts"
  on safeguarding_alerts for update
  using (user_has_home(home_id) and not is_platform_admin());


-- DNS LOGS: managers only
create policy "Managers read dns logs"
  on dns_logs for select
  using (user_has_home(home_id) and not is_platform_admin());


-- DEVICE FINGERPRINTS: managers of the device's home
create policy "Managers read fingerprints"
  on device_fingerprints for select
  using (
    exists (
      select 1 from devices d
      where d.id = device_fingerprints.device_id
        and user_has_home(d.home_id)
    )
  );
