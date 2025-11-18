import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  redirect('/login');
}
