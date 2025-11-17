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
    <SessionContextProvider supabaseClient={supabase} initialSession={session}>
      {children}
    </SessionContextProvider>
  );
}
