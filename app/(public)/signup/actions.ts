"use server";

import { redirect } from 'next/navigation';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type SignupState = {
  error?: string;
  success?: boolean;
};

export async function signupWithEmail(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const displayName = (formData.get('display_name') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const passwordConfirm = (formData.get('password_confirm') as string | null) ?? '';

  // Validation
  if (!email || !displayName || !password || !passwordConfirm) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  if (password !== passwordConfirm) {
    return { error: 'Passwords do not match.' };
  }

  if (!email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  const adminClient = createSupabaseAdminClient();

  // Check if email already exists
  try {
    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some((u) => u.email === email);

    if (emailExists) {
      return { error: 'An account with this email already exists.' };
    }
  } catch (error) {
    console.error('Error checking existing users:', error);
    return { error: 'Unable to create account right now.' };
  }

  // Create user with auth and profile
  try {
    const { data, error: signupError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName
      }
    });

    if (signupError || !data.user) {
      console.error('Signup error:', signupError);
      if (signupError?.message?.includes('already exists')) {
        return { error: 'An account with this email already exists.' };
      }
      return { error: 'Unable to create account. Please try again.' };
    }

    // The trigger will create the profile automatically
    // But we can verify it was created
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected if trigger hasn't fired yet
      console.error('Profile check error:', profileError);
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'Unable to create account right now.' };
  }

  // Sign in the newly created user
  const supabase = createSupabaseServerActionClient();

  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Sign in after signup error:', signInError);
      // Account was created but sign in failed, redirect to login
      redirect('/login');
    }
  } catch (error) {
    console.error('Sign in error:', error);
    redirect('/login');
  }

  redirect('/dashboard');
  return { success: true };
}
