"use client";

import { Session, SessionContextProvider } from '@supabase/auth-helpers-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMemo } from 'react';

export function SupabaseProvider({
  children,
  session
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <SessionContextProvider supabaseClient={supabase as any} initialSession={session}>
      {children}
    </SessionContextProvider>
  );
}
