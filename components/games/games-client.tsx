"use client";

import { InfoSection } from '@/components/info-section';
import type { Database } from '@/lib/supabase/database.types';

type GameRow = Database['public']['Tables']['games']['Row'];

type GamesClientProps = {
  games: GameRow[];
};

export function GamesClient({ games }: GamesClientProps) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Games</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
          Learn about each game, what types of screenshots are needed, and how scout reports are used.
        </p>
      </section>

      {/* General Information */}
      <InfoSection
        title="About Scout Reports"
        icon="📋"
        items={[
          {
            icon: '🎯',
            title: 'Purpose',
            description:
              'Scout reports help guilds coordinate strategies, track enemy movements, analyze game mechanics, and share important information. Each game has specific types of screenshots that are most valuable.'
          },
          {
            icon: '📸',
            title: 'What to Capture',
            description:
              'Focus on screenshots that contain actionable information: enemy formations, resource locations, battle results, character stats, or strategic information that helps your guild make decisions.'
          },
          {
            icon: '🔍',
            title: 'Text Extraction',
            description:
              'Our system automatically extracts text from screenshots, making it easy to search for specific information later. This is especially useful for finding specific players, coordinates, or game data.'
          },
          {
            icon: '👥',
            title: 'Guild Collaboration',
            description:
              'All screenshots are shared with your guild members in the Gallery. This creates a centralized knowledge base that helps coordinate strategies and track important game information.'
          }
        ]}
      />

      {/* Games List */}
      {games.length === 0 ? (
        <div
          style={{
            padding: '3rem 2rem',
            borderRadius: '1rem',
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            textAlign: 'center'
          }}
        >
          <p style={{ color: '#94a3b8' }}>No games available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ game }: { game: GameRow }) {
  return (
    <section
      style={{
        padding: '2rem',
        borderRadius: '1rem',
        border: game.coming_soon
          ? '1px solid rgba(148, 163, 184, 0.3)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        background: game.coming_soon ? '#0f172a' : '#111827',
        opacity: game.coming_soon ? 0.7 : 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        {game.icon && <span style={{ fontSize: '2rem' }}>{game.icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#e2e8f0' }}>{game.name}</h2>
            {game.coming_soon && (
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Coming Soon
              </span>
            )}
          </div>
          {game.description && (
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>{game.description}</p>
          )}
        </div>
      </div>

      {game.coming_soon ? (
        <div
          style={{
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>
            This game is coming soon. Screenshot requirements and usage information will be available when the game is activated.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Screenshot Types */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              background: 'rgba(56, 189, 248, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📸</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600 }}>
                Types of Screenshots Needed
              </h3>
            </div>
            {game.screenshot_types ? (
              <div
                style={{
                  color: '#cbd5f5',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {game.screenshot_types}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Information about screenshot types for this game will be added soon.
              </div>
            )}
          </div>

          {/* Usage Guide */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              background: 'rgba(52, 211, 153, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#34d399', fontWeight: 600 }}>
                How Screenshots Are Used
              </h3>
            </div>
            {game.usage_guide ? (
              <div
                style={{
                  color: '#cbd5f5',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {game.usage_guide}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Information about how screenshots are used for this game will be added soon.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

