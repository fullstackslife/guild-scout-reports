-- Set admin role for the first user (or specific user by email)
-- Run this migration to grant admin access to your account

-- Option 1: Set the first user as admin (uncomment to use)
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users order by created_at limit 1);

-- Option 2: Set a specific user by email (replace with your email)
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-email@example.com';

-- Option 3: Set all existing users as admin (for development/testing)
-- update public.profiles
-- set role = 'admin'
-- where role = 'member';

-- Note: Uncomment the option you want to use, then run this migration

