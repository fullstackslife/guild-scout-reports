#!/usr/bin/env node

/**
 * Migration Application Helper
 * 
 * Reads migration files and provides instructions for applying them.
 * For actual application, use the MCP Supabase tools or Supabase CLI.
 */

const fs = require('fs');
const path = require('path');
const { getLocalMigrations, parseMigrationName } = require('./check-migrations');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

function readMigrationFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function main() {
  console.log('📦 Migration Application Helper\n');
  
  const localMigrations = getLocalMigrations();
  
  if (localMigrations.length === 0) {
    console.log('❌ No migration files found');
    process.exit(1);
  }
  
  console.log('Available migrations:\n');
  
  localMigrations.forEach((migration, index) => {
    const parsed = parseMigrationName(migration.filename);
    const content = readMigrationFile(migration.path);
    const lines = content.split('\n').length;
    
    console.log(`${String(index + 1).padStart(2, ' ')}. ${migration.filename}`);
    if (parsed) {
      console.log(`     Name: ${parsed.name}`);
    }
    console.log(`     Size: ${lines} lines`);
    console.log('');
  });
  
  console.log('📝 To apply migrations:');
  console.log('');
  console.log('Option 1: Use MCP Supabase tools (recommended)');
  console.log('  - The AI assistant can apply migrations using mcp_supabase_apply_migration');
  console.log('');
  console.log('Option 2: Use Supabase Dashboard');
  console.log('  1. Go to Supabase Dashboard → SQL Editor');
  console.log('  2. Copy the contents of each migration file');
  console.log('  3. Paste and run in SQL Editor');
  console.log('');
  console.log('Option 3: Use Supabase CLI');
  console.log('  supabase db push --remote');
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { readMigrationFile };

