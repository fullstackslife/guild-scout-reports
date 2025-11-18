import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { UserManagementClient } from './user-management-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manage users | Warbot.app'
};

export default async function AdminUsersPage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Failed to verify admin profile', profileError);
    redirect('/dashboard');
  }

  const profile = rawProfile as Pick<Database['public']['Tables']['profiles']['Row'], 'role'> | null;
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, display_name, username, phone, role, active, created_at, updated_at')
    .order('display_name', { ascending: true });

  if (usersError) {
    console.error('Failed to load users', usersError);
    return (
      <div style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(248, 113, 113, 0.4)', background: '#111827' }}>
        Unable to load user list right now.
      </div>
    );
  }

  // Get all guilds
  const { data: guilds, error: guildsError } = await supabase
    .from('guilds')
    .select('id, name, game')
    .order('name', { ascending: true });

  if (guildsError) {
    console.error('Failed to load guilds', guildsError);
  }

  // Get all guild memberships
  const { data: memberships, error: membershipsError } = await supabase
    .from('guild_members')
    .select('user_id, guild_id, role, guilds(id, name, game)')
    .order('joined_at', { ascending: false });

  if (membershipsError) {
    console.error('Failed to load guild memberships', membershipsError);
  }

  return (
    <UserManagementClient
      users={users ?? []}
      guilds={(guilds ?? []) as Array<{ id: string; name: string; game: string }>}
      memberships={(memberships ?? []) as Array<{
        user_id: string;
        guild_id: string;
        role: string;
        guilds: { id: string; name: string; game: string } | null;
      }>}
    />
  );
}
