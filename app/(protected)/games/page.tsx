import type { Metadata } from 'next';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { GamesClient } from '@/components/games/games-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Games | Warbot.app'
};

type GameRow = Database['public']['Tables']['games']['Row'];

export default async function GamesPage() {
  const supabase = createSupabaseServerComponentClient();

  // Get all games, ordered by display_order then name
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (gamesError) {
    console.error('Failed to load games', gamesError);
  }

  const gamesList = (games as GameRow[] | null) ?? [];

  return <GamesClient games={gamesList} />;
}

