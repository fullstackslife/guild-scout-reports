# Guild Structure Documentation

## Overview

This document describes the multi-guild architecture implemented in the Warbot.app application. The system now supports multiple guilds with different games, allowing users to be members of one or more guilds.

## Database Schema

### guilds Table

Stores information about each guild in the system.

```sql
create table public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game text not null,
  game_id uuid references public.games (id) on delete set null,
  description text,
  promo_code text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

**Fields:**
- `id`: Unique identifier for the guild
- `name`: Guild name (e.g., "Phoenix Raiders", "Storm Chasers")
- `game`: Game the guild plays (e.g., "World of Warcraft", "Final Fantasy XIV")
- `game_id`: Foreign key reference to the games table
- `description`: Optional guild description
- `promo_code`: **Unique promo code for user signup** (e.g., "WOW_PHOEN_A3B9")
- `created_at`: Guild creation timestamp
- `updated_at`: Last update timestamp

### guild_members Table

Many-to-many relationship table linking users to guilds with role information.

```sql
create table public.guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  unique(guild_id, user_id)
);
```

**Fields:**
- `id`: Unique identifier for the membership record
- `guild_id`: Reference to the guild
- `user_id`: Reference to the user
- `role`: Member role within the guild ('member', 'admin', 'owner')
- `joined_at`: When the user joined the guild

**Constraints:**
- Each user can only have one membership record per guild (unique constraint)
- Deleting a guild removes all memberships
- Deleting a user removes all their guild memberships

### screenshots Table (Updated)

The screenshots table now includes a `guild_id` field to associate screenshots with guilds.

```sql
alter table public.screenshots
add column if not exists guild_id uuid references public.guilds (id) on delete cascade;
```

**New Field:**
- `guild_id`: Reference to the guild this screenshot belongs to (nullable for backward compatibility)

## Row Level Security (RLS) Policies

### Guilds Table

**Read Access:**
```sql
-- Authenticated users can view guilds they are members of
create policy "Authenticated users can view guilds they are members of"
on public.guilds
for select
to authenticated
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guilds.id
    and guild_members.user_id = auth.uid()
  )
);
```

Users can only view guilds they are members of.

### Guild Members Table

**Read Access:**
```sql
-- Users can view guild members of their guilds
create policy "Users can view guild members of their guilds"
on public.guild_members
for select
to authenticated
using (
  exists (
    select 1 from public.guild_members gm2
    where gm2.guild_id = guild_members.guild_id
    and gm2.user_id = auth.uid()
  )
);
```

Users can view members of any guild they belong to.

### Screenshots Table (Updated)

**Read Access:**
```sql
-- Authenticated users can read screenshots in their guilds
create policy "Authenticated users can read screenshots in their guilds"
on public.screenshots
for select
to authenticated
using (
  guild_id is null or exists (
    select 1 from public.guild_members
    where guild_members.guild_id = screenshots.guild_id
    and guild_members.user_id = auth.uid()
  )
);
```

Users can view screenshots from guilds they are members of. Screenshots without a guild_id (legacy data) are visible to all authenticated users.

**Insert Access:**
```sql
-- Users can insert screenshots to their guilds
create policy "Users can insert screenshots to their guilds"
on public.screenshots
for insert
to authenticated
with check (
  auth.uid() = user_id and (
    guild_id is null or exists (
      select 1 from public.guild_members
      where guild_members.guild_id = screenshots.guild_id
      and guild_members.user_id = auth.uid()
    )
  )
);
```

Users can only upload screenshots to guilds they are members of.

## Default Guild (Legacy)

**Note**: As of the promo code implementation, the default guild is no longer automatically assigned to new users. Users must provide a valid promo code during signup.

For backward compatibility with existing data, a default guild may exist:

```sql
insert into public.guilds (name, game, description)
values ('Default Guild', 'General', 'Default guild for all users')
on conflict do nothing;
```

The default guild (if it exists):
1. Contains existing users from before the promo code system
2. Has existing screenshots assigned to it
3. Can still be used by providing its promo code during signup

## Guild Promo Codes

Each guild has a unique promo code that controls user signup and guild assignment.

### Promo Code Format

Promo codes follow the format: `GAME_GUILDNAME_RANDOM`

Examples:
- `WOW_PHOEN_A3B9` (World of Warcraft - Phoenix Raiders)
- `LOR_STORM_X7F2` (Lords Mobile - Storm Chasers)
- `KIN_ELITE_M9K4` (Kingshot - Elite Squad)

### Promo Code Generation

Promo codes are automatically generated when a guild is created:

```typescript
import { generatePromoCode } from '@/lib/promo-code-utils';

// During guild creation
const promoCode = generatePromoCode(game.name, guildName);
// Result: "WOW_PHOEN_A3B9"
```

The system:
1. Takes first 3 characters of game name (alphanumeric only)
2. Takes first 6 characters of guild name (alphanumeric only)
3. Adds a 4-character random suffix
4. Checks for uniqueness and retries if collision detected (up to 10 attempts)

### Admin Workflow

When an admin creates a guild (`/admin/guilds`):

1. Admin fills in guild name, game, and description
2. System generates unique promo code automatically
3. Promo code is displayed in the success message
4. Promo code is visible in the guild list for sharing with users

```typescript
// In guild creation action
const guildInsert = {
  name,
  game: game.name,
  game_id: gameId,
  description,
  promo_code: promoCode
};
```

## Application Logic

### User Signup with Promo Code

When a new user signs up (`app/(public)/signup/actions.ts`):

1. User provides email, name, password, and **promo code**
2. System validates promo code exists in database
3. User account is created in Supabase Auth
4. Profile record is created
5. User is automatically added to the guild matching the promo code

```typescript
// Validate promo code and get guild
const { data: guild, error: guildError } = await adminClient
  .from('guilds')
  .select('id, name')
  .eq('promo_code', promoCode)
  .single();

if (guildError || !guild) {
  return { error: 'Invalid promo code. Please check with your guild admin.' };
}

// Add user to the guild based on promo code
await adminClient
  .from('guild_members')
  .insert({
    guild_id: guild.id,
    user_id: userId,
    role: 'member'
  });
```

**Important**: Promo code is now **required** for signup. Users cannot sign up without a valid promo code from an existing guild.

### Screenshot Upload

When a user uploads a screenshot (`app/(protected)/dashboard/actions.ts`):

1. Get user's primary guild (first guild they are a member of)
2. Associate the screenshot with that guild

```typescript
const { data: guildMemberships } = await supabase
  .from('guild_members')
  .select('guild_id')
  .eq('user_id', session.user.id)
  .limit(1);

const guildId = guildMemberships && guildMemberships.length > 0 
  ? guildMemberships[0].guild_id 
  : null;

const record = {
  user_id: session.user.id,
  guild_id: guildId,
  file_path: filePath,
  label,
  processing_status: 'pending'
};
```

### Dashboard Display

The dashboard (`app/(protected)/dashboard/page.tsx`) now shows:

1. Current guild name and game at the top
2. Only screenshots belonging to the user within their guild(s)

```typescript
// Get user's guilds
const { data: guildMemberships } = await supabase
  .from('guild_members')
  .select('guild_id')
  .eq('user_id', session.user.id);

// Fetch guild information
if (userGuildIds.length > 0) {
  const { data: guildData } = await supabase
    .from('guilds')
    .select('*')
    .eq('id', userGuildIds[0])
    .single();
  currentGuild = guildData;
}
```

### Gallery Display

The gallery (`app/(protected)/gallery/page.tsx`) now:

1. Shows guild name and game in the header
2. Only displays screenshots from guilds the user is a member of

```typescript
// Fetch screenshots from user's guild(s)
const { data: screenshots } = await supabase
  .from('screenshots')
  .select('*')
  .in('guild_id', userGuildIds)
  .order('created_at', { ascending: false });
```

## Multi-Guild Support (Future)

While the current implementation focuses on single guild membership per user, the database schema supports multiple guilds per user. To fully enable multi-guild functionality in the future:

1. **Guild Selector**: Add a dropdown in the header to switch between guilds
2. **Guild Context**: Store selected guild in user session or local storage
3. **Upload to Guild**: Add guild selector in upload form
4. **Cross-Guild View**: Add option to view all guilds' screenshots (if desired)

Example implementation for guild selector:

```typescript
// Get all user's guilds
const { data: userGuilds } = await supabase
  .from('guild_members')
  .select('guild_id, guilds(*)')
  .eq('user_id', session.user.id);

// Let user select which guild context they want
<select value={currentGuildId} onChange={handleGuildChange}>
  {userGuilds.map(gm => (
    <option key={gm.guild_id} value={gm.guild_id}>
      {gm.guilds.name} - {gm.guilds.game}
    </option>
  ))}
</select>
```

## Migration Instructions

To apply this migration to an existing database:

1. Ensure you have a backup of your database
2. Run the migration file: `supabase/migrations/0003_add_guild_structure.sql`
3. Verify the default guild was created
4. Verify existing users were added to the default guild
5. Verify existing screenshots were assigned to the default guild

The migration is designed to be idempotent and safe to run multiple times.

## Benefits

1. **Multi-Tenancy**: Support multiple guilds on the same platform
2. **Isolation**: Screenshots and data are isolated per guild
3. **Flexibility**: Users can belong to multiple guilds
4. **Security**: RLS policies ensure users only see their guild's data
5. **Backward Compatible**: Existing data is preserved via default guild
6. **Scalable**: Can support many guilds without schema changes

## TypeScript Types

The TypeScript types have been updated to reflect the new schema:

```typescript
// Guild types
type GuildRow = Database['public']['Tables']['guilds']['Row'];
type GuildMemberRow = Database['public']['Tables']['guild_members']['Row'];

// Updated Screenshot type includes guild_id
type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
// Now has: guild_id: string | null
```

## Testing Recommendations

To test the guild structure:

1. **Create a new user** - Verify they are added to default guild
2. **Upload a screenshot** - Verify it's associated with the guild
3. **View gallery** - Verify only guild screenshots are shown
4. **Create another guild** - Test multi-guild scenarios
5. **Add user to multiple guilds** - Test access across guilds
6. **Delete a guild** - Verify cascade deletions work correctly

## Troubleshooting

### User can't see any screenshots

**Cause**: User is not a member of any guild
**Solution**: Add user to the default guild manually:

```sql
insert into guild_members (guild_id, user_id, role)
select 
  (select id from guilds where name = 'Default Guild'),
  'user-uuid-here',
  'member';
```

### Screenshots not showing guild context

**Cause**: Screenshots have null guild_id
**Solution**: Update screenshots to belong to default guild:

```sql
update screenshots
set guild_id = (select id from guilds where name = 'Default Guild')
where guild_id is null;
```

### RLS policy denying access

**Cause**: User not properly linked to guild
**Solution**: Check guild_members table and verify user has a record for the guild they're trying to access.
