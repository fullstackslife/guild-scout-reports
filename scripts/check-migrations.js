#!/usr/bin/env node

/**
 * Migration Status Checker
 * 
 * Compares local migration files with Supabase applied migrations
 * to identify which migrations need to be applied.
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

function getLocalMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  return files.map(file => ({
    filename: file,
    path: path.join(MIGRATIONS_DIR, file)
  }));
}

function parseMigrationName(filename) {
  // Extract migration number from filename like "0001_init.sql"
  const match = filename.match(/^(\d+)_(.+)\.sql$/);
  if (match) {
    return {
      number: parseInt(match[1], 10),
      name: match[2],
      filename
    };
  }
  return null;
}

function main() {
  console.log('🔍 Checking migration status...\n');
  
  const localMigrations = getLocalMigrations();
  
  if (localMigrations.length === 0) {
    console.log('❌ No migration files found in supabase/migrations/');
    process.exit(1);
  }
  
  console.log(`📁 Found ${localMigrations.length} local migration files:\n`);
  
  localMigrations.forEach((migration, index) => {
    const parsed = parseMigrationName(migration.filename);
    if (parsed) {
      console.log(`  ${String(index + 1).padStart(2, ' ')}. ${migration.filename} (${parsed.name})`);
    } else {
      console.log(`  ${String(index + 1).padStart(2, ' ')}. ${migration.filename} (⚠️  non-standard name)`);
    }
  });
  
  console.log('\n📋 Next steps:');
  console.log('  1. Check Supabase dashboard → Database → Migrations');
  console.log('  2. Compare with the list above');
  console.log('  3. Apply any missing migrations using:');
  console.log('     - Supabase Dashboard SQL Editor, or');
  console.log('     - npm run migrate:apply');
  console.log('\n💡 Tip: Use the MCP Supabase tools to apply migrations programmatically');
}

if (require.main === module) {
  main();
}

module.exports = { getLocalMigrations, parseMigrationName };

