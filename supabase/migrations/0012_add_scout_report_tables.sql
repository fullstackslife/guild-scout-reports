-- Add tables for scout report data entry and credibility tracking

-- Scout reports table - stores structured data extracted from scout screenshots
create table if not exists public.scout_reports (
  id uuid primary key default gen_random_uuid(),
  screenshot_id uuid not null references public.screenshots (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  guild_id uuid references public.guilds (id) on delete set null,
  
  -- Target basics
  target_name text,
  target_guild text,
  coordinates text,
  might bigint,
  leader_present boolean,
  anti_scout_active boolean,
  
  -- Defensive state
  wall_hp bigint,
  traps_total bigint,
  traps_types text, -- JSON or comma-separated
  wall_heroes_count integer,
  wall_heroes_details text, -- JSON with rank/grade info
  wall_familiars text,
  active_boosts text, -- JSON array of active boosts
  
  -- Army picture
  total_troops bigint,
  troop_breakdown text, -- JSON: {infantry: {t2: 1000, t3: 500, ...}, cavalry: {...}, range: {...}}
  reinforcements_count bigint,
  reinforcements_details text, -- JSON array of {sender_name, sender_guild, troop_count}
  garrisons_count bigint,
  garrisons_details text, -- JSON array
  coalition_inside boolean,
  coalition_details text, -- JSON if coalition present
  
  -- Damage / recent combat
  wounded_in_infirmary bigint,
  damaged_traps_count bigint,
  retrieve_traps_info text,
  
  -- Economic value
  resources_food bigint,
  resources_stone bigint,
  resources_ore bigint,
  resources_timber bigint,
  resources_gold bigint,
  resources_above_vault text, -- JSON or calculated
  worth_it_farming boolean,
  worth_it_kills boolean,
  
  -- Parsed data from OCR (for comparison)
  parsed_data text, -- JSON of what the system extracted
  
  -- Metadata
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- User credibility scores for scout report data entry
create table if not exists public.scout_report_credibility (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  guild_id uuid references public.guilds (id) on delete set null,
  
  -- Credibility metrics
  total_entries integer default 0,
  accurate_entries integer default 0,
  accuracy_percentage numeric(5, 2) default 0.00, -- 0.00 to 100.00
  reliability_tier text, -- 'expert', 'reliable', 'good', 'needs_improvement', 'new'
  
  -- Field-specific accuracy (JSON)
  field_accuracy text, -- JSON: {"wall_hp": 0.95, "total_troops": 0.88, ...}
  
  -- Metadata
  last_calculated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  unique(user_id, guild_id)
);

-- Validation log - tracks each comparison between manual entry and parsed data
create table if not exists public.scout_report_validations (
  id uuid primary key default gen_random_uuid(),
  scout_report_id uuid not null references public.scout_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  
  -- Comparison results
  fields_compared text, -- JSON: {"wall_hp": {"manual": 1000000, "parsed": 950000, "match": false}, ...}
  overall_match_percentage numeric(5, 2),
  fields_that_differed text[], -- Array of field names that didn't match
  user_corrections text, -- JSON of fields user corrected
  
  -- Metadata
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes for performance
create index if not exists scout_reports_screenshot_id_idx on public.scout_reports (screenshot_id);
create index if not exists scout_reports_user_id_idx on public.scout_reports (user_id);
create index if not exists scout_reports_guild_id_idx on public.scout_reports (guild_id);
create index if not exists scout_reports_created_at_idx on public.scout_reports (created_at desc);

create index if not exists scout_report_credibility_user_id_idx on public.scout_report_credibility (user_id);
create index if not exists scout_report_credibility_guild_id_idx on public.scout_report_credibility (guild_id);

create index if not exists scout_report_validations_scout_report_id_idx on public.scout_report_validations (scout_report_id);
create index if not exists scout_report_validations_user_id_idx on public.scout_report_validations (user_id);

-- Add updated_at triggers
drop trigger if exists set_timestamp_scout_reports on public.scout_reports;
create trigger set_timestamp_scout_reports
before update on public.scout_reports
for each row
execute function public.handle_updated_at();

drop trigger if exists set_timestamp_scout_report_credibility on public.scout_report_credibility;
create trigger set_timestamp_scout_report_credibility
before update on public.scout_report_credibility
for each row
execute function public.handle_updated_at();

-- Enable RLS
alter table public.scout_reports enable row level security;
alter table public.scout_report_credibility enable row level security;
alter table public.scout_report_validations enable row level security;

-- RLS Policies for scout_reports
drop policy if exists "Users can view scout reports in their guilds" on public.scout_reports;
create policy "Users can view scout reports in their guilds"
on public.scout_reports
for select
to authenticated
using (
  guild_id is null or exists (
    select 1 from public.guild_members
    where guild_members.guild_id = scout_reports.guild_id
    and guild_members.user_id = auth.uid()
  )
);

drop policy if exists "Users can create scout reports for their screenshots" on public.scout_reports;
create policy "Users can create scout reports for their screenshots"
on public.scout_reports
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.screenshots
    where screenshots.id = screenshot_id
    and screenshots.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own scout reports" on public.scout_reports;
create policy "Users can update their own scout reports"
on public.scout_reports
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- RLS Policies for scout_report_credibility
drop policy if exists "Users can view credibility scores in their guilds" on public.scout_report_credibility;
create policy "Users can view credibility scores in their guilds"
on public.scout_report_credibility
for select
to authenticated
using (
  guild_id is null or exists (
    select 1 from public.guild_members
    where guild_members.guild_id = scout_report_credibility.guild_id
    and guild_members.user_id = auth.uid()
  )
);

-- RLS Policies for scout_report_validations
drop policy if exists "Users can view validations for scout reports they can see" on public.scout_report_validations;
create policy "Users can view validations for scout reports they can see"
on public.scout_report_validations
for select
to authenticated
using (
  exists (
    select 1 from public.scout_reports
    where scout_reports.id = scout_report_validations.scout_report_id
    and (
      scout_reports.guild_id is null or exists (
        select 1 from public.guild_members
        where guild_members.guild_id = scout_reports.guild_id
        and guild_members.user_id = auth.uid()
      )
    )
  )
);

