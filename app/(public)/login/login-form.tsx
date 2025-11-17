"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { loginWithPassword, type LoginState } from './actions';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction] = useFormState(loginWithPassword, initialState);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (reason === 'inactive') {
      router.replace('/login');
    }
  }, [reason, router]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}
    >
      <form
        action={formAction}
        style={{
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
          <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5f5' }} htmlFor="identifier">
            Email, username, or phone
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="guildmate@example.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#0f172a',
              color: '#e2e8f0'
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
            autoComplete="current-password"
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#0f172a',
              color: '#e2e8f0'
            }}
          />
        </div>
        {state.error ? (
          <div style={{ color: '#f87171', fontSize: '0.95rem' }}>{state.error}</div>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: '#38bdf8',
            color: '#0f172a',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            const origin = window.location.origin;
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${origin}/auth/callback`
              }
            });
          })
        }
        disabled={isPending}
        style={{
          padding: '0.75rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          background: '#111827',
          color: '#e2e8f0',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        {isPending ? 'Redirecting…' : 'Continue with Google'}
      </button>
    </div>
  );
}
