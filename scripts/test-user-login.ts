/**
 * Script to test if a user can login and access protected routes
 * 
 * Usage: npx tsx scripts/test-user-login.ts <email>
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUserLogin(email: string) {
  console.log(`\n🔍 Testing login flow for: ${email}\n`);

  const normalizedEmail = email.toLowerCase().trim();

  // Step 1: Find user
  const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Failed to list users:', authError);
    return;
  }

  const authUser = authUsers.users.find(u => u.email?.toLowerCase() === normalizedEmail);

  if (!authUser) {
    console.error(`❌ User not found with email: ${email}`);
    return;
  }

  console.log(`✅ Found user in auth.users:`);
  console.log(`   ID: ${authUser.id}`);
  console.log(`   Email: ${authUser.email}`);

  // Step 2: Check profile with admin client
  console.log('\n📋 Checking profile with admin client...');
  const { data: adminProfile, error: adminProfileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (adminProfileError) {
    console.error('❌ Admin client profile lookup failed:', adminProfileError);
    return;
  }

  if (!adminProfile) {
    console.error('❌ Profile not found with admin client');
    return;
  }

  console.log(`✅ Profile found with admin client:`);
  console.log(`   Display Name: ${adminProfile.display_name}`);
  console.log(`   Email: ${adminProfile.email}`);
  console.log(`   Role: ${adminProfile.role}`);
  console.log(`   Active: ${adminProfile.active}`);

  // Step 3: Try to get profile with anon client (simulating what the app does)
  console.log('\n🔐 Testing profile access with anon key (simulating app behavior)...');
  
  // First, we need to sign in to get a session
  // But we can't do that without a password, so let's check RLS policies
  
  // Check if profile is accessible by ID lookup
  const { data: anonProfileById, error: anonProfileByIdError } = await anonClient
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  console.log(`\n📊 Anon client profile lookup (no auth):`);
  if (anonProfileByIdError) {
    console.log(`   ❌ Error: ${anonProfileByIdError.message}`);
    console.log(`   Code: ${anonProfileByIdError.code}`);
    console.log(`   Details: ${anonProfileByIdError.details}`);
    console.log(`   Hint: ${anonProfileByIdError.hint}`);
  } else if (anonProfileById) {
    console.log(`   ✅ Profile accessible (this shouldn't happen without auth)`);
  } else {
    console.log(`   ⚠️  Profile not found (expected - RLS should block this)`);
  }

  // Step 4: Check email match
  console.log('\n📧 Checking email consistency...');
  const authEmail = authUser.email?.toLowerCase().trim();
  const profileEmail = adminProfile.email?.toLowerCase().trim();
  
  if (authEmail !== profileEmail) {
    console.log(`   ⚠️  Email mismatch!`);
    console.log(`   Auth email: ${authEmail}`);
    console.log(`   Profile email: ${profileEmail}`);
    console.log(`\n   🔧 Fixing email mismatch...`);
    
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ email: authEmail })
      .eq('id', authUser.id);

    if (updateError) {
      console.error(`   ❌ Failed to update email: ${updateError}`);
    } else {
      console.log(`   ✅ Email updated in profile`);
    }
  } else {
    console.log(`   ✅ Emails match: ${authEmail}`);
  }

  // Step 5: Check if profile ID matches auth user ID
  if (adminProfile.id !== authUser.id) {
    console.log(`\n   ⚠️  ID mismatch!`);
    console.log(`   Auth ID: ${authUser.id}`);
    console.log(`   Profile ID: ${adminProfile.id}`);
  } else {
    console.log(`   ✅ IDs match`);
  }

  console.log('\n✅ Diagnostic complete!');
  console.log('\n💡 If login still fails, possible issues:');
  console.log('   1. Password is incorrect');
  console.log('   2. Session not being created properly');
  console.log('   3. RLS policies blocking profile access after login');
  console.log('   4. Browser cache/cookies issue');
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: npx tsx scripts/test-user-login.ts <email>');
  process.exit(1);
}

testUserLogin(email)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

