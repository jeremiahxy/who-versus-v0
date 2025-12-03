# Deployment Guide: Create Versus Wizard Feature

## Overview

This guide covers committing the Create Versus Wizard feature and deploying to Vercel.

## Pre-Deployment Checklist

- ✅ All Phase 6 tasks completed (except manual testing)
- ✅ Linter passes with 0 errors
- ✅ TypeScript types are correct
- ✅ Database migrations documented
- ✅ Documentation updated

## Step 1: Review Changes

Review what will be committed:

```bash
git status
```

## Step 2: Stage Changes

Stage all feature-related files:

```bash
# Stage all modified and new files
git add app/actions/
git add app/create/
git add app/versus/
git add components/versus-wizard-*.tsx
git add components/versus-card.tsx
git add components/navigation.tsx
git add docs/features/
git add docs/database/
git add types/database.ts
git add lib/supabase/server.ts
git add app/page.tsx
git add package.json
git add pnpm-lock.yaml
git add .gitignore
```

Or stage everything at once:

```bash
git add .
```

## Step 3: Commit with Descriptive Message

Use a clear, descriptive commit message:

```bash
git commit -m "feat: Implement Create Versus Wizard feature

- Add multi-step wizard for creating Versus (Settings → Players → Objectives)
- Add commissioner management tools (edit settings, players, objectives)
- Add email validation and player management
- Add AI objective suggestions (mocked)
- Add conditional reverse ranking for Swear Jar/Other types
- Add inline editing for objectives with immediate save
- Add comprehensive validation and error messages
- Add accessibility attributes (ARIA labels, keyboard navigation)
- Fix TypeScript types and linting errors
- Update database schema documentation

Phases completed:
- Phase 0: Database migrations
- Phase 1: MVP creation flow
- Phase 2: AI suggestions
- Phase 3: Reverse ranking
- Phase 4: Edit players
- Phase 5: Edit objectives & settings
- Phase 6: Polish & accessibility

See docs/features/create-versus-wizard-spec.md for full specification."
```

## Step 4: Push to GitHub

Push to your main branch:

```bash
git push origin main
```

## Step 5: Vercel Deployment

### Automatic Deployment (Recommended)

If your GitHub repository is connected to Vercel:
1. Vercel will automatically detect the push to `main`
2. It will trigger a new deployment
3. You'll receive a notification when deployment completes
4. Check your Vercel dashboard for deployment status

### Manual Deployment

If you need to deploy manually:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy to production
vercel --prod
```

### Verify Deployment

1. Check Vercel dashboard for build logs
2. Verify all environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Test the deployed application:
   - Create a new Versus
   - Test all wizard steps
   - Test commissioner management features

## Post-Deployment Checklist

- [ ] Verify wizard creation flow works
- [ ] Test commissioner menu on home page
- [ ] Test editing players, objectives, and settings
- [ ] Verify database migrations are applied in production
- [ ] Check error handling and validation messages
- [ ] Test responsive design on mobile/tablet

## Rollback Plan

If issues are discovered:

```bash
# Revert the commit
git revert HEAD

# Push the revert
git push origin main
```

Vercel will automatically redeploy the previous version.

## Environment Variables

Ensure these are set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## Database Migrations

**Important**: Before deploying, ensure all database migrations have been run in your production Supabase instance:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration scripts from `docs/database/migrations/`
3. Verify schema matches `docs/database/supabase-schema.sql`

## Notes

- The `.specify/` directory is now in `.gitignore` (tooling files)
- All feature documentation is in `docs/features/`
- Database schema changes are documented in `docs/database/IMPLEMENTATION_SUMMARY.md`

