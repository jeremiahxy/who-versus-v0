# Supabase Integration Setup Guide

This guide will help you complete the Supabase integration for the Who Versus application.

## ✅ Completed Steps

1. ✅ Installed Supabase packages (`@supabase/supabase-js` and `@supabase/ssr`)
2. ✅ Created Supabase client utilities for browser, server, and middleware
3. ✅ Designed database schema with tables, views, and RLS policies
4. ✅ Created TypeScript type definitions for the database
5. ✅ Implemented authentication pages (login, signup, callback, error)
6. ✅ Created authentication components (auth form, logout button)
7. ✅ Implemented proxy for route protection (Next.js 16+)
8. ✅ Created server actions for database operations
9. ✅ Updated Home and Versus pages to use real database queries

## 🚀 Next Steps to Complete Setup

### Step 1: Configure Environment Variables

1. Open the `.env.local` file in the root of your project
2. Go to your Supabase Dashboard: https://app.supabase.com
3. Select your project
4. Navigate to **Project Settings** → **API**
5. Copy the following values:
   - **Project URL** → Replace `your-project-url-here` in `.env.local`
   - **anon public key** → Replace `your-anon-key-here` in `.env.local`

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Execute Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Open the `supabase-schema.sql` file in this project
5. Copy the entire contents of the file
6. Paste it into the SQL Editor
7. Click **Run** to execute the schema

This will create:
- All database tables (players, versus, versus_players, objectives, completions)
- Auto-update trigger for timestamps
- Views for calculating scores and rankings
- Row Level Security (RLS) policies
- Auto-create player on signup trigger

### Step 3: Configure Authentication Settings (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - Add your production URL when deployed

4. Go to **Authentication** → **Email Templates**
5. Customize the email verification template if desired

### Step 4: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to the login page
4. Click "Sign up" and create a new account
5. Check your email for the verification link
6. Click the verification link to activate your account
7. You should be redirected to the home page

## 📋 Testing Checklist

### Authentication Flow
- [ ] Sign up with a new account
- [ ] Receive and verify email confirmation
- [ ] Log in with your account
- [ ] Log out successfully
- [ ] Try accessing protected routes while logged out (should redirect to login)
- [ ] Error handling works (wrong password, invalid email, etc.)

### Data Operations (After Adding Test Data)
- [ ] View empty state on home page (no versus yet)
- [ ] Create a versus (once create page is implemented)
- [ ] View versus list on home page
- [ ] Click on a versus to see details
- [ ] View scoreboard with rankings
- [ ] View history feed
- [ ] Click on another player's name to see their history

## 🔧 Adding Test Data (Optional)

If you want to test with some data before implementing the create versus functionality, you can manually add data through the Supabase Dashboard:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `versus` table
3. Click **Insert** → **Insert row**
4. Add a versus with:
   - name: "Test Challenge"
   - reverse_ranking: false
   - created_by: (your user ID - found in `players` table)

5. Then add yourself to the versus in `versus_players` table:
   - versus_id: (the ID of the versus you just created)
   - player_id: (your user ID)
   - is_commissioner: true

6. Add some objectives in the `objectives` table:
   - versus_id: (the versus ID)
   - name: "Complete a task"
   - points: 10

7. Add some completions in the `completions` table to test scoring

## 🔍 Troubleshooting

### "Not authenticated" errors
- Make sure you've added your Supabase credentials to `.env.local`
- Restart your development server after adding environment variables
- Clear your browser cookies and try logging in again

### Database errors
- Ensure you've run the complete SQL schema from `supabase-schema.sql`
- Check the Supabase Dashboard → **Database** → **Logs** for errors
- Verify RLS policies are enabled (they should be after running the schema)

### Email verification not working
- Check your Supabase Dashboard → **Authentication** → **Settings**
- Make sure "Enable email confirmations" is turned on
- For development, you can disable email confirmation temporarily (not recommended for production)

### Proxy redirect loops
- Clear your browser cache and cookies
- Make sure the proxy.ts file is in the root directory (Next.js 16 renamed middleware to proxy)
- Check that the proxy config matcher is correct

## 📚 Next Features to Implement

Now that Supabase is integrated, you can implement:

1. **Create Versus Page** - Allow users to create new versus challenges
2. **Add Players to Versus** - Invite other users to join a versus
3. **Manage Objectives** - Add, edit, delete objectives (commissioners only)
4. **Complete Objectives** - Mark objectives as complete to earn points
5. **Real-time Updates** - Use Supabase Realtime to update scores live
6. **Profile Page** - Allow users to edit their display name and profile
7. **Notifications** - Notify users when they're invited to a versus

## 🎉 Success!

Once you've completed these steps and can successfully sign up, log in, and view the home page, your Supabase integration is complete!

The application is now ready for you to build out the remaining features like creating versus, managing objectives, and completing challenges.

