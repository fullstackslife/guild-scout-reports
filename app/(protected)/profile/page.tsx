import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { ProfileClient } from '@/components/profile/profile-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile | Warbot.app'
};

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];
type GuildMemberRow = Database['public']['Tables']['guild_members']['Row'];

export default async function ProfilePage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Failed to load profile', profileError);
  }

  const userProfile = profile as ProfileRow | null;

  // Get user's guild memberships
  const { data: guildMemberships, error: guildError } = await supabase
    .from('guild_members')
    .select('guild_id, role, joined_at')
    .eq('user_id', session.user.id);

  if (guildError) {
    console.error('Failed to load guild memberships', guildError);
  }

  const memberships = (guildMemberships as GuildMemberRow[] | null) ?? [];

  // Get guild details for each membership
  const guildDetails: Array<GuildRow & { role: string; joined_at: string }> = [];
  if (memberships.length > 0) {
    const guildIds = memberships.map((m) => m.guild_id);
    const { data: guilds, error: guildsError } = await supabase
      .from('guilds')
      .select('*')
      .in('id', guildIds);

    if (guildsError) {
      console.error('Failed to load guilds', guildsError);
    } else if (guilds) {
      const guildsList = guilds as GuildRow[];
      for (const membership of memberships) {
        const guild = guildsList.find((g) => g.id === membership.guild_id);
        if (guild) {
          guildDetails.push({
            ...guild,
            role: membership.role,
            joined_at: membership.joined_at
          });
        }
      }
    }
  }

  // Get screenshot count
  const { count: screenshotCount } = await supabase
    .from('screenshots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);

  // Get all available games
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('name', { ascending: true });

  if (gamesError) {
    console.error('Failed to load games', gamesError);
  }

  type GameData = {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    created_at: string;
    updated_at: string;
  };

  const availableGames = (games as GameData[] | null) ?? [];

  return (
    <ProfileClient
      profile={userProfile}
      userEmail={session.user.email}
      guildMemberships={guildDetails}
      screenshotCount={screenshotCount ?? 0}
      availableGames={availableGames}
    />
  );
}
