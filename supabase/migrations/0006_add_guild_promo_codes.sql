-- Add promo_code field to guilds table for auth-based guild assignment

-- Add promo_code column to guilds table
alter table public.guilds
add column if not exists promo_code text unique;

-- Create index for faster promo code lookups
create index if not exists guilds_promo_code_idx on public.guilds (promo_code);

-- Add comment to explain the column
comment on column public.guilds.promo_code is 'Unique promo code used during signup to automatically assign users to this guild';

-- Generate promo codes for existing guilds
-- Format: GAME_GUILDNAME_RANDOM (e.g., WOW_PHOENIX_A3B9)
do $$
declare
  guild_record record;
  new_promo_code text;
  random_suffix text;
begin
  for guild_record in 
    select id, name, game from public.guilds where promo_code is null
  loop
    -- Generate a random 4-character suffix
    random_suffix := upper(substring(md5(random()::text || guild_record.id::text) from 1 for 4));
    
    -- Create promo code from game name (first 3 chars) + guild name (first 6 chars) + random suffix
    new_promo_code := upper(
      regexp_replace(substring(guild_record.game from 1 for 3), '[^A-Z0-9]', '', 'g') ||
      '_' ||
      regexp_replace(substring(guild_record.name from 1 for 6), '[^A-Z0-9]', '', 'g') ||
      '_' ||
      random_suffix
    );
    
    -- Update the guild with the new promo code
    update public.guilds
    set promo_code = new_promo_code
    where id = guild_record.id;
  end loop;
end $$;
