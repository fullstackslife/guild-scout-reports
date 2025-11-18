-- Add fields to games table for screenshot types and usage information

alter table public.games
add column if not exists screenshot_types text,
add column if not exists usage_guide text,
add column if not exists display_order integer default 0,
add column if not exists coming_soon boolean default false;

comment on column public.games.screenshot_types is 'Information about what types of screenshots are needed for this game';
comment on column public.games.usage_guide is 'Explanation of how screenshots will be used for this game';
comment on column public.games.display_order is 'Order in which games should be displayed (lower numbers first)';
comment on column public.games.coming_soon is 'Whether this game is coming soon (not yet active)';

-- Update display order: Lords Mobile (1), Kingshot (2), Arc Raiders (3), World of Warcraft (4)
update public.games
set display_order = case
  when name = 'Lords Mobile' then 1
  when name = 'Kingshot' then 2
  when name = 'Arc Raiders' then 3
  when name = 'World of Warcraft' then 4
  else 0
end,
coming_soon = case
  when name in ('Arc Raiders', 'World of Warcraft') then true
  else false
end;

