/**
 * Test Oracle Database Connection
 * 
 * Run this script to verify your Oracle database connection is working.
 * 
 * Usage: npx tsx scripts/test-oracle-connection.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
const envPath = resolve(process.cwd(), '.env.local');
console.log(`📁 Loading environment from: ${envPath}`);
console.log(`📁 Current working directory: ${process.cwd()}`);

// Try loading .env.local
const result = config({ path: envPath });

// Also try loading from current directory directly
if (result.error) {
  console.log('   Trying alternative path...');
  config({ path: '.env.local' });
}

if (result.error) {
  console.warn(`⚠️  Warning: Could not load .env.local: ${result.error.message}`);
  console.warn('   Trying to load from process.env (may already be set)...\n');
} else {
  console.log('✅ Environment variables loaded\n');
}

// Debug: Show what env vars are loaded (without showing passwords)
console.log('🔍 Environment check:');
console.log(`   ORACLE_DB_USER: ${process.env.ORACLE_DB_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`   ORACLE_DB_PASSWORD: ${process.env.ORACLE_DB_PASSWORD ? '✅ Set' : '❌ Missing'}`);
console.log(`   ORACLE_DB_CONNECTION_STRING: ${process.env.ORACLE_DB_CONNECTION_STRING ? '✅ Set' : '❌ Missing'}`);
console.log(`   TNS_ADMIN: ${process.env.TNS_ADMIN ? '✅ Set' : '❌ Missing'}`);
console.log('');

import { initOraclePool, executeQuery, closeOraclePool } from '../lib/oracle/client';

async function testConnection() {
  console.log('🔌 Testing Oracle Database Connection...\n');

  try {
    // Initialize connection pool
    console.log('1. Initializing connection pool...');
    await initOraclePool();
    console.log('   ✅ Connection pool created\n');

    // Test basic query
    console.log('2. Testing database query...');
    const result = await executeQuery('SELECT SYSDATE as current_time, USER as current_user FROM DUAL');
    console.log('   ✅ Query executed successfully');
    console.log('   📊 Result:', result[0]);
    console.log('   🕐 Database time:', result[0]?.CURRENT_TIME);
    console.log('   👤 Database user:', result[0]?.CURRENT_USER);
    console.log('');

    // Test database version
    console.log('3. Getting database version...');
    const versionResult = await executeQuery('SELECT BANNER as version FROM v$version WHERE BANNER LIKE \'Oracle%\'');
    console.log('   ✅ Version query successful');
    console.log('   📦 Database:', versionResult[0]?.VERSION);
    console.log('');

    // Test UUID generation (for your app)
    console.log('4. Testing UUID generation...');
    const uuidResult = await executeQuery('SELECT SYS_GUID() as uuid FROM DUAL');
    console.log('   ✅ UUID generation works');
    console.log('   🆔 Sample UUID (RAW):', uuidResult[0]?.UUID);
    console.log('');

    console.log('✅ All tests passed! Database connection is working.\n');
    console.log('📝 Next steps:');
    console.log('   1. Run database migrations: oracle/migrations/0001_init_oracle.sql');
    console.log('   2. Update your code to use Oracle client');
    console.log('   3. Test with your actual queries\n');

  } catch (error) {
    console.error('❌ Connection test failed!\n');
    console.error('Error details:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check .env.local has correct credentials');
    console.error('   2. Verify TNS_ADMIN points to wallet directory');
    console.error('   3. Ensure connection string is correct');
    console.error('   4. Check network access is "Secure access from everywhere"');
    console.error('   5. Verify wallet files are extracted correctly\n');
    process.exit(1);
  } finally {
    // Close connection pool
    await closeOraclePool();
    console.log('🔌 Connection pool closed');
  }
}

// Run the test
testConnection().catch(console.error);

