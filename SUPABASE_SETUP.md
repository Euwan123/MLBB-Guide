# MLBB Guide - Supabase Setup Guide

## Complete Setup Steps

### 1. Create Tables (Run in Supabase SQL Editor)

Execute the contents of `/sql/supabase_complete_schema.sql`

Key tables created:
- `users` - User accounts with credentials
- `user_profiles` - Extended profile information
- `chapter_progress` - Track completed chapters
- `quiz_questions` - Quiz content
- `quiz_results` - Quiz scores

### 2. Create Storage Bucket

Execute the contents of `/sql/supabase_storage_setup.sql`

This creates the `profile_images` bucket with proper RLS policies for profile picture uploads.

### 3. Configure Environment

Your `.env` or configuration should have:
```
SUPABASE_URL=https://bhvbcwgpsfhzjgaotsjb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodmJjd2dwc2ZoempnYW90c2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzg2NjAsImV4cCI6MjA5MDM1NDY2MH0.sEQGO9do4vTBmgZUxvV-SoQ7Qbw0gNc9YuxS-O0qvEw
```

### 4. Configure RLS Policies

All tables have proper Row Level Security:
- Users can only manage their own data
- Profiles are only editable by the owner
- Quiz questions are readable by all
- Quiz results are private to each user

### 5. API Endpoints Used

All requests use Supabase PostgreSQL REST API:
- `POST /rest/v1/users` - Create user
- `GET /rest/v1/user_profiles` - Get profile
- `PATCH /rest/v1/user_profiles` - Update profile
- `GET /rest/v1/chapter_progress` - Get progress
- `UPSERT /rest/v1/chapter_progress` - Save progress
- `POST /storage/v1/upload` - Upload profile image

### 6. Common Errors & Solutions

**401 Unauthorized**
- Missing or invalid auth token
- User session expired
- Check localStorage for valid session

**404 Not Found**
- Table doesn't exist - run schema setup
- Wrong table name in API call
- Check SQL file was executed

**406 Not Acceptable**
- RLS policy mismatch
- Missing headers in request
- Ensure proper auth context

**400 Bad Request**
- Malformed data
- Missing required fields
- Check column names match schema

### 7. Mobile Optimization

App includes:
- Lazy image loading
- Connection detection for slow networks
- Reduced animations on 3G/4G
- Touch-optimized interface
- Responsive design (320px+)

### 8. Performance Features

- Service Worker caching
- Static asset optimization
- Progressive enhancement
- Offline support
- Fast initial load

### 9. Verification Checklist

- [ ] All SQL files executed
- [ ] Storage bucket created
- [ ] RLS policies enabled
- [ ] Auth working (signup/login)
- [ ] Profile save working
- [ ] Chapter progress saving
- [ ] Profile images uploading
- [ ] Quiz results tracking
- [ ] Mobile responsive
- [ ] PWA installable

### 10. Troubleshooting

If profile fails to save:
1. Check browser console for specific error
2. Verify user is logged in
3. Check Supabase logs for RLS violations
4. Verify table exists with correct columns
5. Test with simpler data

If images don't upload:
1. Check storage bucket exists
2. Verify RLS policies allow upload
3. Check file size (must be < 5MB)
4. Verify file is image format

If chapter progress doesn't save:
1. Ensure user has valid session
2. Check unique constraint on (user_id, chapter)
3. Verify timestamp is valid
