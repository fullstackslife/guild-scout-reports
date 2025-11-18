import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { SCREENSHOTS_BUCKET } from '@/lib/constants';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
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

  // Fetch all screenshots
  const { data: screenshots, error: screenshotError } = await supabase
    .from('screenshots')
    .select('id, file_path, label, extracted_text, processing_status, created_at, user_id')
    .order('created_at', { ascending: false });

  if (screenshotError) {
    console.error('Gallery query error:', screenshotError);
  }

  // Fetch all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name');

  if (profileError) {
    console.error('Profile query error:', profileError);
  }

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));

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
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Guild Gallery</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
            Browse all scout reports shared by guild members
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
                  <article
                    key={shot.id}
                    style={{
                      display: 'grid',
                      gap: '1rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      background: '#111827',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    }}
                  >
                    {shot.signedUrl ? (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          paddingBottom: '56.25%',
                          background: '#0f172a',
                          overflow: 'hidden'
                        }}
                      >
                        <Image
                          src={shot.signedUrl}
                          alt={shot.label ?? 'Screenshot'}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          height: '180px',
                          background: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f87171'
                        }}
                      >
                        Unable to load image
                      </div>
                    )}

                    <div style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {shot.label && (
                          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{shot.label}</h3>
                        )}
                        <time style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          {formatDistanceToNow(new Date(shot.created_at), { addSuffix: true })}
                        </time>
                      </div>

                      {shot.processing_status === 'completed' && shot.extracted_text ? (
                        <div
                          style={{
                            display: 'grid',
                            gap: '0.5rem',
                            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                            paddingTop: '0.75rem'
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              color: '#a78bfa',
                              fontWeight: 600
                            }}
                          >
                            Extracted Text
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#cbd5f5',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {shot.extracted_text}
                          </p>
                        </div>
                      ) : shot.processing_status === 'pending' ? (
                        <div
                          style={{
                            display: 'grid',
                            gap: '0.5rem',
                            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                            paddingTop: '0.75rem'
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.85rem',
                              color: '#94a3b8'
                            }}
                          >
                            Processing text extraction...
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
