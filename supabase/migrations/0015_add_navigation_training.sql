-- Navigation Training and Pattern System
-- Allows users to teach the system navigation patterns by recording screenshots and actions

-- Navigation patterns table - stores learned patterns
create table if not exists public.navigation_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  guild_id uuid references public.guilds (id) on delete set null,
  
  -- Pattern identification
  name text not null,
  description text,
  pattern_type text not null default 'screen_match', -- 'screen_match', 'coordinate_nav', 'hybrid'
  
  -- Screenshot template (reference to screenshot)
  template_screenshot_id uuid references public.screenshots (id) on delete set null,
  template_image_path text, -- Path to template image for matching
  
  -- Pattern matching criteria
  match_threshold numeric(3, 2) default 0.85, -- 0.0 to 1.0, similarity threshold
  match_region jsonb, -- Optional: specific region to match {x, y, width, height}
  match_features jsonb, -- Extracted features for matching (OCR text, UI elements, etc.)
  
  -- Actions to execute when pattern matches
  actions jsonb not null, -- Array of ADB commands to execute
  action_sequence text, -- Human-readable description of actions
  
  -- Context
  expected_game_state text, -- What game state this pattern represents
  target_coordinates jsonb, -- {k, x, y} if this is coordinate-based navigation
  
  -- Training metadata
  training_sessions integer default 0,
  success_count integer default 0,
  failure_count integer default 0,
  last_tested_at timestamptz,
  
  -- Status
  is_active boolean default true,
  confidence_score numeric(3, 2) default 0.50, -- System confidence in pattern
  
  -- Metadata
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Training sessions - records of user teaching the system
create table if not exists public.navigation_training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern_id uuid references public.navigation_patterns (id) on delete set null,
  
  -- Session data
  session_name text,
  screenshot_id uuid references public.screenshots (id) on delete set null,
  initial_game_state text,
  
  -- Recorded actions
  recorded_actions jsonb not null, -- Array of {type, x, y, timestamp, etc.}
  action_count integer default 0,
  
  -- Result
  final_game_state text,
  final_screenshot_id uuid references public.screenshots (id) on delete set null,
  success boolean,
  notes text,
  
  -- Metadata
  created_at timestamptz not null default timezone('utc', now()),
  duration_seconds integer
);

-- Pattern matches - tracks when patterns are matched and executed
create table if not exists public.pattern_executions (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references public.navigation_patterns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  
  -- Execution context
  trigger_screenshot_id uuid references public.screenshots (id) on delete set null,
  match_confidence numeric(3, 2),
  matched_features jsonb,
  
  -- Execution result
  actions_executed jsonb,
  execution_success boolean,
  execution_error text,
  result_screenshot_id uuid references public.screenshots (id) on delete set null,
  
  -- Verification
  verified_by_user boolean default false,
  user_feedback text, -- 'success', 'failure', 'partial'
  
  -- Metadata
  executed_at timestamptz not null default timezone('utc', now())
);

-- Screenshot regions - for template matching
create table if not exists public.screenshot_regions (
  id uuid primary key default gen_random_uuid(),
  screenshot_id uuid not null references public.screenshots (id) on delete cascade,
  pattern_id uuid references public.navigation_patterns (id) on delete set null,
  
  -- Region definition
  region_type text not null, -- 'template', 'ui_element', 'text', 'button'
  x integer not null,
  y integer not null,
  width integer not null,
  height integer not null,
  
  -- Region data
  extracted_text text,
  extracted_features jsonb,
  image_hash text, -- For quick comparison
  
  -- Metadata
  created_at timestamptz not null default timezone('utc', now())
);

-- Create indexes
create index if not exists navigation_patterns_user_id_idx on public.navigation_patterns(user_id);
create index if not exists navigation_patterns_guild_id_idx on public.navigation_patterns(guild_id);
create index if not exists navigation_patterns_pattern_type_idx on public.navigation_patterns(pattern_type);
create index if not exists navigation_patterns_active_idx on public.navigation_patterns(is_active, confidence_score desc);

create index if not exists navigation_training_sessions_user_id_idx on public.navigation_training_sessions(user_id);
create index if not exists navigation_training_sessions_pattern_id_idx on public.navigation_training_sessions(pattern_id);
create index if not exists navigation_training_sessions_created_at_idx on public.navigation_training_sessions(created_at desc);

create index if not exists pattern_executions_pattern_id_idx on public.pattern_executions(pattern_id, executed_at desc);
create index if not exists pattern_executions_user_id_idx on public.pattern_executions(user_id);
create index if not exists pattern_executions_verified_idx on public.pattern_executions(verified_by_user, execution_success);

create index if not exists screenshot_regions_screenshot_id_idx on public.screenshot_regions(screenshot_id);
create index if not exists screenshot_regions_pattern_id_idx on public.screenshot_regions(pattern_id);

-- Enable RLS
alter table public.navigation_patterns enable row level security;
alter table public.navigation_training_sessions enable row level security;
alter table public.pattern_executions enable row level security;
alter table public.screenshot_regions enable row level security;

-- RLS Policies for navigation_patterns
drop policy if exists "Users can view patterns in their guilds" on public.navigation_patterns;
create policy "Users can view patterns in their guilds"
on public.navigation_patterns
for select
to authenticated
using (
  user_id = auth.uid() or
  (guild_id is not null and exists (
    select 1 from public.guild_members
    where guild_members.guild_id = navigation_patterns.guild_id
    and guild_members.user_id = auth.uid()
  ))
);

drop policy if exists "Users can create patterns" on public.navigation_patterns;
create policy "Users can create patterns"
on public.navigation_patterns
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their patterns" on public.navigation_patterns;
create policy "Users can update their patterns"
on public.navigation_patterns
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their patterns" on public.navigation_patterns;
create policy "Users can delete their patterns"
on public.navigation_patterns
for delete
to authenticated
using (user_id = auth.uid());

-- RLS Policies for navigation_training_sessions
drop policy if exists "Users can view their training sessions" on public.navigation_training_sessions;
create policy "Users can view their training sessions"
on public.navigation_training_sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create training sessions" on public.navigation_training_sessions;
create policy "Users can create training sessions"
on public.navigation_training_sessions
for insert
to authenticated
with check (user_id = auth.uid());

-- RLS Policies for pattern_executions
drop policy if exists "Users can view pattern executions" on public.pattern_executions;
create policy "Users can view pattern executions"
on public.pattern_executions
for select
to authenticated
using (
  user_id = auth.uid() or
  exists (
    select 1 from public.navigation_patterns
    where navigation_patterns.id = pattern_executions.pattern_id
    and (
      navigation_patterns.user_id = auth.uid() or
      (navigation_patterns.guild_id is not null and exists (
        select 1 from public.guild_members
        where guild_members.guild_id = navigation_patterns.guild_id
        and guild_members.user_id = auth.uid()
      ))
    )
  )
);

drop policy if exists "Users can create pattern executions" on public.pattern_executions;
create policy "Users can create pattern executions"
on public.pattern_executions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update pattern executions" on public.pattern_executions;
create policy "Users can update pattern executions"
on public.pattern_executions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- RLS Policies for screenshot_regions
drop policy if exists "Users can view screenshot regions" on public.screenshot_regions;
create policy "Users can view screenshot regions"
on public.screenshot_regions
for select
to authenticated
using (
  exists (
    select 1 from public.screenshots
    where screenshots.id = screenshot_regions.screenshot_id
    and (
      screenshots.user_id = auth.uid() or
      (screenshots.guild_id is not null and exists (
        select 1 from public.guild_members
        where guild_members.guild_id = screenshots.guild_id
        and guild_members.user_id = auth.uid()
      ))
    )
  )
);

drop policy if exists "Users can create screenshot regions" on public.screenshot_regions;
create policy "Users can create screenshot regions"
on public.screenshot_regions
for insert
to authenticated
with check (
  exists (
    select 1 from public.screenshots
    where screenshots.id = screenshot_regions.screenshot_id
    and screenshots.user_id = auth.uid()
  )
);

-- Add updated_at triggers
drop trigger if exists set_timestamp_navigation_patterns on public.navigation_patterns;
create trigger set_timestamp_navigation_patterns
before update on public.navigation_patterns
for each row
execute function public.handle_updated_at();

