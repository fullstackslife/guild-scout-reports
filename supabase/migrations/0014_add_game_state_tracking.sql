-- Add game state and coordinate tracking to screenshots
-- This enables the map to be an entry point for the screenshot engine

alter table if exists public.screenshots
add column if not exists game_state text, -- 'scout', 'battle', 'menu', 'map', 'loading', 'unknown'
add column if not exists coordinate_k text,
add column if not exists coordinate_x text,
add column if not exists coordinate_y text,
add column if not exists capture_method text default 'manual', -- 'manual', 'adb', 'scheduled', 'automated'
add column if not exists capture_source text, -- 'warbot', 'web', 'mobile_app', etc.
add column if not exists device_id text, -- ADB device identifier
add column if not exists scheduled_at timestamptz, -- For scheduled captures
add column if not exists metadata jsonb; -- Additional game state metadata

-- Create indexes for game state queries
create index if not exists screenshots_game_state_idx on public.screenshots(game_state);
create index if not exists screenshots_coordinates_idx on public.screenshots(coordinate_k, coordinate_x, coordinate_y);
create index if not exists screenshots_capture_method_idx on public.screenshots(capture_method);
create index if not exists screenshots_scheduled_at_idx on public.screenshots(scheduled_at) where scheduled_at is not null;

-- Create table for screenshot capture schedules
create table if not exists public.screenshot_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  guild_id uuid references public.guilds (id) on delete set null,
  
  -- Schedule details
  name text not null,
  description text,
  coordinate_k text,
  coordinate_x text,
  coordinate_y text,
  coordinate_radius integer default 0, -- 0 = exact coordinate, >0 = area
  
  -- Schedule timing
  schedule_type text not null default 'once', -- 'once', 'recurring', 'interval'
  scheduled_at timestamptz, -- For 'once' type
  interval_minutes integer, -- For 'interval' type
  cron_expression text, -- For 'recurring' type
  
  -- Capture settings
  game_state_filter text[], -- Only capture if game is in these states
  auto_process boolean default true, -- Automatically process OCR after capture
  max_captures integer, -- Limit number of captures
  
  -- Status
  is_active boolean default true,
  last_captured_at timestamptz,
  capture_count integer default 0,
  
  -- Metadata
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for schedules
create index if not exists screenshot_schedules_user_id_idx on public.screenshot_schedules(user_id);
create index if not exists screenshot_schedules_guild_id_idx on public.screenshot_schedules(guild_id);
create index if not exists screenshot_schedules_active_idx on public.screenshot_schedules(is_active, scheduled_at);
create index if not exists screenshot_schedules_coordinates_idx on public.screenshot_schedules(coordinate_k, coordinate_x, coordinate_y);

-- Create table for game state history per coordinate
create table if not exists public.coordinate_game_states (
  id uuid primary key default gen_random_uuid(),
  coordinate_k text not null,
  coordinate_x text not null,
  coordinate_y text not null,
  screenshot_id uuid references public.screenshots (id) on delete set null,
  
  -- Game state data
  game_state text not null,
  detected_at timestamptz not null default timezone('utc', now()),
  
  -- Extracted data snapshot
  target_name text,
  target_guild text,
  might bigint,
  metadata jsonb, -- Store any additional state data
  
  -- Metadata
  created_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for game state history
create index if not exists coordinate_game_states_coordinates_idx on public.coordinate_game_states(coordinate_k, coordinate_x, coordinate_y, detected_at desc);
create index if not exists coordinate_game_states_game_state_idx on public.coordinate_game_states(game_state);
create index if not exists coordinate_game_states_screenshot_id_idx on public.coordinate_game_states(screenshot_id);

-- Enable RLS
alter table public.screenshot_schedules enable row level security;
alter table public.coordinate_game_states enable row level security;

-- RLS Policies for screenshot_schedules
drop policy if exists "Users can view schedules in their guilds" on public.screenshot_schedules;
create policy "Users can view schedules in their guilds"
on public.screenshot_schedules
for select
to authenticated
using (
  user_id = auth.uid() or
  (guild_id is not null and exists (
    select 1 from public.guild_members
    where guild_members.guild_id = screenshot_schedules.guild_id
    and guild_members.user_id = auth.uid()
  ))
);

drop policy if exists "Users can create schedules" on public.screenshot_schedules;
create policy "Users can create schedules"
on public.screenshot_schedules
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their schedules" on public.screenshot_schedules;
create policy "Users can update their schedules"
on public.screenshot_schedules
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their schedules" on public.screenshot_schedules;
create policy "Users can delete their schedules"
on public.screenshot_schedules
for delete
to authenticated
using (user_id = auth.uid());

-- RLS Policies for coordinate_game_states
drop policy if exists "Users can view game states for coordinates in their guilds" on public.coordinate_game_states;
create policy "Users can view game states for coordinates in their guilds"
on public.coordinate_game_states
for select
to authenticated
using (
  exists (
    select 1 from public.screenshots
    where screenshots.id = coordinate_game_states.screenshot_id
    and (
      screenshots.user_id = auth.uid() or
      (screenshots.guild_id is not null and exists (
        select 1 from public.guild_members
        where guild_members.guild_id = screenshots.guild_id
        and guild_members.user_id = auth.uid()
      ))
    )
  ) or screenshot_id is null
);

-- Add updated_at triggers
drop trigger if exists set_timestamp_screenshot_schedules on public.screenshot_schedules;
create trigger set_timestamp_screenshot_schedules
before update on public.screenshot_schedules
for each row
execute function public.handle_updated_at();

