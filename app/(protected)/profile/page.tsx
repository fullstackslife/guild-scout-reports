import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile | Warbot.app'
};

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type GuildRow = Database['public']['Tables']['guilds']['Row'];
type GuildMemberRow = Database['public']['Tables']['guild_members']['Row'];

export default async function ProfilePage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Failed to load profile', profileError);
  }

  const userProfile = profile as ProfileRow | null;

  // Get user's guild memberships
  const { data: guildMemberships, error: guildError } = await supabase
    .from('guild_members')
    .select('guild_id, role, joined_at')
    .eq('user_id', session.user.id);

  if (guildError) {
    console.error('Failed to load guild memberships', guildError);
  }

  const memberships = (guildMemberships as GuildMemberRow[] | null) ?? [];

  // Get guild details for each membership
  const guildDetails: Array<GuildRow & { role: string; joined_at: string }> = [];
  if (memberships.length > 0) {
    const guildIds = memberships.map(m => m.guild_id);
    const { data: guilds, error: guildsError } = await supabase
      .from('guilds')
      .select('*')
      .in('id', guildIds);

    if (guildsError) {
      console.error('Failed to load guilds', guildsError);
    } else if (guilds) {
      const guildsList = guilds as GuildRow[];
      for (const membership of memberships) {
        const guild = guildsList.find(g => g.id === membership.guild_id);
        if (guild) {
          guildDetails.push({
            ...guild,
            role: membership.role,
            joined_at: membership.joined_at
          });
        }
      }
    }
  }

  // Get screenshot count
  const { count: screenshotCount } = await supabase
    .from('screenshots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);

  // Get all available games
  // Note: games table type will be available after running migration and regenerating types
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('name', { ascending: true });

  if (gamesError) {
    console.error('Failed to load games', gamesError);
  }

  type GameData = {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    created_at: string;
    updated_at: string;
  };

  const availableGames = (games as GameData[] | null) ?? [];

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>My Profile</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
          View and manage your account information, guild memberships, and game preferences.
        </p>
      </section>

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
              {userProfile?.display_name ?? 'Not set'}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Email
            </label>
            <div style={{ color: '#e2e8f0' }}>{session.user.email ?? 'Not set'}</div>
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
                background: userProfile?.role === 'admin' ? '#38bdf8' : '#475569',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {userProfile?.role ?? 'member'}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Screenshots Uploaded
            </label>
            <div style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 500 }}>
              {screenshotCount ?? 0}
            </div>
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
        {guildDetails.length === 0 ? (
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
            {guildDetails.map((guild) => (
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
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#e2e8f0' }}>
                  {game.name}
                </h3>
                {game.description && (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                    {game.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

