# Supabase Authentication & RLS Fix Guide

## Problem Summary
The app uses custom authentication (stored in localStorage) but the Supabase API requests are failing with:
- **401 Unauthorized**: Missing or invalid bearer token
- **400/406 Bad Request**: RLS policy or request format issue

## Solution

Since this app uses custom user auth (not Supabase Auth), you have two options:

### Option 1: Disable RLS (Quickest - Development)
1. Go to Supabase Dashboard → SQL Editor
2. Run this command for each table:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;
```
3. Disable RLS on storage bucket:
   - Storage → profile_images → Policies → Disable "Enable RLS"

### Option 2: Set Public Access (Production)
1. Go to Supabase Dashboard → SQL Editor
2. Run:
```sql
CREATE POLICY allow_select ON public.users FOR SELECT USING (true);
CREATE POLICY allow_select ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY allow_insert_profiles ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY allow_update_profiles ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY allow_insert_progress ON public.chapter_progress FOR INSERT WITH CHECK (true);
CREATE POLICY allow_select_progress ON public.chapter_progress FOR SELECT USING (true);
CREATE POLICY allow_select_quiz ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY allow_insert_results ON public.quiz_results FOR INSERT WITH CHECK (true);
```

## Verification Checklist
- [ ] Execute SQL commands in Supabase console
- [ ] Refresh the app
- [ ] Test user signup/login
- [ ] Test profile image upload
- [ ] Check browser console - no more 401/400 errors
- [ ] Test quiz functionality
- [ ] Test chapter progress saving

## If Still Getting Errors
1. Check Supabase dashboard → Logs tab
2. Verify table names match exactly (case-sensitive)
3. Ensure database connection in config/supabase.js is correct
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check that profile_images storage bucket exists

## Database Schema Required Tables
✓ users (id, username, password_hash)
✓ user_profiles (user_id, username, bio, rank, win_rate, main_role, total_matches, server_region, social_media, main_heroes, profile_image_url)
✓ chapter_progress (user_id, chapter, created_at)
✓ quiz_questions (quiz_key, question, options, correct_index, explanation, difficulty)
✓ quiz_results (user_id, quiz_key, score, total_questions, elapsed_ms, created_at)
