"use server";

import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type SignupState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function signupWithEmail(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const displayName = (formData.get('display_name') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const passwordConfirm = (formData.get('password_confirm') as string | null) ?? '';
  const promoCode = (formData.get('promo_code') as string | null)?.trim().toUpperCase() ?? '';

  // Validation
  if (!email || !displayName || !password || !passwordConfirm || !promoCode) {
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

  // Validate promo code and get guild
  const { data: guild, error: guildError } = await adminClient
    .from('guilds')
    .select('id, name')
    .eq('promo_code', promoCode)
    .single();

  if (guildError || !guild) {
    return { error: 'Invalid promo code. Please check with your guild admin.' };
  }

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

    // Add user to the guild based on promo code
    try {
      const { error: guildMemberError } = await adminClient
        .from('guild_members')
        .insert({
          guild_id: guild.id,
          user_id: userId,
          role: 'member'
        });

      if (guildMemberError) {
        console.error('Guild member creation error:', guildMemberError);
        // Continue anyway - user is created, guild membership might already exist
      }
    } catch (error) {
      console.error('Guild member insert error:', error);
      // Continue anyway - user is created
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'Unable to create account right now.' };
  }

  // Return a message asking user to check email for confirmation
  return {
    success: true,
    message: `Account created for guild "${guild.name}"! Please check your email at ${email} for a confirmation link to complete your signup.`
  };
}
