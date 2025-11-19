import type { Metadata } from 'next';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { MapClient } from '@/components/map/map-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kingdom Map | Warbot.app'
};

type ScoutReportRow = Database['public']['Tables']['scout_reports']['Row'];

export default async function MapPage({
  searchParams
}: {
  searchParams?: { kingdom?: string };
}) {
  const supabase = createSupabaseServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const kingdomFilter = searchParams?.kingdom;

  // Build query for scout reports with coordinates
  let query = supabase
    .from('scout_reports')
    .select('coordinate_k, coordinate_x, coordinate_y, target_name, target_guild, might, created_at')
    .not('coordinate_x', 'is', null)
    .not('coordinate_y', 'is', null);

  // Filter by kingdom if provided
  if (kingdomFilter) {
    query = query.eq('coordinate_k', kingdomFilter);
  }

  const { data: reports, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load scout reports for map', error);
  }

  const typedReports = (reports as ScoutReportRow[] | null) ?? [];

  // Get unique kingdoms for filter
  const { data: kingdoms } = await supabase
    .from('scout_reports')
    .select('coordinate_k')
    .not('coordinate_k', 'is', null)
    .order('coordinate_k', { ascending: true });

  const uniqueKingdoms = Array.from(
    new Set(
      (kingdoms || [])
        .map((k) => k.coordinate_k)
        .filter((k): k is string => k !== null)
    )
  ).sort((a, b) => {
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    return numA - numB;
  });

  return <MapClient reports={typedReports} kingdoms={uniqueKingdoms} selectedKingdom={kingdomFilter || null} />;
}

