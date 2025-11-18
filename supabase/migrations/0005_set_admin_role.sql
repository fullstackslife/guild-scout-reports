-- Set admin role for users
-- Run this migration to grant admin access

-- Option 1: Set the first user as admin (recommended for initial setup)
update public.profiles
set role = 'admin'
where id = (select id from auth.users order by created_at limit 1)
and role = 'member';

-- Option 2: Set a specific user by email (uncomment and replace email)
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-email@example.com'
-- and role = 'member';

-- Option 3: Set all existing users as admin (for development/testing only)
-- update public.profiles
-- set role = 'admin'
-- where role = 'member';

