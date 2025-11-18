import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';
import { AppShell } from '@/components/app-shell';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children
}: {
  children: ReactNode;
}) {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Profile lookup error:', profileError);
    // If profile lookup fails, sign out and redirect to login
    await supabase.auth.signOut();
    redirect('/login?reason=profile_error');
  }

  const profile = rawProfile as Database['public']['Tables']['profiles']['Row'] | null;
  if (!profile || !profile.active) {
    console.error('Profile not found or inactive:', { 
      hasProfile: !!profile, 
      active: profile?.active,
      userId: session.user.id 
    });
    await supabase.auth.signOut();
    redirect('/login?reason=inactive');
  }

  return (
    <SupabaseProvider session={session}>
      <AppShell profile={profile}>{children}</AppShell>
    </SupabaseProvider>
  );
}
