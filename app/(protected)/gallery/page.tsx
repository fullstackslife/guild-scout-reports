import { SCREENSHOTS_BUCKET } from '@/lib/constants';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { GalleryClient } from '@/components/gallery/gallery-client';

export const dynamic = 'force-dynamic';

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];

type ScreenshotWithMeta = ScreenshotRow & {
  signedUrl: string | null;
  uploaderName: string | null;
};

export default async function GalleryPage({
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

  // Get user's guilds with screenshot counts
  const { data: guildMemberships } = await supabase
    .from('guild_members')
    .select('guild_id, guilds(*)')
    .eq('user_id', session.user.id);

  const userGuildIds = (guildMemberships ?? []).map((gm: { guild_id: string }) => gm.guild_id);

  // Fetch all user guilds with screenshot counts
  let userGuilds: Array<GuildRow & { screenshotCount: number }> = [];
  if (userGuildIds.length > 0) {
    const { data: guildsData } = await supabase
      .from('guilds')
      .select('*')
      .in('id', userGuildIds)
      .order('name', { ascending: true });

    if (guildsData) {
      // Get screenshot counts for each guild
      const screenshotCounts = await Promise.all(
        (guildsData as GuildRow[]).map(async (guild) => {
          const { count } = await supabase
            .from('screenshots')
            .select('*', { count: 'exact', head: true })
            .eq('guild_id', guild.id);
          return { guildId: guild.id, count: count ?? 0 };
        })
      );

      userGuilds = (guildsData as GuildRow[]).map((guild) => {
        const countData = screenshotCounts.find((c) => c.guildId === guild.id);
        return {
          ...guild,
          screenshotCount: countData?.count ?? 0
        };
      });
    }
  }

  // Fetch screenshots based on selected guild
  let screenshots: ScreenshotRow[] | null = null;
  let screenshotError = null;

  if (selectedGuildId && userGuildIds.includes(selectedGuildId)) {
    // Fetch screenshots for the selected guild
    const result = await supabase
      .from('screenshots')
      .select('id, file_path, label, extracted_text, processing_status, created_at, user_id, guild_id')
      .eq('guild_id', selectedGuildId)
      .order('created_at', { ascending: false });
    screenshots = result.data;
    screenshotError = result.error;
  } else {
    // No guild selected - return empty array (will show guild selection)
    screenshots = [];
  }

  if (screenshotError) {
    console.error('Gallery query error:', screenshotError);
  }

  // Fetch all profiles for users
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name');

  if (profileError) {
    console.error('Profile query error:', profileError);
  }

  const profileMap = new Map((profiles ?? []).map((p: ProfileRow) => [p.id, p.display_name]));

  const screenshotList = (screenshots ?? []) as ScreenshotRow[];

  // Generate signed URLs
  const signedUrls: ScreenshotWithMeta[] = await Promise.all(
    screenshotList.map(async (shot) => {
      const { data } = await supabase.storage
        .from(SCREENSHOTS_BUCKET)
        .createSignedUrl(shot.file_path, 60 * 60);

      return {
        ...shot,
        signedUrl: data?.signedUrl ?? null,
        uploaderName: profileMap.get(shot.user_id) ?? 'Unknown'
      } satisfies ScreenshotWithMeta;
    })
  );

  return (
    <GalleryClient
      userGuilds={userGuilds}
      screenshots={signedUrls}
      selectedGuildId={selectedGuildId}
    />
  );
}
