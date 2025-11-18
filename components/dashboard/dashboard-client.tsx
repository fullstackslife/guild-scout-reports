"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { UploadScreenshotForm } from '@/components/forms/upload-screenshot-form';
import { InfoSection } from '@/components/info-section';
import type { Database } from '@/lib/supabase/database.types';

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];

type ScreenshotWithUrl = ScreenshotRow & {
  signedUrl: string | null;
};

type DashboardClientProps = {
  userGuilds: GuildRow[];
  screenshots: ScreenshotWithUrl[];
  selectedGuildId: string | null;
};

export function DashboardClient({ userGuilds, screenshots, selectedGuildId }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localSelectedGuild, setLocalSelectedGuild] = useState<string | null>(selectedGuildId);

  const selectedGuild = useMemo(() => {
    return userGuilds.find((g) => g.id === localSelectedGuild) || null;
  }, [userGuilds, localSelectedGuild]);

  const handleGuildChange = (guildId: string | null) => {
    setLocalSelectedGuild(guildId);
    const params = new URLSearchParams(searchParams.toString());
    if (guildId) {
      params.set('guild', guildId);
    } else {
      params.delete('guild');
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  // Filter screenshots by selected guild
  const filteredScreenshots = useMemo(() => {
    if (!localSelectedGuild) {
      return screenshots;
    }
    return screenshots.filter((shot) => shot.guild_id === localSelectedGuild);
  }, [screenshots, localSelectedGuild]);

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Guild Selection */}
      {userGuilds.length > 1 && (
        <section
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: '#111827',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ color: '#cbd5f5', fontWeight: 500, fontSize: '0.9rem' }}>Filter by Guild:</label>
            <select
              value={localSelectedGuild || ''}
              onChange={(e) => handleGuildChange(e.target.value || null)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: '#0f172a',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <option value="">All Guilds</option>
              {userGuilds.map((guild) => (
                <option key={guild.id} value={guild.id}>
                  {guild.name} ({guild.game})
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Current Guild Info */}
      {selectedGuild && (
        <section
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: '#111827',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {selectedGuild.game}
            </div>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{selectedGuild.name}</span>
          </div>
        </section>
      )}

      {/* Upload Form */}
      <section style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Upload a new screenshot</h2>
        <UploadScreenshotForm defaultGuildId={localSelectedGuild} />
      </section>

      {/* How to Upload Info */}
      <InfoSection
        title="How to Upload Scout Reports"
        icon="📤"
        items={[
          {
            icon: '📸',
            title: 'Select Your Screenshot',
            description:
              'Choose an image file from your device. Supported formats include PNG, JPG, and other common image types. The file will be securely stored and processed.'
          },
          {
            icon: '✍️',
            title: 'Add a Description (Optional)',
            description:
              'Add a brief description to help identify what the screenshot contains. This makes it easier for guild members to find specific scout reports later.'
          },
          {
            icon: '🎮',
            title: 'Guild Assignment',
            description:
              'Screenshots are automatically assigned to your selected guild. If you belong to multiple guilds, you can filter by guild using the dropdown above.'
          },
          {
            icon: '🤖',
            title: 'Automatic Processing',
            description:
              'After upload, our system automatically extracts text from your screenshot using OCR technology. This text is searchable and helps you find information quickly.'
          },
          {
            icon: '👥',
            title: 'Share with Guild',
            description:
              'Once uploaded, your screenshot becomes visible to all members of the selected guild in the Gallery. Guild admins can also view and manage all uploads.'
          }
        ]}
      />

      {/* My Uploads */}
      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>My uploads</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>
            {localSelectedGuild
              ? `Screenshots for ${selectedGuild?.name ?? 'selected guild'}`
              : 'All screenshots you have uploaded appear here. Only you and guild admins can delete them.'}
          </p>
        </div>
        {filteredScreenshots.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              borderRadius: '1rem',
              border: '1px dashed rgba(148, 163, 184, 0.4)',
              background: '#0f172a'
            }}
          >
            {localSelectedGuild
              ? `No screenshots yet for ${selectedGuild?.name ?? 'this guild'}. Upload your first scout report above.`
              : 'No screenshots yet. Upload your first scout report above.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {filteredScreenshots.map((shot) => (
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
                  {shot.guild_id && (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {userGuilds.find((g) => g.id === shot.guild_id)?.name}
                    </div>
                  )}
                </div>
                {shot.signedUrl ? (
                  <Image
                    src={shot.signedUrl}
                    alt={shot.label ?? 'Screenshot upload'}
                    width={1200}
                    height={720}
                    sizes="(max-width: 768px) 100vw, 900px"
                    style={{
                      width: '100%',
                      height: 'auto',
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

