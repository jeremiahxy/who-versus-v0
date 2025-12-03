# Database Migrations

This directory contains SQL migration scripts for the Who Versus database schema.

## How to Run Migrations

### Prerequisites
- Access to your Supabase Dashboard
- Project URL and credentials configured in `.env.local`

### Steps to Execute a Migration

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your Who Versus project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration Script**
   - Open the migration file you want to run
   - Copy the entire contents

4. **Execute Migration**
   - Paste the migration script into the SQL Editor
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for confirmation message

5. **Verify Success**
   - Check the output panel for success messages
   - Review the verification queries at the end of the script
   - Look for any error messages

6. **Test Your Application**
   - Open your app in browser (http://localhost:3000)
   - Verify existing functionality still works
   - Check console for any TypeScript errors

## Migration Files

### 2025-12-01-create-versus-wizard.sql
**Purpose**: Add support for Create Versus Wizard feature

**Changes**:
- Adds `type` column to `versus` table
- Adds `nickname` column to `versus_players` table
- Renames `name` to `title` in `objectives` table
- Adds `description` column to `objectives` table

**Required**: Yes - must run before implementing wizard feature

**Status**: ⏳ Pending execution

## Rollback

If a migration causes issues, each migration file includes a rollback script in the comments. To rollback:

1. Find the "ROLLBACK SCRIPT" section in the migration file
2. Uncomment the rollback SQL
3. Run it in Supabase SQL Editor

⚠️ **Warning**: Rollback will delete data in the new columns!

## Troubleshooting

### Error: "column already exists"
This is safe to ignore if you've run the migration before. The script uses `IF NOT EXISTS` to be idempotent.

### Error: "column 'name' does not exist"
If objectives table already uses `title` (fresh install), the rename step is skipped automatically.

### Error: "permission denied"
Ensure you're using the Supabase Dashboard SQL Editor, which has admin privileges.

### TypeScript Errors After Migration
If you see TypeScript errors about missing fields:
1. Check that `types/database.ts` is updated
2. Restart your dev server: `pnpm dev`
3. Clear Next.js cache: `rm -rf .next`

## Best Practices

- ✅ Run migrations in order (by date)
- ✅ Test migrations in development first
- ✅ Back up database before running in production
- ✅ Review migration script before executing
- ✅ Keep this README updated with new migrations
- ✅ Document any manual steps required

## Questions?

See main documentation:
- `docs/database/SUPABASE_SETUP.md` - Initial database setup
- `docs/database/IMPLEMENTATION_SUMMARY.md` - Schema documentation
- `docs/features/create-versus-wizard-spec.md` - Feature specification

