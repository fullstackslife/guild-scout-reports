"use client";

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { signupWithEmail, type SignupState } from './actions';

const initialState: SignupState = {};

export function SignupForm() {
  const [state, formAction] = useFormState(signupWithEmail, initialState);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={formAction}
      style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: '#111827',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(148, 163, 184, 0.2)'
      }}
    >
      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5' }} htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: '#0f172a',
            color: '#e2e8f0',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5' }} htmlFor="display_name">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          placeholder="Your name"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: '#0f172a',
            color: '#e2e8f0',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5' }} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: '#0f172a',
            color: '#e2e8f0',
            boxSizing: 'border-box'
          }}
        />
        <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          At least 8 characters
        </p>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5' }} htmlFor="password_confirm">
          Confirm password
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: '#0f172a',
            color: '#e2e8f0',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {state.error ? (
        <div style={{ color: '#f87171', fontSize: '0.95rem' }}>{state.error}</div>
      ) : null}

      {state.success && state.message ? (
        <div style={{ color: '#86efac', fontSize: '0.95rem' }}>
          {state.message}
        </div>
      ) : null}

      {state.success ? (
        <div style={{ color: '#86efac', fontSize: '0.95rem' }}>
          Once you confirm your email, you can log in.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || state.success}
        style={{
          padding: '0.75rem',
          borderRadius: '0.75rem',
          border: 'none',
          background: '#38bdf8',
          color: '#0f172a',
          fontWeight: 600,
          cursor: isPending || state.success ? 'not-allowed' : 'pointer',
          opacity: isPending || state.success ? 0.7 : 1
        }}
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
