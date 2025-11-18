import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { GameManagementClient } from './game-management-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manage games | Warbot.app'
};

type GameRow = Database['public']['Tables']['games']['Row'];

export default async function AdminGamesPage() {
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

  // Get all games, ordered by display_order then name
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (gamesError) {
    console.error('Failed to load games', gamesError);
  }

  return <GameManagementClient games={(games as GameRow[] | null) ?? []} />;
}

