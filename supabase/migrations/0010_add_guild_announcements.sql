-- Add announcement field to guilds table for guild admins to post announcements

alter table public.guilds
add column if not exists announcement text;

comment on column public.guilds.announcement is 'Announcement or welcome message posted by guild admins, visible to all guild members';

