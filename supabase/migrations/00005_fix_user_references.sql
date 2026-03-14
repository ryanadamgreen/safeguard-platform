-- Update profiles with correct roles (trigger created them with default 'home_manager')
update profiles set role = 'platform_admin', full_name = 'Sarah Admin'
where email = 'admin@safeguard.test';

update profiles set full_name = 'Jane Doe'
where email = 'jane@safeguard.test';

update profiles set full_name = 'John Smith'
where email = 'john@safeguard.test';

-- Clear old user_homes entries (old UUIDs no longer exist)
delete from user_homes;

-- Re-insert user_homes with actual UUIDs from auth
insert into user_homes (user_id, home_id, role_label)
select p.id, 'a0000000-0000-0000-0000-000000000001', 'Registered Manager'
from profiles p where p.email = 'jane@safeguard.test';

insert into user_homes (user_id, home_id, role_label)
select p.id, 'a0000000-0000-0000-0000-000000000002', 'Registered Manager'
from profiles p where p.email = 'jane@safeguard.test';

insert into user_homes (user_id, home_id, role_label)
select p.id, 'a0000000-0000-0000-0000-000000000001', 'Deputy Manager'
from profiles p where p.email = 'john@safeguard.test';
