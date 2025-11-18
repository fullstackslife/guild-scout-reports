# Migration Sync Guide

This guide explains how to keep your Supabase database in sync with migration files in the codebase.

## The Problem

When you push code with new migrations, those migrations exist in your repository but may not be applied to your Supabase database. This can cause:
- Missing columns/tables
- Outdated RLS policies
- Runtime errors when code expects features that don't exist in the database

## Migration Files

All migrations are stored in `supabase/migrations/`:

- `0001_init.sql` - Initial schema (profiles, screenshots)
- `0002_add_ocr_fields.sql` - OCR processing fields
- `0003_add_guild_structure.sql` - Guild system
- `0004_add_games_table.sql` - Games table
- `0005_set_admin_role.sql` - Admin role setup
- `0006_add_guild_promo_codes.sql` - Promo code system
- `0007_fix_guild_members_rls_recursion.sql` - RLS fix
- `0008_set_user_admin.sql` - Set specific user as admin
- `0009_ensure_game_id_column.sql` - Ensure game_id exists

## Checking Migration Status

### Option 1: Using npm script (Recommended)

```bash
npm run migrate:check
```

This will list all local migration files and help you identify which ones need to be applied.

### Option 2: Manual Check

1. Go to Supabase Dashboard → Database → Migrations
2. Compare the list with files in `supabase/migrations/`
3. Note any migrations that exist in code but not in Supabase

## Applying Migrations

### Option 1: Using MCP Supabase Tools (Best for Development)

The AI assistant can apply migrations directly using the MCP Supabase integration:

```
"Apply migration 0009_ensure_game_id_column.sql to Supabase"
```

The assistant will use `mcp_supabase_apply_migration` to apply it automatically.

### Option 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file from `supabase/migrations/`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify success

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Keeping Migrations in Sync

### Best Practices

1. **Always apply migrations before deploying code**
   - Check migration status before pushing
   - Apply any missing migrations
   - Test locally if possible

2. **Use migration versioning**
   - Migrations are numbered sequentially (0001, 0002, etc.)
   - Never skip numbers
   - Always apply in order

3. **Document migration dependencies**
   - Some migrations depend on others
   - Check migration comments for dependencies

4. **Test after applying**
   - Verify tables/columns exist
   - Check RLS policies are active
   - Test functionality that uses new features

### Pre-Deployment Checklist

Before deploying code that includes migrations:

- [ ] Run `npm run migrate:check`
- [ ] Identify missing migrations
- [ ] Apply missing migrations to Supabase
- [ ] Verify migrations were applied successfully
- [ ] Test affected functionality
- [ ] Deploy code

## Troubleshooting

### "Column does not exist" errors

This means a migration hasn't been applied. Check which migration adds that column and apply it.

### "Policy does not exist" errors

RLS policies are defined in migrations. Apply the migration that creates the policy.

### Migration already applied

If Supabase shows a migration is already applied but code expects it, check:
- Migration name matches exactly
- Migration content matches what was applied
- No manual changes were made outside migrations

## Migration Naming Convention

Migrations follow this pattern:
```
0001_description.sql
0002_another_feature.sql
0003_fix_something.sql
```

- Numbers are sequential (0001, 0002, etc.)
- Descriptions are lowercase with underscores
- Always increment the number for new migrations

## Automated Sync (Future)

For production, consider:
- GitHub Actions to check migration status on PR
- Pre-deploy hooks to verify migrations are applied
- CI/CD pipeline that applies migrations automatically

## Need Help?

If migrations are out of sync:
1. Run `npm run migrate:check` to see status
2. Ask the AI assistant to apply missing migrations
3. Or manually apply via Supabase Dashboard

