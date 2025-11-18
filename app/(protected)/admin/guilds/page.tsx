import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { GuildManagementClient } from './guild-management-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manage guilds | Warbot.app'
};

type GuildRow = Database['public']['Tables']['guilds']['Row'];
type GameRow = {
  id: string;
  name: string;
  description: string | null;
};

export default async function AdminGuildsPage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Failed to verify admin profile', profileError);
    redirect('/dashboard');
  }

  const profile = rawProfile as Pick<Database['public']['Tables']['profiles']['Row'], 'role'> | null;
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all guilds
  const { data: guilds, error: guildsError } = await supabase
    .from('guilds')
    .select('*')
    .order('name', { ascending: true });

  if (guildsError) {
    console.error('Failed to load guilds', guildsError);
  }

  // Get all games
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('name', { ascending: true });

  if (gamesError) {
    console.error('Failed to load games', gamesError);
  }

  // Get member counts for each guild
  const guildsWithCounts = await Promise.all(
    (guilds ?? []).map(async (guild) => {
      const { count } = await supabase
        .from('guild_members')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', guild.id);
      return {
        ...guild,
        memberCount: count ?? 0
      };
    })
  );

  return (
    <GuildManagementClient
      guilds={(guildsWithCounts as Array<GuildRow & { memberCount: number }>) ?? []}
      games={(games as GameRow[] | null) ?? []}
    />
  );
}

