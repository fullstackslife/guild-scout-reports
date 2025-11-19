-- Update scout report schema for better data organization
-- Separates coordinates into K, X, Y
-- Updates troop breakdown structure

-- Add separate coordinate fields
alter table public.scout_reports
add column if not exists coordinate_k text,
add column if not exists coordinate_x text,
add column if not exists coordinate_y text;

-- Update troop breakdown to be more structured
-- The existing troop_breakdown text field can store JSON with the new structure
-- No migration needed for existing data, just document the new format

-- Create gear database table
create table if not exists public.gear_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null, -- 'weapon', 'armor', 'accessory', 'familiar', etc.
  subcategory text, -- 'sword', 'helmet', 'ring', etc.
  tier integer, -- 1-5 or null for special items
  base_value bigint, -- Base resource value
  might_bonus bigint, -- Might bonus when equipped
  stats jsonb, -- Additional stats as JSON
  rarity text, -- 'common', 'rare', 'epic', 'legendary', 'mythic'
  game text default 'Lords Mobile', -- Which game this gear is for
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  unique(name, game)
);

-- Create gear sets table (for set bonuses)
create table if not exists public.gear_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game text default 'Lords Mobile',
  set_bonus jsonb, -- Bonus stats when full set is equipped
  pieces jsonb, -- Array of gear_item IDs that make up the set
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  unique(name, game)
);

-- Create gear valuation rules table
create table if not exists public.gear_valuation_rules (
  id uuid primary key default gen_random_uuid(),
  gear_item_id uuid references public.gear_items (id) on delete cascade,
  valuation_method text not null, -- 'base_value', 'might_based', 'stats_based', 'custom'
  formula text, -- Formula for calculating value
  multipliers jsonb, -- Multipliers for different scenarios
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Add indexes
create index if not exists gear_items_category_idx on public.gear_items (category);
create index if not exists gear_items_game_idx on public.gear_items (game);
create index if not exists gear_items_name_idx on public.gear_items (name);

-- Add updated_at triggers
drop trigger if exists set_timestamp_gear_items on public.gear_items;
create trigger set_timestamp_gear_items
before update on public.gear_items
for each row
execute function public.handle_updated_at();

drop trigger if exists set_timestamp_gear_sets on public.gear_sets;
create trigger set_timestamp_gear_sets
before update on public.gear_sets
for each row
execute function public.handle_updated_at();

drop trigger if exists set_timestamp_gear_valuation_rules on public.gear_valuation_rules;
create trigger set_timestamp_gear_valuation_rules
before update on public.gear_valuation_rules
for each row
execute function public.handle_updated_at();

-- Enable RLS
alter table public.gear_items enable row level security;
alter table public.gear_sets enable row level security;
alter table public.gear_valuation_rules enable row level security;

-- RLS Policies - all authenticated users can view gear data
drop policy if exists "Authenticated users can view gear items" on public.gear_items;
create policy "Authenticated users can view gear items"
on public.gear_items
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can view gear sets" on public.gear_sets;
create policy "Authenticated users can view gear sets"
on public.gear_sets
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can view gear valuation rules" on public.gear_valuation_rules;
create policy "Authenticated users can view gear valuation rules"
on public.gear_valuation_rules
for select
to authenticated
using (true);

