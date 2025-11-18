-- Add games table and seed with requested games

-- Create games table
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text, -- Optional icon/emoji for the game
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Add updated_at trigger for games
drop trigger if exists set_timestamp_games on public.games;
create trigger set_timestamp_games
before update on public.games
for each row
execute function public.handle_updated_at();

-- Add game_id to guilds table (keeping game text field for backward compatibility)
-- Only if guilds table exists (from migration 0003)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'guilds') then
    alter table public.guilds
    add column if not exists game_id uuid references public.games (id) on delete set null;

    -- Create index for game_id
    create index if not exists guilds_game_id_idx on public.guilds (game_id);
  end if;
end $$;

-- Enable RLS on games table
alter table public.games enable row level security;

-- RLS policy: All authenticated users can view games
drop policy if exists "Authenticated users can view games" on public.games;
create policy "Authenticated users can view games"
on public.games
for select
to authenticated
using (true);

-- Insert the requested games
insert into public.games (name, description) values
  ('Lords Mobile', 'Real-time strategy mobile game'),
  ('Kingshot', 'Battle royale mobile game'),
  ('Arc Raiders', 'Cooperative third-person shooter'),
  ('World of Warcraft', 'Massively multiplayer online role-playing game')
on conflict (name) do nothing;

-- Update existing guilds to reference games by matching game name
-- Only if guilds table exists
do $$
declare
  game_record record;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'guilds') then
    for game_record in 
      select id, name from public.games
    loop
      update public.guilds
      set game_id = game_record.id
      where lower(trim(game)) = lower(trim(game_record.name))
      and game_id is null;
    end loop;
  end if;
end $$;

-- Create default guilds for each game if they don't exist
-- Only if guilds table exists
do $$
declare
  game_record record;
  default_guild_id uuid;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'guilds') then
    for game_record in 
      select id, name from public.games
    loop
      -- Check if default guild for this game exists
      select id into default_guild_id
      from public.guilds
      where name = format('Default %s Guild', game_record.name)
      limit 1;
      
      if default_guild_id is null then
        -- Create default guild for this game
        insert into public.guilds (name, game, game_id, description)
        values (
          format('Default %s Guild', game_record.name),
          game_record.name,
          game_record.id,
          format('Default guild for %s players', game_record.name)
        )
        returning id into default_guild_id;
      end if;
    end loop;
  end if;
end $$;

