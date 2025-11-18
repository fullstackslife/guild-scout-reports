import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { SignupForm } from './signup-form';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create account | Guild Scout Reports'
};

export default async function SignupPage() {
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
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Create your account</h1>
        <p style={{ margin: 0, color: '#94a3b8', textAlign: 'center', maxWidth: '420px' }}>
          Join to upload and share guild scouting screenshots.
        </p>
        <SignupForm />
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#38bdf8', textDecoration: 'none' }}>
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
