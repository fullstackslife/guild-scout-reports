"use client";

import React, { useActionState } from 'react';
import {
  createGuild,
  updateGuild,
  deleteGuild
} from './actions';

type Guild = {
  id: string;
  name: string;
  game: string;
  game_id: string | null;
  description: string | null;
  promo_code: string | null;
  created_at: string;
  updated_at: string;
  memberCount: number;
};

type Game = {
  id: string;
  name: string;
  description: string | null;
};

interface GuildManagementClientProps {
  guilds: Guild[];
  games: Game[];
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  borderRadius: '0.5rem',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: '#0f172a',
  color: '#e2e8f0',
  fontSize: '0.95rem'
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
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

const deleteButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#ef4444',
  color: '#ffffff'
};

export function GuildManagementClient({ guilds, games }: GuildManagementClientProps) {
  const [createState, createAction, createPending] = useActionState(createGuild, {});

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Guild Management</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
          Create and manage guilds for different games. Assign users to guilds from the Users page.
        </p>
      </section>

      {/* Create New Guild */}
      <section
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Create New Guild</h2>
        <form action={createAction} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label
              htmlFor="name"
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Guild Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Phoenix Raiders"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="game_id"
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Game
            </label>
            <select id="game_id" name="game_id" required style={selectStyle}>
              <option value="">Select a game</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="description"
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Guild description..."
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={createPending} style={buttonStyle}>
            {createPending ? 'Creating...' : 'Create Guild'}
          </button>
          {createState.error && (
            <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{createState.error}</div>
          )}
          {createState.success && (
            <div style={{ color: '#34d399', fontSize: '0.9rem' }}>{createState.success}</div>
          )}
        </form>
      </section>

      {/* Existing Guilds */}
      <section
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Existing Guilds</h2>
        {guilds.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px dashed rgba(148, 163, 184, 0.4)',
              background: '#0f172a',
              textAlign: 'center'
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8' }}>No guilds yet. Create one above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {guilds.map((guild) => (
              <GuildItem
                key={guild.id}
                guild={guild}
                games={games}
                onUpdate={updateGuild}
                onDelete={deleteGuild}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GuildItem({
  guild,
  games,
  onUpdate,
  onDelete
}: {
  guild: Guild;
  games: Game[];
  onUpdate: typeof updateGuild;
  onDelete: typeof deleteGuild;
}) {
  const [updateState, updateAction, updatePending] = useActionState(onUpdate, {});
  const [deleteState, deleteAction, deletePending] = useActionState(onDelete, {});
  const [isEditing, setIsEditing] = React.useState(false);

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
        <form action={updateAction} style={{ display: 'grid', gap: '1rem' }}>
          <input type="hidden" name="guild_id" value={guild.id} />
          <div>
            <label
              htmlFor={`name-${guild.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Guild Name
            </label>
            <input
              id={`name-${guild.id}`}
              name="name"
              type="text"
              required
              defaultValue={guild.name}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor={`game_id-${guild.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Game
            </label>
            <select
              id={`game_id-${guild.id}`}
              name="game_id"
              required
              defaultValue={guild.game_id ?? ''}
              style={selectStyle}
            >
              <option value="">Select a game</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={`description-${guild.id}`}
              style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5', fontWeight: 500 }}
            >
              Description
            </label>
            <textarea
              id={`description-${guild.id}`}
              name="description"
              rows={3}
              defaultValue={guild.description ?? ''}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={updatePending} style={buttonStyle}>
              {updatePending ? 'Saving...' : 'Save'}
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

  const game = games.find((g) => g.id === guild.game_id);

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
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#e2e8f0' }}>{guild.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.5rem',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {game?.name ?? guild.game}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {guild.memberCount} member{guild.memberCount !== 1 ? 's' : ''}
            </span>
          </div>
          {guild.description && (
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>{guild.description}</p>
          )}
          {guild.promo_code && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Promo Code:</span>
              <code
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  background: '#1e293b',
                  color: '#38bdf8',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              >
                {guild.promo_code}
              </code>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsEditing(true)} style={{ ...buttonStyle, background: '#475569', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
            Edit
          </button>
          <form action={deleteAction} style={{ display: 'inline' }}>
            <input type="hidden" name="guild_id" value={guild.id} />
            <button
              type="submit"
              disabled={deletePending}
              style={{ ...deleteButtonStyle, padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
            >
              {deletePending ? 'Deleting...' : 'Delete'}
            </button>
          </form>
        </div>
      </div>
      {deleteState.error && (
        <div style={{ color: '#f87171', fontSize: '0.9rem', marginTop: '0.5rem' }}>{deleteState.error}</div>
      )}
      {deleteState.success && (
        <div style={{ color: '#34d399', fontSize: '0.9rem', marginTop: '0.5rem' }}>{deleteState.success}</div>
      )}
    </div>
  );
}

