import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseAdminClient() {
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin client is not configured');
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });
}
