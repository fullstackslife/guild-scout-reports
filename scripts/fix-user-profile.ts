/**
 * Script to fix user profile issues
 * 
 * This script checks if a user exists in auth.users but doesn't have a profile,
 * or if the profile is inactive, and fixes it.
 * 
 * Usage: npx tsx scripts/fix-user-profile.ts <email>
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserProfile(email: string) {
  console.log(`\n🔍 Checking user: ${email}\n`);

  // Normalize email (same as in the app)
  const normalizedEmail = email.toLowerCase().trim().replace(/\s+/g, '');

  // Check if user exists in auth.users
  const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Failed to list auth users:', authError);
    return;
  }

  const authUser = authUsers.users.find(u => u.email?.toLowerCase() === normalizedEmail);

  if (!authUser) {
    console.error(`❌ User not found in auth.users with email: ${email}`);
    console.log('\n💡 The user may need to be created first via the admin panel.');
    return;
  }

  console.log(`✅ Found user in auth.users:`);
  console.log(`   ID: ${authUser.id}`);
  console.log(`   Email: ${authUser.email}`);
  console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
  console.log(`   Created: ${authUser.created_at}`);

  // Check if profile exists
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Error checking profile:', profileError);
    return;
  }

  if (!profile) {
    console.log('\n⚠️  Profile does not exist! Creating profile...');
    
    const displayName = authUser.user_metadata?.display_name || 
                       authUser.email?.split('@')[0] || 
                       'User';
    const role = authUser.user_metadata?.role || 'member';
    const active = authUser.user_metadata?.active !== false; // Default to true

    const { data: newProfile, error: insertError } = await adminClient
      .from('profiles')
      .insert({
        id: authUser.id,
        email: normalizedEmail,
        display_name: displayName,
        username: authUser.user_metadata?.username || null,
        phone: authUser.user_metadata?.phone || null,
        role: role as 'admin' | 'member',
        active: active
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create profile:', insertError);
      return;
    }

    console.log('✅ Profile created successfully!');
    console.log(`   Display Name: ${newProfile.display_name}`);
    console.log(`   Role: ${newProfile.role}`);
    console.log(`   Active: ${newProfile.active}`);
  } else {
    console.log('\n✅ Profile exists:');
    console.log(`   Display Name: ${profile.display_name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Active: ${profile.active}`);

    // Check if profile needs fixing
    const needsFix = !profile.active || profile.email !== normalizedEmail;

    if (needsFix) {
      console.log('\n⚠️  Profile needs fixing. Updating...');
      
      const updates: Partial<typeof profile> = {};
      if (!profile.active) {
        updates.active = true;
        console.log('   → Setting active to true');
      }
      if (profile.email !== normalizedEmail) {
        updates.email = normalizedEmail;
        console.log(`   → Updating email to ${normalizedEmail}`);
      }

      const { data: updatedProfile, error: updateError } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update profile:', updateError);
        return;
      }

      console.log('✅ Profile updated successfully!');
      console.log(`   Active: ${updatedProfile.active}`);
      console.log(`   Email: ${updatedProfile.email}`);
    } else {
      console.log('\n✅ Profile is correct - no fixes needed!');
    }
  }

  // Ensure email is confirmed in auth
  if (!authUser.email_confirmed_at) {
    console.log('\n⚠️  Email is not confirmed. Confirming email...');
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(authUser.id, {
      email_confirm: true
    });

    if (confirmError) {
      console.error('❌ Failed to confirm email:', confirmError);
    } else {
      console.log('✅ Email confirmed!');
    }
  }

  console.log('\n✅ User account is ready for login!');
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('   Usage: npx tsx scripts/fix-user-profile.ts <email>');
  process.exit(1);
}

fixUserProfile(email)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });

