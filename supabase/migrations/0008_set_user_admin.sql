-- Set a specific user as admin by email
-- Set brian@fullstacks.us as admin

update public.profiles
set role = 'admin'
where email = 'brian@fullstacks.us';

