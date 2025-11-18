"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ScreenshotCard } from './screenshot-card';
import type { Database } from '@/lib/supabase/database.types';

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];

type ScreenshotWithMeta = ScreenshotRow & {
  signedUrl: string | null;
  uploaderName: string | null;
};

interface ScreenshotsByUser {
  userId: string;
  uploaderName: string;
  screenshots: ScreenshotWithMeta[];
}

type GalleryClientProps = {
  userGuilds: Array<GuildRow & { screenshotCount: number }>;
  screenshots: ScreenshotWithMeta[];
  selectedGuildId: string | null;
};

export function GalleryClient({ userGuilds, screenshots, selectedGuildId }: GalleryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localSelectedGuild, setLocalSelectedGuild] = useState<string | null>(selectedGuildId);

  const selectedGuild = useMemo(() => {
    return userGuilds.find((g) => g.id === localSelectedGuild) || null;
  }, [userGuilds, localSelectedGuild]);

  const handleGuildSelect = (guildId: string | null) => {
    setLocalSelectedGuild(guildId);
    const params = new URLSearchParams(searchParams.toString());
    if (guildId) {
      params.set('guild', guildId);
    } else {
      params.delete('guild');
    }
    router.push(`/gallery?${params.toString()}`);
  };

  // Group screenshots by user
  const grouped = useMemo(() => {
    return screenshots.reduce(
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
  }, [screenshots]);

  // Show guild selection if no guild is selected
  if (!localSelectedGuild) {
    return <GuildSelectionView guilds={userGuilds} onSelectGuild={handleGuildSelect} />;
  }

  // Show gallery for selected guild
  return (
    <GuildGalleryView
      guild={selectedGuild}
      groupedScreenshots={grouped}
      totalScreenshots={screenshots.length}
      onBack={() => handleGuildSelect(null)}
    />
  );
}

function GuildSelectionView({
  guilds,
  onSelectGuild
}: {
  guilds: Array<GuildRow & { screenshotCount: number }>;
  onSelectGuild: (guildId: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Guild Gallery</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
            Select a guild to view scout reports and screenshots
          </p>
        </div>
      </section>

      {guilds.length === 0 ? (
        <div
          style={{
            padding: '3rem 2rem',
            borderRadius: '1rem',
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            textAlign: 'center'
          }}
        >
          <p style={{ color: '#94a3b8' }}>You&apos;re not a member of any guilds yet.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {guilds.map((guild) => (
            <button
              key={guild.id}
              onClick={() => onSelectGuild(guild.id)}
              style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: '#111827',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'grid',
                gap: '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                e.currentTarget.style.background = '#111827';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#e2e8f0' }}>{guild.name}</h2>
                <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>{guild.game}</p>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>
                  {guild.screenshotCount}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  screenshot{guild.screenshotCount !== 1 ? 's' : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GuildGalleryView({
  guild,
  groupedScreenshots,
  totalScreenshots,
  onBack
}: {
  guild: (GuildRow & { screenshotCount: number }) | null;
  groupedScreenshots: ScreenshotsByUser[];
  totalScreenshots: number;
  onBack: () => void;
}) {
  return (
    <div style={{ display: 'grid', gap: '3rem' }}>
      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: '#111827',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111827';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
            }}
          >
            ← Back to Guilds
          </button>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>
            {guild ? `${guild.name} Gallery` : 'Gallery'}
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
            {guild
              ? `Browse scout reports for ${guild.game}`
              : 'Browse all scout reports shared by guild members'}
          </p>
        </div>
        
        {/* Guild Announcement Section - Always visible */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: guild?.announcement 
              ? '1px solid rgba(56, 189, 248, 0.3)' 
              : '1px solid rgba(148, 163, 184, 0.2)',
            background: guild?.announcement 
              ? 'rgba(56, 189, 248, 0.1)' 
              : '#111827',
            marginTop: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📢</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: guild?.announcement ? '#38bdf8' : '#cbd5f5', fontWeight: 600 }}>
              Guild Announcements
            </h3>
          </div>
          {guild?.announcement ? (
            <div
              style={{
                color: '#cbd5f5',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}
            >
              {guild.announcement}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No announcements at this time. Guild admins can post announcements that will appear here.
            </div>
          )}
        </div>

        {/* System Information Section */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            background: '#111827',
            marginTop: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#cbd5f5', fontWeight: 600 }}>
              How Scout Reports Work
            </h3>
          </div>
          <div style={{ display: 'grid', gap: '1rem', color: '#cbd5f5', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
                📸 Upload Screenshots
              </h4>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                Upload scout reports and screenshots from your Dashboard. Add a description to help identify what the screenshot contains.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
                🔍 Automatic Text Extraction
              </h4>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                Our system automatically extracts text from your screenshots using OCR technology. This makes it easy to search and find specific information later.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
                👥 Guild Collaboration
              </h4>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                All screenshots uploaded to this guild are visible to all guild members. This gallery helps coordinate strategies and share important information.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
                📊 Browse & Search
              </h4>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                Browse screenshots by contributor or use the extracted text to find specific information. Screenshots are organized by uploader for easy navigation.
              </p>
            </div>
          </div>
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
              {totalScreenshots}
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
              {groupedScreenshots.length}
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
              {groupedScreenshots.reduce(
                (sum, group) =>
                  sum + group.screenshots.filter((s) => s.processing_status === 'completed').length,
                0
              )}
            </div>
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
              With extracted text
            </p>
          </div>
        </div>
      </section>

      {groupedScreenshots.length === 0 ? (
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
          {groupedScreenshots.map((group) => (
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

