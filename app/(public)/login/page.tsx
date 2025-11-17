import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoginForm } from './login-form';
import type { Database } from '@/lib/supabase/database.types';

export const metadata: Metadata = {
  title: 'Sign in | Guild Scout Reports'
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
      </div>
    </div>
  );
}
