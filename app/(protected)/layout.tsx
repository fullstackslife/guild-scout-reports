import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    redirect('/login?reason=inactive');
  }

  return (
    <SupabaseProvider session={session}>
      <AppShell profile={profile}>{children}</AppShell>
    </SupabaseProvider>
  );
}
