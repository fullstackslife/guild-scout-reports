"use server";

import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generatePromoCode } from '@/lib/promo-code-utils';

export type GuildActionState = {
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
    return { error: 'You must be signed in to manage guilds.' };
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

export async function createGuild(
  _prevState: GuildActionState,
  formData: FormData
): Promise<GuildActionState> {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) {
    return { error: adminCheck.error };
  }

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const gameId = (formData.get('game_id') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() || null;

  if (!name || !gameId) {
    return { error: 'Guild name and game are required.' };
  }

  const admin = createSupabaseAdminClient();

  // Get game name
  const { data: game, error: gameError } = await admin
    .from('games')
    .select('name')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return { error: 'Invalid game selected.' };
  }

  // Generate a unique promo code
  let promoCode = generatePromoCode(game.name, name);
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure promo code is unique
  while (attempts < maxAttempts) {
    const { data: existing } = await admin
      .from('guilds')
      .select('id')
      .eq('promo_code', promoCode)
      .single();

    if (!existing) {
      break;
    }

    // Generate a new promo code if collision
    promoCode = generatePromoCode(game.name, name);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return { error: 'Unable to generate unique promo code. Please try again.' };
  }

  const guildInsert: Database['public']['Tables']['guilds']['Insert'] = {
    name,
    game: game.name,
    game_id: gameId,
    description,
    promo_code: promoCode
  };

  const { error: insertError } = await admin
    .from('guilds')
    .insert(guildInsert);

  if (insertError) {
    console.error('Guild creation failed', insertError);
    return { error: 'Unable to create guild. Please try again.' };
  }

  revalidatePath('/admin/guilds');
  return { success: `Guild "${name}" created successfully with promo code: ${promoCode}` };
}

export async function updateGuild(
  _prevState: GuildActionState,
  formData: FormData
): Promise<GuildActionState> {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) {
    return { error: adminCheck.error };
  }

  const guildId = (formData.get('guild_id') as string | null)?.trim() ?? '';
  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const gameId = (formData.get('game_id') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() || null;

  if (!guildId || !name || !gameId) {
    return { error: 'Guild ID, name, and game are required.' };
  }

  const admin = createSupabaseAdminClient();

  // Get game name
  const { data: game, error: gameError } = await admin
    .from('games')
    .select('name')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return { error: 'Invalid game selected.' };
  }

  const guildUpdate: Database['public']['Tables']['guilds']['Update'] = {
    name,
    game: game.name,
    game_id: gameId,
    description
  };

  const { error: updateError } = await admin
    .from('guilds')
    .update(guildUpdate as never)
    .eq('id', guildId);

  if (updateError) {
    console.error('Guild update failed', updateError);
    return { error: 'Unable to update guild. Please try again.' };
  }

  revalidatePath('/admin/guilds');
  return { success: `Guild "${name}" updated successfully.` };
}

export async function deleteGuild(
  _prevState: GuildActionState,
  formData: FormData
): Promise<GuildActionState> {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) {
    return { error: adminCheck.error };
  }

  const guildId = (formData.get('guild_id') as string | null)?.trim() ?? '';

  if (!guildId) {
    return { error: 'Guild ID is required.' };
  }

  const admin = createSupabaseAdminClient();

  // Get guild name for confirmation message
  const { data: guild } = await admin
    .from('guilds')
    .select('name')
    .eq('id', guildId)
    .single();

  const { error: deleteError } = await admin.from('guilds').delete().eq('id', guildId);

  if (deleteError) {
    console.error('Guild deletion failed', deleteError);
    return { error: 'Unable to delete guild. Please try again.' };
  }

  revalidatePath('/admin/guilds');
  return { success: `Guild "${guild?.name ?? 'Unknown'}" deleted successfully.` };
}

