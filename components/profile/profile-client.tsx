"use client";

import { InfoSection } from '@/components/info-section';
import type { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];

type GuildWithMembership = GuildRow & {
  role: string;
  joined_at: string;
};

type GameData = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileClientProps = {
  profile: ProfileRow | null;
  userEmail: string | undefined;
  guildMemberships: GuildWithMembership[];
  screenshotCount: number;
  availableGames: GameData[];
};

export function ProfileClient({
  profile,
  userEmail,
  guildMemberships,
  screenshotCount,
  availableGames
}: ProfileClientProps) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>My Profile</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
          View and manage your account information, guild memberships, and game preferences.
        </p>
      </section>

      {/* Profile Information Guide */}
      <InfoSection
        title="About Your Profile"
        icon="👤"
        items={[
          {
            icon: '🔐',
            title: 'Account Security',
            description:
              'Your profile information is securely stored and only visible to you and system administrators. Your email is used for authentication and account recovery.'
          },
          {
            icon: '👥',
            title: 'Guild Memberships',
            description:
              'You can be a member of multiple guilds. Each guild membership shows your role (member, admin, or owner) and when you joined. Contact an administrator to join additional guilds.'
          },
          {
            icon: '📊',
            title: 'Activity Tracking',
            description:
              'Your profile shows how many screenshots you have uploaded across all guilds. This helps track your contributions to the guild scout report system.'
          },
          {
            icon: '🎮',
            title: 'Game Preferences',
            description:
              'The available games section shows all games supported by the platform. Guilds are organized by game, making it easy to find relevant scout reports.'
          }
        ]}
      />

      {/* Profile Information */}
      <section
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Account Information</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Display Name
            </label>
            <div style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 500 }}>
              {profile?.display_name ?? 'Not set'}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Email
            </label>
            <div style={{ color: '#e2e8f0' }}>{userEmail ?? 'Not set'}</div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Role
            </label>
            <div
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.5rem',
                background: profile?.role === 'admin' ? '#38bdf8' : '#475569',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {profile?.role ?? 'member'}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Screenshots Uploaded
            </label>
            <div style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 500 }}>{screenshotCount}</div>
          </div>
        </div>
      </section>

      {/* Guild Memberships */}
      <section
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Guild Memberships</h2>
        {guildMemberships.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px dashed rgba(148, 163, 184, 0.4)',
              background: '#0f172a',
              textAlign: 'center'
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8' }}>
              You are not a member of any guilds yet. Contact an administrator to be added to a guild.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {guildMemberships.map((guild) => (
              <div
                key={guild.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: '#0f172a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#e2e8f0' }}>{guild.name}</h3>
                    <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                      {guild.description ?? 'No description'}
                    </p>
                  </div>
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
                    {guild.game}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Role: </span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        background: guild.role === 'admin' || guild.role === 'owner' ? '#38bdf8' : '#475569',
                        color: '#0f172a',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      {guild.role}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      Joined: {new Date(guild.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Games */}
      <section
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Available Games</h2>
        {availableGames.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px dashed rgba(148, 163, 184, 0.4)',
              background: '#0f172a',
              textAlign: 'center'
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8' }}>No games available yet.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            {availableGames.map((game) => (
              <div
                key={game.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: '#0f172a'
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#e2e8f0' }}>{game.name}</h3>
                {game.description && (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>{game.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

