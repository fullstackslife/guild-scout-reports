"use server";

import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type GameActionState = {
  error?: string;
  success?: string;
};

type AdminProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'role' | 'active'>;

async function ensureAdmin(): Promise<{ ok: true; userId: string } | { error: string }> {
  const supabase = createSupabaseServerActionClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'You must be signed in to manage games.' };
  }

  const { data: rawProfile, error } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Admin role lookup failed', error);
    return { error: 'Unable to verify permissions right now.' };
  }

  const profile = rawProfile as AdminProfile | null;
  if (!profile || !profile.active || profile.role !== 'admin') {
    return { error: 'Admin permissions are required.' };
  }

  return { ok: true, userId: session.user.id };
}

export async function updateGame(
  _prevState: GameActionState,
  formData: FormData
): Promise<GameActionState> {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) {
    return { error: adminCheck.error };
  }

  const gameId = (formData.get('game_id') as string | null)?.trim() ?? '';
  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() || null;
  const icon = (formData.get('icon') as string | null)?.trim() || null;
  const screenshotTypes = (formData.get('screenshot_types') as string | null)?.trim() || null;
  const usageGuide = (formData.get('usage_guide') as string | null)?.trim() || null;
  const comingSoon = formData.get('coming_soon') === 'on';
  const displayOrderInput = (formData.get('display_order') as string | null)?.trim();
  const displayOrder = displayOrderInput ? parseInt(displayOrderInput, 10) : 0;

  if (!gameId || !name) {
    return { error: 'Game ID and name are required.' };
  }

  const admin = createSupabaseAdminClient();

  const gameUpdate: Database['public']['Tables']['games']['Update'] = {
    name,
    description,
    icon,
    screenshot_types: screenshotTypes,
    usage_guide: usageGuide,
    coming_soon: comingSoon,
    display_order: displayOrder
  };

  const { error: updateError } = await admin
    .from('games')
    .update(gameUpdate as never)
    .eq('id', gameId);

  if (updateError) {
    console.error('Game update failed', updateError);
    return { error: 'Unable to update game. Please try again.' };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { success: `Game "${name}" updated successfully.` };
}

