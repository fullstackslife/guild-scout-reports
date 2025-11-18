import { formatDistanceToNow } from 'date-fns';
import { UploadScreenshotForm } from '@/components/forms/upload-screenshot-form';
import { SCREENSHOTS_BUCKET } from '@/lib/constants';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
type ScreenshotWithUrl = ScreenshotRow & { signedUrl: string | null };

export default async function DashboardPage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data: screenshots } = await supabase
    .from('screenshots')
    .select('id, file_path, label, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const screenshotList: ScreenshotRow[] = screenshots ?? [];

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
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Upload a new screenshot</h2>
        <UploadScreenshotForm />
      </section>

      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>My uploads</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>
            Screenshots you have uploaded appear here. Only you and guild admins can delete them.
          </p>
        </div>
        {signedUrls.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              borderRadius: '1rem',
              border: '1px dashed rgba(148, 163, 184, 0.4)',
              background: '#0f172a'
            }}
          >
            No screenshots yet. Upload your first scout report above.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '1.5rem'
            }}
          >
            {signedUrls.map((shot) => (
              <article
                key={shot.id}
                style={{
                  display: 'grid',
                  gap: '1rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: '#111827',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Uploaded {formatDistanceToNow(new Date(shot.created_at), { addSuffix: true })}
                  </div>
                </div>
                {shot.signedUrl ? (
                  <img
                    src={shot.signedUrl}
                    alt={shot.label ?? 'Screenshot upload'}
                    style={{
                      width: '100%',
                      maxHeight: '420px',
                      objectFit: 'contain',
                      borderRadius: '0.75rem',
                      background: '#0f172a'
                    }}
                  />
                ) : (
                  <div style={{ color: '#fca5a5' }}>Unable to generate preview.</div>
                )}
                {shot.label ? <p style={{ margin: 0 }}>{shot.label}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
