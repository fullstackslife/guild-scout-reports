-- Fix infinite recursion in guild_members RLS policy
-- The original policy queried guild_members within its own policy check, causing recursion
-- Solution: Use a SECURITY DEFINER function that bypasses RLS to check membership

-- Drop the problematic policy
drop policy if exists "Users can view guild members of their guilds" on public.guild_members;

-- Create a helper function that bypasses RLS to check membership
-- This function runs with the privileges of the function owner (postgres) and bypasses RLS
create or replace function public.user_is_guild_member(p_guild_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  -- This query bypasses RLS because the function is SECURITY DEFINER
  return exists (
    select 1 
    from public.guild_members
    where guild_id = p_guild_id 
    and user_id = p_user_id
  );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.user_is_guild_member(uuid, uuid) to authenticated;

-- Now create the fixed policy using the function
-- Users can see:
-- 1. Their own membership records (user_id = auth.uid())
-- 2. Other members' records for guilds they belong to (checked via the security definer function)
create policy "Users can view guild members of their guilds"
on public.guild_members
for select
to authenticated
using (
  -- User can always see their own membership records
  user_id = auth.uid()
  OR
  -- User can see other members if they belong to the same guild (using security definer function)
  -- The function bypasses RLS, preventing infinite recursion
  public.user_is_guild_member(guild_id, auth.uid())
);

