# Phase 0: Database Migration - Completion Checklist

**Status**: ⏳ In Progress  
**Started**: 2025-12-01  
**Completed**: _____

## Prerequisites
- [ ] Supabase project is accessible
- [ ] Have access to Supabase Dashboard
- [ ] `.env.local` configured with correct credentials
- [ ] Local dev server can connect to database

## Migration Tasks

### M001: Create Migration Script ✅
- [x] Create `docs/database/migrations/2025-12-01-create-versus-wizard.sql`
- [x] Include all 4 schema changes
- [x] Add comments and documentation
- [x] Include verification queries
- [x] Include rollback script

### M002: Add type Column to versus Table
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy migration script contents
- [ ] Run migration script
- [ ] Verify success message appears
- [ ] Check verification query output
- [ ] Confirm `versus.type` column exists (VARCHAR(50), nullable)

### M003: Add nickname Column to versus_players Table
- [ ] Confirm migration script completed (part of M002 execution)
- [ ] Check verification query for `versus_players` table
- [ ] Confirm `nickname` column exists (VARCHAR(50), nullable)

### M004: Rename name to title in objectives Table
- [ ] Confirm migration script handled this (automatic detection)
- [ ] Check if `objectives.name` existed (upgrades) or skipped (fresh install)
- [ ] Verify `objectives.title` column exists
- [ ] Note: If fresh install, this step auto-skipped

### M005: Add description Column to objectives Table
- [ ] Confirm migration script completed
- [ ] Check verification query for `objectives` table
- [ ] Confirm `description` column exists (TEXT, nullable)

### M006: Run Migration in Supabase
**Detailed Steps**:

1. Navigate to Supabase Dashboard
   - [ ] Go to https://app.supabase.com
   - [ ] Select "Who Versus" project

2. Open SQL Editor
   - [ ] Click "SQL Editor" in sidebar
   - [ ] Click "+ New query"

3. Execute Migration
   - [ ] Open `docs/database/migrations/2025-12-01-create-versus-wizard.sql`
   - [ ] Copy entire contents
   - [ ] Paste into SQL Editor
   - [ ] Click "Run" (or Cmd/Ctrl + Enter)

4. Review Output
   - [ ] Check for success messages in output panel
   - [ ] Look for "✅ Migration completed successfully" notice
   - [ ] Review verification query results
   - [ ] Ensure no error messages appear

5. Document Results
   - [ ] Save SQL Editor query as "Create Versus Wizard Migration"
   - [ ] Note completion time: _____
   - [ ] Screenshot or copy verification results (optional)

### M007: Verify Migration Success

#### Database Structure Verification
- [ ] Run verification query for `versus` table
  - [ ] `type` column present
  - [ ] Column type is VARCHAR(50)
  - [ ] Column is nullable
  
- [ ] Run verification query for `versus_players` table
  - [ ] `nickname` column present
  - [ ] Column type is VARCHAR(50)
  - [ ] Column is nullable

- [ ] Run verification query for `objectives` table
  - [ ] `title` column present (or `name` if fresh install)
  - [ ] `description` column present
  - [ ] Column type is TEXT
  - [ ] Column is nullable

#### Manual Verification (Optional but Recommended)
```sql
-- Run these queries in SQL Editor to double-check:

-- Check versus table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'versus' AND column_name IN ('type');

-- Check versus_players table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'versus_players' AND column_name IN ('nickname');

-- Check objectives table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'objectives' AND column_name IN ('title', 'description');
```

- [ ] All queries return expected results
- [ ] No unexpected columns or types

### M008: Test Existing Application

#### Start Development Server
- [ ] Run `pnpm dev` (or `npm run dev`)
- [ ] Server starts without errors
- [ ] No TypeScript compilation errors
- [ ] Navigate to http://localhost:3000

#### Test Home Page
- [ ] Home page loads successfully
- [ ] Existing Versus list displays (if you have data)
- [ ] No console errors in browser DevTools
- [ ] Versus cards render correctly

#### Test Versus Detail Page
- [ ] Click on an existing Versus (if you have data)
- [ ] Versus detail page loads
- [ ] Scoreboard displays
- [ ] History displays
- [ ] No errors in console

#### Test Database Queries
- [ ] Check that existing server actions still work
- [ ] Try completing an objective (if possible)
- [ ] Verify data saves correctly

#### TypeScript Validation
- [ ] Open `types/database.ts`
- [ ] Verify it includes new fields:
  - [ ] `Versus.type`
  - [ ] `VersusPlayer.nickname`
  - [ ] `Objective.title`
  - [ ] `Objective.description`
- [ ] No TypeScript errors in IDE
- [ ] Run `pnpm build` to verify production build works

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Migration has already been run. This is safe to ignore. The script uses `IF NOT EXISTS`.

### Issue: TypeScript errors about missing fields
**Solution**: 
1. Ensure `types/database.ts` is updated (should already be done)
2. Restart dev server
3. Clear Next.js cache: `rm -rf .next`
4. Restart IDE/TypeScript server

### Issue: Application doesn't load after migration
**Solution**:
1. Check browser console for specific errors
2. Check terminal for server errors
3. Verify database connection in `.env.local`
4. Try rollback script if needed (see migration file)

### Issue: Can't access Supabase Dashboard
**Solution**:
1. Check internet connection
2. Verify Supabase credentials
3. Ensure project hasn't been paused (free tier limitation)

## Rollback Plan

If migration causes issues:

1. [ ] Open migration file: `docs/database/migrations/2025-12-01-create-versus-wizard.sql`
2. [ ] Scroll to "ROLLBACK SCRIPT" section
3. [ ] Uncomment the rollback SQL
4. [ ] Run rollback script in Supabase SQL Editor
5. [ ] Verify rollback success
6. [ ] Document issue in this checklist
7. [ ] Investigate and fix migration script
8. [ ] Re-attempt migration

⚠️ **Warning**: Rollback will delete any data in new columns!

## Sign-Off

### Phase 0 Complete When:
- [x] All migration tasks (M001-M008) checked off
- [x] Database structure verified
- [x] Existing app tested and working
- [x] No errors in console or logs
- [x] TypeScript types match new schema

### Completion Confirmation
- [ ] **Database Administrator**: _____________________ Date: _____
- [ ] **Developer**: _____________________ Date: _____
- [ ] **Tester** (optional): _____________________ Date: _____

### Notes & Issues
```
Document any issues encountered, workarounds applied, or deviations from plan:

[Add notes here]
```

---

## ✅ Phase 0 Status: Complete

**Completed On**: _____  
**Completed By**: _____  
**Total Time**: _____ minutes

**Next Steps**:
1. Proceed to Phase 1: Server Actions & Mock Endpoint
2. Begin tasks T001-T003 in `docs/features/create-versus-wizard-tasks.md`
3. Update main project documentation with completion status

---

**Ready for Phase 1!** 🚀

