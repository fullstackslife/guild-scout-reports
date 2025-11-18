"use client";

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useFormState } from 'react-dom';
import type { Database } from '@/lib/supabase/database.types';
import { createGuildUser, updateGuildUser, type UserActionState } from './actions';

const initialState: UserActionState = {};

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type UserManagementProps = {
  users: ProfileRow[];
};

const formSectionStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: '#111827'
};

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ fontWeight: 600, color: '#cbd5f5' }}>
      {children}
    </label>
  );
}

export function UserManagementClient({ users }: UserManagementProps) {
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [users]);

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section style={{ display: 'grid', gap: '1rem' }}>
        <header>
          <h1 style={{ margin: 0 }}>User management</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>
            Create new guild accounts and update existing members. Password changes apply immediately.
          </p>
        </header>
        <CreateUserForm />
      </section>

      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <header>
          <h2 style={{ margin: 0 }}>Existing members</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>
            Updates revalidate automatically. Leave optional fields blank if they are not needed.
          </p>
        </header>
        {sortedUsers.length === 0 ? (
          <div style={formSectionStyle}>No users found yet. Add new accounts above.</div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {sortedUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CreateUserForm() {
  const [state, formAction] = useFormState(createGuildUser, initialState);

  return (
    <form action={formAction} style={formSectionStyle}>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <FieldLabel htmlFor="display_name">Display name</FieldLabel>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          placeholder="RogueOne"
          autoComplete="off"
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="guildmate@example.com"
          autoComplete="off"
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <FieldLabel htmlFor="username">Username (optional)</FieldLabel>
        <input id="username" name="username" type="text" placeholder="rogue" autoComplete="off" style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
        <input id="phone" name="phone" type="tel" placeholder="+15551234567" autoComplete="off" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <FieldLabel htmlFor="role">Role</FieldLabel>
          <select id="role" name="role" defaultValue="member" style={selectStyle}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.9rem' }}>
          <input id="active" name="active" type="checkbox" defaultChecked style={{ width: '1.1rem', height: '1.1rem' }} />
          <label htmlFor="active" style={{ color: '#cbd5f5' }}>
            Active
          </label>
        </div>
      </div>
      {state.error ? <FormMessage tone="error" message={state.error} /> : null}
      {state.success ? <FormMessage tone="success" message={state.success} /> : null}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={primaryButtonStyle}>
          Create account
        </button>
      </div>
    </form>
  );
}

function UserCard({ user }: { user: ProfileRow }) {
  const [state, formAction] = useFormState(updateGuildUser, initialState);

  return (
    <form action={formAction} style={formSectionStyle}>
      <input type="hidden" name="user_id" value={user.id} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <strong>{user.display_name}</strong>
        <span style={{ color: user.active ? '#34d399' : '#f87171', fontSize: '0.9rem' }}>{user.active ? 'Active' : 'Inactive'}</span>
      </div>
      <div style={gridTwoColumn}>
        <FieldBlock id="display_name" label="Display name" defaultValue={user.display_name} required />
        <FieldBlock id="email" label="Email" defaultValue={user.email} type="email" required />
        <FieldBlock id="username" label="Username" defaultValue={user.username ?? ''} placeholder="Optional" />
        <FieldBlock id="phone" label="Phone" defaultValue={user.phone ?? ''} type="tel" placeholder="Optional" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <FieldLabel htmlFor={`role-${user.id}`}>Role</FieldLabel>
          <select id={`role-${user.id}`} name="role" defaultValue={user.role} style={selectStyle}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.9rem' }}>
          <input
            id={`active-${user.id}`}
            name="active"
            type="checkbox"
            defaultChecked={user.active}
            style={{ width: '1.1rem', height: '1.1rem' }}
          />
          <label htmlFor={`active-${user.id}`} style={{ color: '#cbd5f5' }}>
            Active
          </label>
        </div>
        <div style={{ display: 'grid', gap: '0.4rem', flex: '1 1 240px' }}>
          <FieldLabel htmlFor={`new_password-${user.id}`}>Set new password (optional)</FieldLabel>
          <input
            id={`new_password-${user.id}`}
            name="new_password"
            type="password"
            minLength={8}
            placeholder="Leave blank to keep current"
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>
      </div>
      {state.error ? <FormMessage tone="error" message={state.error} /> : null}
      {state.success ? <FormMessage tone="success" message={state.success} /> : null}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="submit" style={primaryButtonStyle}>
          Save changes
        </button>
      </div>
      <footer style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
        Last updated {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(user.updated_at))}
      </footer>
    </form>
  );
}

function FieldBlock({
  id,
  label,
  defaultValue,
  type = 'text',
  placeholder,
  required
}: {
  id: string;
  label: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        style={inputStyle}
      />
    </div>
  );
}

function FormMessage({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  return (
    <div
      style={{
        padding: '0.75rem',
        borderRadius: '0.75rem',
        background: tone === 'error' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
        color: tone === 'error' ? '#f87171' : '#34d399'
      }}
    >
      {message}
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: '0.6rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(148, 163, 184, 0.4)',
  background: '#0f172a',
  color: '#e2e8f0'
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  paddingRight: '2rem'
};

const primaryButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '0.75rem',
  border: 'none',
  background: '#38bdf8',
  color: '#0f172a',
  fontWeight: 600,
  cursor: 'pointer'
};

const gridTwoColumn: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};
