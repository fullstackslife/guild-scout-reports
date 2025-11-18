import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoginForm } from './login-form';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in | Warbot.app'
};

export default async function LoginPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Welcome back</h1>
        <p style={{ margin: 0, color: '#94a3b8', textAlign: 'center', maxWidth: '420px' }}>
          Sign in to access guild scouting reports and upload your latest screenshots.
        </p>
        <LoginForm />
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <a href="/signup" style={{ color: '#38bdf8', textDecoration: 'none' }}>
            Create one here
          </a>
        </p>
      </div>
    </div>
  );
}
