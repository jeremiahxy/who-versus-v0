# Quick Start: Run Database Migration

**Time Required**: ~5 minutes  
**Skill Level**: Beginner-friendly

## TL;DR

1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Copy contents of `2025-12-01-create-versus-wizard.sql`
3. Paste and click "Run"
4. Wait for success message
5. Test your app still works

Done! ✅

---

## Detailed Steps

### Step 1: Open Supabase Dashboard (30 seconds)

1. Navigate to https://app.supabase.com
2. Log in if needed
3. Select your "Who Versus" project
4. Click **"SQL Editor"** in the left sidebar

### Step 2: Prepare Migration Script (1 minute)

1. On your computer, open this file:
   ```
   docs/database/migrations/2025-12-01-create-versus-wizard.sql
   ```

2. Select all content (Cmd/Ctrl + A)
3. Copy (Cmd/Ctrl + C)

### Step 3: Execute Migration (1 minute)

1. In Supabase SQL Editor, click **"+ New query"**
2. Paste the migration script (Cmd/Ctrl + V)
3. Click the **"Run"** button (or press Cmd/Ctrl + Enter)
4. Wait for execution to complete (~5-10 seconds)

### Step 4: Verify Success (1 minute)

Look for these success indicators:

✅ **In the output panel, you should see**:
```
✅ Migration 2025-12-01-create-versus-wizard completed successfully!
Next steps:
1. Review verification queries above
2. Test that existing app still loads (home page, versus detail)
3. Proceed to Phase 1 implementation
```

✅ **Verification queries show**:
- `versus` table has `type` column
- `versus_players` table has `nickname` column
- `objectives` table has `title` and `description` columns

❌ **If you see errors**:
- Red error messages in output panel
- "Permission denied" - ensure you're in Supabase Dashboard (not local)
- "Column already exists" - migration already run (safe to ignore)

### Step 5: Test Your App (2 minutes)

1. Open terminal in your project
2. Run your dev server:
   ```bash
   pnpm dev
   ```

3. Open http://localhost:3000

4. Check that:
   - Home page loads
   - No errors in browser console (F12)
   - Existing Versus display correctly

✅ **If everything looks good**: You're done! Proceed to Phase 1.

❌ **If app has errors**: See Troubleshooting section below.

---

## Common Issues & Solutions

### Issue 1: "Column already exists"
**Symptom**: Error message mentions column already exists  
**Cause**: Migration was already run  
**Solution**: This is fine! The migration is idempotent (safe to run multiple times).

### Issue 2: TypeScript errors in IDE
**Symptom**: Red squiggly lines, errors about missing properties  
**Solution**:
1. Restart your dev server (Ctrl+C, then `pnpm dev`)
2. Restart TypeScript server in VS Code/Cursor (Cmd+Shift+P → "Restart TS Server")
3. Check that `types/database.ts` includes new fields

### Issue 3: App won't load after migration
**Symptom**: White screen, errors in console  
**Solution**:
1. Check browser console (F12) for specific error
2. Check terminal for server errors
3. Verify `.env.local` has correct Supabase credentials
4. Try hard refresh (Cmd/Ctrl + Shift + R)

### Issue 4: Can't access Supabase Dashboard
**Symptom**: Dashboard won't load or shows "project paused"  
**Solution**:
1. Check internet connection
2. Verify Supabase account is active
3. Free tier projects pause after inactivity - resume in dashboard

---

## Need to Undo the Migration?

If something went wrong and you need to rollback:

1. Open `2025-12-01-create-versus-wizard.sql`
2. Scroll to the bottom
3. Find the "ROLLBACK SCRIPT" section
4. Uncomment the rollback SQL (remove `/*` and `*/`)
5. Run it in Supabase SQL Editor

⚠️ **Warning**: This will delete data in the new columns!

---

## Visual Guide

### Before Migration
```
versus table:
- id
- name
- reverse_ranking
- created_by
- created_at
- updated_at
```

### After Migration
```
versus table:
- id
- name
- type ⭐ NEW
- reverse_ranking
- created_by
- created_at
- updated_at
```

*(Plus changes to versus_players and objectives tables)*

---

## Next Steps After Success

1. ✅ Check off tasks M001-M008 in `PHASE-0-CHECKLIST.md`
2. ✅ Mark Phase 0 as complete
3. ✅ Proceed to Phase 1 implementation:
   - Start with task T001: Create suggestions action
   - See `docs/features/create-versus-wizard-tasks.md`

---

## Questions?

- **Documentation**: See `README.md` in this folder
- **Full Checklist**: See `PHASE-0-CHECKLIST.md`
- **Feature Spec**: See `docs/features/create-versus-wizard-spec.md`
- **Schema Details**: See `docs/database/IMPLEMENTATION_SUMMARY.md`

---

**You've got this! The migration is straightforward and safe.** 🚀

