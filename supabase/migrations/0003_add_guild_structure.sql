-- Add guild structure to support multiple guilds and games

-- Create guilds table
create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Add updated_at trigger for guilds
drop trigger if exists set_timestamp_guilds on public.guilds;
create trigger set_timestamp_guilds
before update on public.guilds
for each row
execute function public.handle_updated_at();

-- Create guild_members table (many-to-many relationship)
create table if not exists public.guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  unique(guild_id, user_id)
);

-- Add guild_id to screenshots table
alter table public.screenshots
add column if not exists guild_id uuid references public.guilds (id) on delete cascade;

-- Create indexes for performance
create index if not exists guild_members_guild_id_idx on public.guild_members (guild_id);
create index if not exists guild_members_user_id_idx on public.guild_members (user_id);
create index if not exists screenshots_guild_id_idx on public.screenshots (guild_id, created_at desc);

-- Enable RLS on new tables
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;

-- RLS policies for guilds table
drop policy if exists "Authenticated users can view guilds they are members of" on public.guilds;
create policy "Authenticated users can view guilds they are members of"
on public.guilds
for select
to authenticated
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guilds.id
    and guild_members.user_id = auth.uid()
  )
);

-- RLS policies for guild_members table
drop policy if exists "Users can view guild members of their guilds" on public.guild_members;
create policy "Users can view guild members of their guilds"
on public.guild_members
for select
to authenticated
using (
  exists (
    select 1 from public.guild_members gm2
    where gm2.guild_id = guild_members.guild_id
    and gm2.user_id = auth.uid()
  )
);

-- Update screenshots RLS policies to include guild context
drop policy if exists "Authenticated users can read screenshots" on public.screenshots;
create policy "Authenticated users can read screenshots in their guilds"
on public.screenshots
for select
to authenticated
using (
  guild_id is null or exists (
    select 1 from public.guild_members
    where guild_members.guild_id = screenshots.guild_id
    and guild_members.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert their screenshots" on public.screenshots;
create policy "Users can insert screenshots to their guilds"
on public.screenshots
for insert
to authenticated
with check (
  auth.uid() = user_id and (
    guild_id is null or exists (
      select 1 from public.guild_members
      where guild_members.guild_id = screenshots.guild_id
      and guild_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete their screenshots" on public.screenshots;
create policy "Users can delete their own screenshots"
on public.screenshots
for delete
to authenticated
using (auth.uid() = user_id);

-- Create a default guild for existing users (migration compatibility)
insert into public.guilds (name, game, description)
values ('Default Guild', 'General', 'Default guild for all users')
on conflict do nothing;

-- Get the default guild id and assign all existing users to it
do $$
declare
  default_guild_id uuid;
begin
  select id into default_guild_id from public.guilds where name = 'Default Guild' limit 1;
  
  if default_guild_id is not null then
    -- Add all existing users to the default guild
    insert into public.guild_members (guild_id, user_id, role)
    select default_guild_id, id, 'member'
    from auth.users
    on conflict (guild_id, user_id) do nothing;
    
    -- Update existing screenshots to belong to the default guild
    update public.screenshots
    set guild_id = default_guild_id
    where guild_id is null;
  end if;
end $$;
