"use server";

import { revalidatePath } from 'next/cache';
import type { Database, Role } from '@/lib/supabase/database.types';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail } from '@/lib/validators';

export type UserActionState = {
  error?: string;
  success?: string;
};

type AdminProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'role' | 'active'>;

async function ensureAdmin(): Promise<{ ok: true } | { error: string }> {
  const supabase = createSupabaseServerActionClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'You must be signed in to manage users.' };
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

  return { ok: true };
}

function coerceRole(value: FormDataEntryValue | null): Role {
  return value === 'admin' ? 'admin' : 'member';
}

function coerceBoolean(value: FormDataEntryValue | null): boolean {
  if (typeof value === 'string') {
    return value === 'true' || value === 'on';
  }
  return Boolean(value);
}

export async function createGuildUser(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) {
    return { error: adminCheck.error };
  }

  const displayName = (formData.get('display_name') as string | null)?.trim() ?? '';
  const emailInput = (formData.get('email') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null)?.trim() ?? '';
  const username = (formData.get('username') as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() ?? '';
  const role = coerceRole(formData.get('role'));
  const active = coerceBoolean(formData.get('active'));

  if (!displayName) {
    return { error: 'Display name is required.' };
  }

  if (!emailInput) {
    return { error: 'Email is required.' };
  }

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const email = normalizeEmail(emailInput);

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (error) {
    console.error('Admin client unavailable', error);
    return { error: 'Service role configuration is missing.' };
  }

  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone: phone || undefined,
    user_metadata: {
      display_name: displayName,
      username: username || null,
      phone: phone || null,
      role,
      active
    }
  });

  if (error) {
    console.error('Create user failed', error);
    return { error: error.message ?? 'Unable to create user.' };
  }

  revalidatePath('/admin/users');
  return { success: `Created account for ${displayName}.` };
}

export async function updateGuildUser(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const adminCheck = await ensureAdmin();
  if ('error' in adminCheck) {
    return { error: adminCheck.error };
  }

  const userId = (formData.get('user_id') as string | null)?.trim() ?? '';
  if (!userId) {
    return { error: 'Missing user identifier.' };
  }

  const displayName = (formData.get('display_name') as string | null)?.trim() ?? '';
  const emailInput = (formData.get('email') as string | null)?.trim() ?? '';
  const username = (formData.get('username') as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() ?? '';
  const role = coerceRole(formData.get('role'));
  const active = coerceBoolean(formData.get('active'));
  const newPassword = (formData.get('new_password') as string | null)?.trim() ?? '';

  if (!displayName) {
    return { error: 'Display name is required.' };
  }

  if (!emailInput) {
    return { error: 'Email is required.' };
  }

  if (newPassword && newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' };
  }

  const email = normalizeEmail(emailInput);

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (error) {
    console.error('Admin client unavailable', error);
    return { error: 'Service role configuration is missing.' };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    email,
    password: newPassword || undefined,
    phone: phone || undefined,
    user_metadata: {
      display_name: displayName,
      username: username || null,
      phone: phone || null,
      role,
      active
    }
  });

  if (updateError) {
    console.error('Update user failed', updateError);
    return { error: updateError.message ?? 'Unable to update user.' };
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      display_name: displayName,
      email,
      username: username || null,
      phone: phone || null,
      role,
      active
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Profile sync failed', profileError);
    return { error: 'User updated, but syncing profile failed.' };
  }

  revalidatePath('/admin/users');
  return { success: `Updated ${displayName}.` };
}
