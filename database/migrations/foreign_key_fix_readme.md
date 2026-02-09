## Foreign Key Constraint Fix

### The Problem
Error: `Database error: insert or update on table "magazines" violates foreign key constraint "magazines_created_by_fkey"`

### The Cause
The `created_by` field in magazines table references the `users.id` field, but the code was using `user?.id` from the auth context, which is the **account ID**, not the **user ID** from the users table.

### The Solution
Changed the code to use `userProfile?.id` instead of `user?.id`:

```typescript
// Before (WRONG):
created_by: user?.id  // This is the account ID from auth

// After (CORRECT):
created_by: userProfile?.id  // This is the user ID from users table
```

### Database Schema Relationship
```
auth.users (Supabase Auth)
    ↓
accounts (email, password_hash)
    ↓ (account_id)
users (id, full_name, role, field_of_interest)
    ↓ (created_by foreign key)
magazines (title, pdf_url, etc)
```

### What Was Fixed
1. ✅ Changed `created_by: user?.id` to `created_by: userProfile?.id`
2. ✅ Added console warning if userProfile is not loaded
3. ✅ Made created_by nullable in migration script (as fallback)
4. ✅ Added logging to track the user ID being used

### How to Verify Your User ID
Run this in Supabase SQL Editor (replace with your email):

```sql
SELECT u.id, u.full_name, a.email 
FROM users u 
JOIN accounts a ON u.account_id = a.id 
WHERE a.email = 'your-email@example.com';
```

This will show your user ID that should be used for `created_by`.

### Migration Script
Run [setup_complete_magazine_system.sql](./setup_complete_magazine_system.sql) which now includes:
- Adding pdf_url column
- Making created_by nullable (as safety measure)
- Verification queries

### Testing
1. Make sure you're logged in
2. Check browser console - should see: `Current user ID: <your-uuid>`
3. Create a magazine
4. Should work without foreign key error!

If you still see issues, check that:
- You have a record in the `users` table
- Your session is active and userProfile is loaded
- Browser console shows a valid UUID for "Current user ID"
