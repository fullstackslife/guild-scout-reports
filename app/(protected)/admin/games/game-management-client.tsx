"use client";

import React, { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { updateGame } from './actions';
import { InfoSection } from '@/components/info-section';
import type { Database } from '@/lib/supabase/database.types';

type Game = Database['public']['Tables']['games']['Row'];

type GameManagementClientProps = {
  games: Game[];
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  borderRadius: '0.5rem',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: '#0f172a',
  color: '#e2e8f0',
  fontSize: '0.95rem'
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '120px',
  resize: 'vertical',
  fontFamily: 'inherit'
};

const buttonStyle: React.CSSProperties = {
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  background: '#38bdf8',
  color: '#0f172a',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.95rem'
};

export function GameManagementClient({ games }: GameManagementClientProps) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Game Management</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
          Manage game information, screenshot requirements, and usage guides for each game.
        </p>
      </section>

      {/* Game Management Guide */}
      <InfoSection
        title="Game Management Guide"
        icon="🎮"
        items={[
          {
            icon: '📸',
            title: 'Screenshot Types',
            description:
              'Define what types of screenshots are most valuable for each game. This helps guild members understand what to capture, such as enemy formations, resource locations, battle results, or strategic information.'
          },
          {
            icon: '📊',
            title: 'Usage Guide',
            description:
              'Explain how screenshots are used for each game. This helps members understand the purpose and value of their contributions, such as coordinating strategies, tracking enemies, or analyzing game mechanics.'
          },
          {
            icon: '👥',
            title: 'Guild Alignment',
            description:
              'Games are linked to guilds, and this information appears in the Games page for all users. Keep content clear and actionable to help guild members contribute effectively.'
          }
        ]}
      />

      {/* Existing Games */}
      <section
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Games</h2>
        {games.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px dashed rgba(148, 163, 184, 0.4)',
              background: '#0f172a',
              textAlign: 'center'
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8' }}>No games found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {games.map((game) => (
              <GameItem key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GameItem({ game }: { game: Game }) {
  const [updateState, updateAction] = useFormState(updateGame, {});
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [isEditing, setIsEditing] = React.useState(false);

  const handleUpdateSubmit = (formData: FormData) => {
    startUpdateTransition(() => {
      updateAction(formData);
    });
  };

  if (isEditing) {
    return (
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#0f172a'
        }}
      >
        <form action={handleUpdateSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <input type="hidden" name="game_id" value={game.id} />
          <div>
            <label
              htmlFor={`name-${game.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Game Name
            </label>
            <input
              id={`name-${game.id}`}
              name="name"
              type="text"
              required
              defaultValue={game.name}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor={`description-${game.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Description
            </label>
            <input
              id={`description-${game.id}`}
              name="description"
              type="text"
              defaultValue={game.description ?? ''}
              placeholder="Brief game description"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor={`icon-${game.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Icon (emoji)
            </label>
            <input
              id={`icon-${game.id}`}
              name="icon"
              type="text"
              defaultValue={game.icon ?? ''}
              placeholder="🎮"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id={`coming_soon-${game.id}`}
                name="coming_soon"
                type="checkbox"
                defaultChecked={game.coming_soon}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              <label htmlFor={`coming_soon-${game.id}`} style={{ color: '#cbd5f5', fontSize: '0.9rem' }}>
                Coming Soon
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor={`display_order-${game.id}`}
                style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500, fontSize: '0.9rem' }}
              >
                Display Order (lower = first)
              </label>
              <input
                id={`display_order-${game.id}`}
                name="display_order"
                type="number"
                defaultValue={game.display_order ?? 0}
                style={{ ...inputStyle, width: '100px' }}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor={`screenshot_types-${game.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Screenshot Types Needed
            </label>
            <textarea
              id={`screenshot_types-${game.id}`}
              name="screenshot_types"
              rows={6}
              defaultValue={game.screenshot_types ?? ''}
              placeholder="Describe what types of screenshots are needed for this game. For example: enemy formations, resource locations, battle results, character stats, etc."
              style={textareaStyle}
            />
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              This information appears in the Games page to help users understand what to capture.
            </p>
          </div>
          <div>
            <label
              htmlFor={`usage_guide-${game.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              How Screenshots Are Used
            </label>
            <textarea
              id={`usage_guide-${game.id}`}
              name="usage_guide"
              rows={6}
              defaultValue={game.usage_guide ?? ''}
              placeholder="Explain how screenshots are used for this game. For example: coordinating strategies, tracking enemy movements, analyzing game mechanics, etc."
              style={textareaStyle}
            />
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              This helps users understand the purpose and value of their screenshot contributions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={isUpdatePending} style={buttonStyle}>
              {isUpdatePending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ ...buttonStyle, background: '#475569' }}
            >
              Cancel
            </button>
          </div>
          {updateState.error && (
            <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{updateState.error}</div>
          )}
          {updateState.success && (
            <div style={{ color: '#34d399', fontSize: '0.9rem' }}>{updateState.success}</div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1.25rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: '#0f172a'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {game.icon && <span style={{ fontSize: '1.5rem' }}>{game.icon}</span>}
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#e2e8f0' }}>{game.name}</h3>
          </div>
          {game.description && (
            <p style={{ margin: '0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>{game.description}</p>
          )}
          {game.coming_soon && (
            <span
              style={{
                display: 'inline-block',
                marginTop: '0.5rem',
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
          {game.screenshot_types && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', background: '#111827', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                📸 Screenshot Types
              </div>
              <div style={{ color: '#cbd5f5', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {game.screenshot_types}
              </div>
            </div>
          )}
          {game.usage_guide && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', background: '#111827', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
              <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                📊 Usage Guide
              </div>
              <div style={{ color: '#cbd5f5', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {game.usage_guide}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          style={{ ...buttonStyle, background: '#475569', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

