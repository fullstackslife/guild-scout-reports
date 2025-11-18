-- Ensure game_id column exists in guilds table
-- This migration is idempotent and safe to run multiple times

-- Add game_id column if it doesn't exist
alter table public.guilds
add column if not exists game_id uuid references public.games (id) on delete set null;

-- Create index for game_id if it doesn't exist
create index if not exists guilds_game_id_idx on public.guilds (game_id);

-- Ensure games table exists (from migration 0004)
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Add updated_at trigger for games if it doesn't exist
drop trigger if exists set_timestamp_games on public.games;
create trigger set_timestamp_games
before update on public.games
for each row
execute function public.handle_updated_at();

-- Enable RLS on games table
alter table public.games enable row level security;

-- RLS policy: All authenticated users can view games
drop policy if exists "Authenticated users can view games" on public.games;
create policy "Authenticated users can view games"
on public.games
for select
to authenticated
using (true);

-- Insert the requested games if they don't exist
insert into public.games (name, description) values
  ('Lords Mobile', 'Real-time strategy mobile game'),
  ('Kingshot', 'Battle royale mobile game'),
  ('Arc Raiders', 'Cooperative third-person shooter'),
  ('World of Warcraft', 'Massively multiplayer online role-playing game')
on conflict (name) do nothing;

