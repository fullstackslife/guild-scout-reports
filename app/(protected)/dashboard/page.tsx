import { SCREENSHOTS_BUCKET } from '@/lib/constants';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const dynamic = 'force-dynamic';

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];
type ScreenshotWithUrl = ScreenshotRow & {
  signedUrl: string | null;
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { guild?: string };
}) {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const selectedGuildId = searchParams.guild || null;

  // Get user's guilds
  const { data: guildMemberships } = await supabase
    .from('guild_members')
    .select('guild_id, guilds(*)')
    .eq('user_id', session.user.id);

  const userGuildIds = (guildMemberships ?? []).map((gm: any) => gm.guild_id);

  // Fetch all user guilds
  let userGuilds: GuildRow[] = [];
  if (userGuildIds.length > 0) {
    const { data: guildsData } = await supabase
      .from('guilds')
      .select('*')
      .in('id', userGuildIds)
      .order('name', { ascending: true });

    userGuilds = (guildsData as GuildRow[]) ?? [];
  }

  // Fetch all user screenshots
  const { data: screenshots } = await supabase
    .from('screenshots')
    .select('id, file_path, label, created_at, guild_id')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const screenshotList: ScreenshotRow[] = screenshots ?? [];

  // Generate signed URLs
  const signedUrls: ScreenshotWithUrl[] = await Promise.all(
    screenshotList.map(async (shot) => {
      const { data } = await supabase.storage
        .from(SCREENSHOTS_BUCKET)
        .createSignedUrl(shot.file_path, 60 * 60);

      return {
        ...shot,
        signedUrl: data?.signedUrl ?? null
      } satisfies ScreenshotWithUrl;
    })
  );

  return (
    <DashboardClient
      userGuilds={userGuilds}
      screenshots={signedUrls}
      selectedGuildId={selectedGuildId}
    />
  );
}
