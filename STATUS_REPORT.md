# Guild Scout Reports - Status Report
Generated: $(date)

## Project Overview
- **Project URL**: https://yzmuyiuxfthptezgxpgo.supabase.co
- **Database**: Supabase PostgreSQL
- **Edge Functions**: 1 active
- **Migrations**: 12 applied

---

## Database Statistics

### Data Counts
| Entity | Count |
|--------|-------|
| Profiles | 3 |
| Guilds | 2 |
| Guild Members | 5 |
| Games | 4 |
| Screenshots | 2 |
| Scout Reports | 0 |
| Gear Items | 162 |
| ADB Devices | 4 |
| Navigation Patterns | 0 |
| Training Sessions | 0 |

### Database Tables (23 total)
All tables have RLS (Row Level Security) enabled:

1. **profiles** - User profiles (3 rows)
2. **screenshots** - Screenshot storage (2 rows)
3. **games** - Game definitions (4 rows)
4. **guilds** - Guild information (2 rows)
5. **guild_members** - Guild membership (5 rows)
6. **scout_reports** - Scout report data (0 rows)
7. **scout_report_credibility** - User credibility scores (0 rows)
8. **scout_report_validations** - Report validations (0 rows)
9. **gear_items** - Gear item catalog (162 rows)
10. **gear_sets** - Gear set definitions (0 rows)
11. **gear_valuation_rules** - Valuation rules (0 rows)
12. **screenshot_schedules** - Scheduled captures (0 rows)
13. **coordinate_game_states** - Coordinate state tracking (0 rows)
14. **navigation_patterns** - Navigation automation patterns (0 rows)
15. **navigation_training_sessions** - Training session logs (0 rows)
16. **pattern_executions** - Pattern execution history (0 rows)
17. **screenshot_regions** - Screenshot region annotations (0 rows)
18. **adb_devices** - ADB device registry (4 rows)
19. **device_preferences** - Device configuration (4 rows)
20. **device_activity** - Device activity logs (0 rows)

---

## Migrations Status

### Applied Migrations (12)
1. `20251118004626` - init
2. `20251118005209` - fix_handle_new_user_trigger
3. `20251118005409` - remove_user_updated_trigger
4. `20251118010759` - disable_email_confirmation_requirement
5. `20251118022813` - add_ocr_fields
6. `20251118183701` - add_guild_promo_codes
7. `20251118183706` - fix_guild_members_rls_recursion
8. `20251118183910` - allow_admins_view_all_guilds
9. `20251118183927` - replace_guilds_rls_policy_for_admins
10. `20251118184107` - allow_admins_manage_guild_members
11. `20251118232933` - add_scout_report_tables
12. `20251119000547` - update_scout_report_schema

---

## Edge Functions

### Active Functions (1)
- **auto-confirm-email** (v1)
  - Status: ACTIVE
  - JWT Verification: Enabled
  - Purpose: Automatically confirms user emails on signup

---

## Database Extensions

### Installed Extensions (5)
- `pgcrypto` (v1.3) - Cryptographic functions
- `pg_stat_statements` (v1.11) - Query performance tracking
- `uuid-ossp` (v1.1) - UUID generation
- `pg_graphql` (v1.5.11) - GraphQL support
- `supabase_vault` (v0.3.1) - Supabase Vault Extension
- `plpgsql` (v1.0) - PL/pgSQL procedural language

---

## Security Advisories

### Security Issues (5)

#### 🔴 High Priority
1. **Function Search Path Mutable** (4 functions)
   - `public.set_default_device`
   - `public.user_is_guild_member`
   - `public.handle_updated_at`
   - `public.handle_new_user`
   - **Issue**: Functions have mutable search_path, potential security risk
   - **Remediation**: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

2. **Leaked Password Protection Disabled**
   - **Issue**: HaveIBeenPwned password checking is disabled
   - **Remediation**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## Performance Advisories

### Performance Issues (47)

#### ⚠️ Unindexed Foreign Keys (6)
Foreign keys without covering indexes can impact query performance:
1. `gear_valuation_rules.gear_valuation_rules_gear_item_id_fkey`
2. `navigation_patterns.navigation_patterns_template_screenshot_id_fkey`
3. `navigation_training_sessions.navigation_training_sessions_final_screenshot_id_fkey`
4. `navigation_training_sessions.navigation_training_sessions_screenshot_id_fkey`
5. `pattern_executions.pattern_executions_result_screenshot_id_fkey`
6. `pattern_executions.pattern_executions_trigger_screenshot_id_fkey`

**Remediation**: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

#### ⚠️ RLS Initialization Plan Issues (35)
Multiple RLS policies re-evaluate `auth.<function>()` for each row, causing performance issues at scale. Affected tables:
- `screenshots` (6 policies)
- `profiles` (2 policies)
- `guild_members` (4 policies)
- `guilds` (1 policy)
- `scout_reports` (3 policies)
- `scout_report_credibility` (1 policy)
- `scout_report_validations` (1 policy)
- `screenshot_schedules` (4 policies)
- `coordinate_game_states` (1 policy)
- `navigation_patterns` (4 policies)
- `navigation_training_sessions` (2 policies)
- `pattern_executions` (3 policies)
- `screenshot_regions` (2 policies)
- `adb_devices` (4 policies)
- `device_preferences` (2 policies)
- `device_activity` (2 policies)

**Fix**: Replace `auth.<function>()` with `(select auth.<function>())` in RLS policies
**Remediation**: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

#### ⚠️ Unused Indexes (38)
The following indexes have never been used and may be candidates for removal:
- `screenshots`: 9 unused indexes
- `gear_items`: 3 unused indexes
- `screenshot_schedules`: 4 unused indexes
- `adb_devices`: 3 unused indexes
- `device_preferences`: 2 unused indexes
- `device_activity`: 2 unused indexes
- `coordinate_game_states`: 3 unused indexes
- `guilds`: 2 unused indexes
- `navigation_patterns`: 4 unused indexes
- `navigation_training_sessions`: 3 unused indexes
- `pattern_executions`: 3 unused indexes
- `screenshot_regions`: 2 unused indexes
- `scout_reports`: 2 unused indexes
- `scout_report_credibility`: 2 unused indexes
- `scout_report_validations`: 2 unused indexes

**Remediation**: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

#### ⚠️ Multiple Permissive Policies (5)
Multiple permissive RLS policies for the same role/action reduce performance:
1. `device_preferences` - SELECT (2 policies)
2. `profiles` - SELECT (2 policies)
3. `screenshots` - DELETE (2 policies)
4. `screenshots` - INSERT (2 policies)
5. `screenshots` - SELECT (2 policies)

**Remediation**: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

---

## System Health Summary

### ✅ Strengths
- All tables have RLS enabled
- Comprehensive data model with 23 tables
- 162 gear items loaded
- 4 games configured
- 2 guilds active with 5 members
- 4 ADB devices registered

### ⚠️ Areas for Improvement
1. **Security**: Fix function search_path issues and enable password leak protection
2. **Performance**: Optimize RLS policies (35 issues) and add missing foreign key indexes (6 issues)
3. **Data Usage**: Many tables are empty (scout_reports, navigation_patterns, training_sessions)
4. **Index Optimization**: Review and potentially remove 38 unused indexes

### 📊 Usage Metrics
- **Active Users**: 3 profiles
- **Guild Activity**: 2 guilds, 5 members
- **Screenshots**: 2 uploaded
- **Scout Reports**: 0 (feature not yet used)
- **Navigation Training**: 0 sessions (feature not yet used)
- **Gear Catalog**: 162 items loaded

---

## Recommendations

### Immediate Actions
1. **Enable Password Leak Protection** - Enhance security by enabling HaveIBeenPwned checking
2. **Fix Function Security** - Set search_path on 4 functions to prevent security vulnerabilities
3. **Optimize RLS Policies** - Update 35 RLS policies to use `(select auth.<function>())` pattern

### Short-term Improvements
1. **Add Foreign Key Indexes** - Create indexes for 6 foreign keys to improve join performance
2. **Consolidate RLS Policies** - Merge duplicate permissive policies (5 instances)
3. **Review Unused Indexes** - Evaluate and potentially remove 38 unused indexes

### Long-term Monitoring
1. Monitor scout report creation as feature adoption increases
2. Track navigation pattern usage and training session activity
3. Review query performance as data volume grows

---

## Development Branches
⚠️ Branch listing unavailable - Project reference missing when validating permissions

---

## Recent Activity (Last 24 Hours)

### API Logs
- **Health Checks**: Multiple successful health checks from Supabase infrastructure
- **Storage Access**: Storage bucket access requests
- **Error**: 1 expired token error on screenshot URL (400 status) - likely expired signed URL

### Auth Logs
- No recent authentication errors or issues detected

---

*Report generated using Supabase MCP tools*

