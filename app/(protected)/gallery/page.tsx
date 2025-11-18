import { SCREENSHOTS_BUCKET } from '@/lib/constants';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { ScreenshotCard } from '@/components/gallery/screenshot-card';

export const dynamic = 'force-dynamic';

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];
type GuildMemberRow = Pick<Database['public']['Tables']['guild_members']['Row'], 'guild_id'>;

type ScreenshotWithMeta = ScreenshotRow & {
  signedUrl: string | null;
  uploaderName: string | null;
};

interface ScreenshotsByUser {
  userId: string;
  uploaderName: string;
  screenshots: ScreenshotWithMeta[];
}

export default async function GalleryPage() {
  const supabase = createSupabaseServerComponentClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Get user's guilds
  const { data: guildMemberships } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', session.user.id);

  const typedGuildMemberships = (guildMemberships as GuildMemberRow[] | null);
  const userGuildIds = typedGuildMemberships?.map(gm => gm.guild_id) ?? [];

  // Fetch guild information
  let currentGuild: GuildRow | null = null;
  if (userGuildIds.length > 0) {
    const { data: guildData } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', userGuildIds[0])
      .single();
    currentGuild = (guildData as GuildRow | null);
  }

  // Fetch screenshots from user's guild(s) or screenshots without guild_id
  let screenshots: ScreenshotRow[] | null = null;
  let screenshotError = null;
  
  if (userGuildIds.length > 0) {
    // Get screenshots from user's guilds OR screenshots without guild_id (legacy/backward compatibility)
    // Use two queries and combine results for better compatibility
    const [guildScreenshots, legacyScreenshots] = await Promise.all([
      supabase
        .from('screenshots')
        .select('id, file_path, label, extracted_text, processing_status, created_at, user_id, guild_id')
        .in('guild_id', userGuildIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('screenshots')
        .select('id, file_path, label, extracted_text, processing_status, created_at, user_id, guild_id')
        .is('guild_id', null)
        .order('created_at', { ascending: false })
    ]);
    
    // Combine results, removing duplicates
    const guildData = (guildScreenshots.data ?? []) as ScreenshotRow[];
    const legacyData = (legacyScreenshots.data ?? []) as ScreenshotRow[];
    const combined = [...guildData, ...legacyData];
    
    // Remove duplicates by id and sort by created_at
    const uniqueScreenshots = Array.from(
      new Map(combined.map(s => [s.id, s])).values()
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    screenshots = uniqueScreenshots;
    screenshotError = guildScreenshots.error || legacyScreenshots.error;
  } else {
    // No guilds - show screenshots without guild_id (backward compatibility)
    const result = await supabase
      .from('screenshots')
      .select('id, file_path, label, extracted_text, processing_status, created_at, user_id, guild_id')
      .is('guild_id', null)
      .order('created_at', { ascending: false });
    screenshots = result.data;
    screenshotError = result.error;
  }

  if (screenshotError) {
    console.error('Gallery query error:', screenshotError);
  }

  // Fetch all profiles for users in the guild
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

  // Group by user
  const grouped = signedUrls.reduce(
    (acc: ScreenshotsByUser[], shot: ScreenshotWithMeta) => {
      const userId = shot.user_id;
      const uploaderName = shot.uploaderName ?? 'Unknown';

      const existing = acc.find((g: ScreenshotsByUser) => g.userId === userId);
      if (existing) {
        existing.screenshots.push(shot);
      } else {
        acc.push({
          userId,
          uploaderName,
          screenshots: [shot]
        });
      }

      return acc;
    },
    [] as ScreenshotsByUser[]
  );

  return (
    <div style={{ display: 'grid', gap: '3rem' }}>
      <section style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>
            {currentGuild ? `${currentGuild.name} Gallery` : 'Guild Gallery'}
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
            {currentGuild 
              ? `Browse scout reports for ${currentGuild.game}`
              : 'Browse all scout reports shared by guild members'
            }
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              background: '#111827',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>
              {screenshotList.length}
            </div>
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
              Total screenshots
            </p>
          </div>
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              background: '#111827',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34d399' }}>
              {grouped.length}
            </div>
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
              Contributors
            </p>
          </div>
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              background: '#111827',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a78bfa' }}>
              {signedUrls.filter((s) => s.processing_status === 'completed').length}
            </div>
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
              With extracted text
            </p>
          </div>
        </div>
      </section>

      {grouped.length === 0 ? (
        <div
          style={{
            padding: '3rem 2rem',
            borderRadius: '1rem',
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            textAlign: 'center'
          }}
        >
          <p style={{ color: '#94a3b8' }}>No screenshots yet. Be the first to share!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '3rem' }}>
          {grouped.map((group) => (
            <section key={group.userId} style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    fontWeight: 'bold',
                    fontSize: '1.25rem'
                  }}
                >
                  {group.uploaderName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{group.uploaderName}</h2>
                  <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    {group.screenshots.length} screenshot{group.screenshots.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {group.screenshots.map((shot) => (
                  <ScreenshotCard
                    key={shot.id}
                    id={shot.id}
                    signedUrl={shot.signedUrl}
                    label={shot.label}
                    extractedText={shot.extracted_text}
                    processingStatus={shot.processing_status}
                    createdAt={shot.created_at}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
