"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useTransition, type ReactNode } from 'react';
import { Database } from '@/lib/supabase/database.types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface AppShellProps {
  profile: Database['public']['Tables']['profiles']['Row'];
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'My Screenshots' },
  { href: '/gallery', label: 'Guild Gallery' },
  { href: '/games', label: 'Games' },
  { href: '/profile', label: 'Profile' }
];

export function AppShell({ profile, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace('/login');
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
          background: '#111827'
        }}
      >
        <div>
          <strong>Warbot.app</strong>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{profile.display_name}</div>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: pathname?.startsWith(item.href) ? '#38bdf8' : '#cbd5f5',
                fontWeight: pathname?.startsWith(item.href) ? 600 : 400
              }}
            >
              {item.label}
            </Link>
          ))}
          {profile.role === 'admin' ? (
            <>
              <Link
                href="/admin/users"
                style={{
                  color: pathname?.startsWith('/admin/users') ? '#38bdf8' : '#cbd5f5',
                  fontWeight: pathname?.startsWith('/admin/users') ? 600 : 400
                }}
              >
                Users
              </Link>
              <Link
                href="/admin/guilds"
                style={{
                  color: pathname?.startsWith('/admin/guilds') ? '#38bdf8' : '#cbd5f5',
                  fontWeight: pathname?.startsWith('/admin/guilds') ? 600 : 400
                }}
              >
                Guilds
              </Link>
              <Link
                href="/admin/games"
                style={{
                  color: pathname?.startsWith('/admin/games') ? '#38bdf8' : '#cbd5f5',
                  fontWeight: pathname?.startsWith('/admin/games') ? 600 : 400
                }}
              >
                Games
              </Link>
            </>
          ) : null}
          <button
            onClick={handleSignOut}
            disabled={isPending}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              border: '1px solid #38bdf8',
              background: '#0f172a',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            {isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
}
