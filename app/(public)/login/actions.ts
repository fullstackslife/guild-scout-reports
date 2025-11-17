"use server";

import { redirect } from 'next/navigation';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isPhoneIdentifier, normalizeEmail } from '@/lib/validators';

export type LoginState = {
  error?: string;
};

export async function loginWithPassword(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = (formData.get('identifier') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!identifier || !password) {
    return { error: 'Identifier and password are required.' };
  }

  const supabase = createSupabaseServerActionClient();

  try {
    const adminClient = createSupabaseAdminClient();

    if (isPhoneIdentifier(identifier)) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('active')
        .eq('phone', identifier)
        .maybeSingle();

      if (!profile) {
        return { error: 'Account not found.' };
      }

      if (!profile.active) {
        return { error: 'Account is inactive.' };
      }

      const { error } = await supabase.auth.signInWithPassword({
        phone: identifier,
        password
      });

      if (error) {
        return { error: 'Invalid credentials.' };
      }
    } else {
      let email = identifier;

      if (identifier.includes('@')) {
        email = normalizeEmail(identifier);
      } else {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('email, active')
          .eq('username', identifier)
          .maybeSingle();

        if (!profile) {
          return { error: 'Account not found.' };
        }

        if (!profile.active) {
          return { error: 'Account is inactive.' };
        }

        email = normalizeEmail(profile.email);
      }

      const { data: profile } = await adminClient
        .from('profiles')
        .select('active')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        return { error: 'Account not found.' };
      }

      if (!profile.active) {
        return { error: 'Account is inactive.' };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: 'Invalid credentials.' };
      }
    }
  } catch (error) {
    console.error('Login error', error);
    return { error: 'Unable to sign in right now.' };
  }

  redirect('/dashboard');
  return {};
}
