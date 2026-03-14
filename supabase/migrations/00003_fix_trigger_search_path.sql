-- Fix the handle_new_user trigger function search path
-- The empty search_path prevented it from finding public.profiles

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = 'public'
as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
