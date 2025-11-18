/**
 * Script to reset a user's password
 * 
 * Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>
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
  process.exit(1);
}

const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword(email: string, newPassword: string) {
  console.log(`\n🔍 Finding user: ${email}\n`);

  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email
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

  console.log(`✅ Found user: ${authUser.id}`);
  console.log(`   Email: ${authUser.email}`);

  // Reset password
  console.log('\n🔐 Resetting password...');
  const { data, error } = await adminClient.auth.admin.updateUserById(authUser.id, {
    password: newPassword
  });

  if (error) {
    console.error('❌ Failed to reset password:', error);
    return;
  }

  console.log('✅ Password reset successfully!');
  console.log(`\n📧 User can now login with:`);
  console.log(`   Email: ${normalizedEmail}`);
  console.log(`   Password: ${newPassword}`);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('❌ Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters');
  process.exit(1);
}

resetPassword(email, password)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

