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

  const supabase = createSupabaseServerActionClient();
  const adminClient = createSupabaseAdminClient();

  // Sign up the user
  let userId: string | undefined;
  try {
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signupError) {
      console.error('Signup error:', signupError);
      if (signupError.message?.includes('already exists')) {
        return { error: 'An account with this email already exists.' };
      }
      return { error: signupError.message || 'Unable to create account. Please try again.' };
    }

    if (!data.user) {
      return { error: 'Unable to create account. Please try again.' };
    }

    userId = data.user.id;

    // Auto-confirm email using the Edge Function
    try {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (projectUrl && anonKey) {
        const response = await fetch(`${projectUrl}/functions/v1/auto-confirm-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            user_id: userId,
            email: email,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          console.error('Email confirmation failed:', result.error);
          // Continue anyway - user is created, might just need email confirmation
        }
      }
    } catch (error) {
      console.error('Email confirmation Edge Function call error:', error);
      // Continue anyway - user is created
    }

    // Create the profile manually using admin client
    try {
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: userId,
          email: email || '',
          display_name: displayName,
          role: 'member',
          active: true
        });

      if (profileError && profileError.code !== 'PGRST200') {
        console.error('Profile creation error:', profileError);
        // Profile creation failed, but user was created - we'll continue
      }
    } catch (error) {
      console.error('Profile insert error:', error);
      // Continue anyway - user is created, profile might exist or might need manual creation
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'Unable to create account right now.' };
  }

  // Sign in the newly created user
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
