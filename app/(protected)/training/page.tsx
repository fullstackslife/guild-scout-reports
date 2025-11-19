import type { Metadata } from 'next';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { TrainingClient } from '@/components/training/training-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Navigation Training | Warbot.app'
};

export default async function TrainingPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return (
    <div>
      <TrainingClient deviceId="127.0.0.1:5555" />
    </div>
  );
}

