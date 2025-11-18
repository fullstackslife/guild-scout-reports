import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export default async function AdminLayout({
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

  const { data: rawProfile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Failed to load admin profile', error);
    redirect('/dashboard');
  }

  const profile = rawProfile as Pick<Database['public']['Tables']['profiles']['Row'], 'role'> | null;

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
