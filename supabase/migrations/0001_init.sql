create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  username text unique,
  phone text unique,
  role text not null default 'member',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on public.profiles;
create trigger set_timestamp
before update on public.profiles
for each row
execute function public.handle_updated_at();

create table if not exists public.screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_path text not null,
  label text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists screenshots_user_id_idx on public.screenshots (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.screenshots enable row level security;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can read screenshots" on public.screenshots;
create policy "Authenticated users can read screenshots"
on public.screenshots
for select
using (true);

drop policy if exists "Users can insert their screenshots" on public.screenshots;
create policy "Users can insert their screenshots"
on public.screenshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their screenshots" on public.screenshots;
create policy "Users can delete their screenshots"
on public.screenshots
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Profile creation is now handled by application code in signup action
  -- This function exists as a placeholder for future use
  return new;
end;
$$ language plpgsql security definer;



insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do update set name = excluded.name;

drop policy if exists "Authenticated users can read screenshot files" on storage.objects;
create policy "Authenticated users can read screenshot files"
on storage.objects
for select
to authenticated
using (bucket_id = 'screenshots');

drop policy if exists "Users can upload screenshot files" on storage.objects;
create policy "Users can upload screenshot files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'screenshots' and auth.uid() = owner);

drop policy if exists "Users can delete their screenshot files" on storage.objects;
create policy "Users can delete their screenshot files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'screenshots' and auth.uid() = owner);
