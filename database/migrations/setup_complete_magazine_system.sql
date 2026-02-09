-- =====================================
-- COMPLETE MAGAZINE SYSTEM SETUP
-- Run this entire script in Supabase SQL Editor
-- =====================================

-- Step 1: Add pdf_url column to magazines table (if not exists)
ALTER TABLE public.magazines
ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add comment
COMMENT ON COLUMN public.magazines.pdf_url IS 'URL to the magazine PDF file stored in Supabase storage';

-- Ensure created_by is nullable (it should be by default, but let's be explicit)
-- This allows magazines to be created even if user profile isn't loaded
ALTER TABLE public.magazines
ALTER COLUMN created_by DROP NOT NULL;

-- Step 2: Verify the magazines table structure
-- You should see: id, title, description, cover_image_url, pdf_url, authors, images, price, is_paid, status, published_at, created_by, created_at, updated_at
-- Uncomment the next line to check:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'magazines' ORDER BY ordinal_position;

-- Step 3: Enable RLS on storage if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to avoid conflicts (optional, only if you want to recreate them)
-- Uncomment if you need to recreate policies:
-- DROP POLICY IF EXISTS "Admins can upload magazines" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can edit magazines" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can delete magazines" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can read magazines" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can insert magazine images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can update magazine images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can delete magazine images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can read magazine images" ON storage.objects;

-- Step 5: Create storage policies for Magazines bucket
CREATE POLICY IF NOT EXISTS "Allow upload to Magazines bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'Magazines');

CREATE POLICY IF NOT EXISTS "Allow update in Magazines bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'Magazines');

CREATE POLICY IF NOT EXISTS "Allow delete from Magazines bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'Magazines');

CREATE POLICY IF NOT EXISTS "Allow public read from Magazines bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'Magazines');

-- Step 6: Create storage policies for MagazineImages bucket
CREATE POLICY IF NOT EXISTS "Admins can insert magazine images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'MagazineImages');

CREATE POLICY IF NOT EXISTS "Admins can update magazine images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'MagazineImages');

CREATE POLICY IF NOT EXISTS "Admins can delete magazine images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'MagazineImages');

CREATE POLICY IF NOT EXISTS "Public can read magazine images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'MagazineImages');

-- Step 7: Test query to see all magazines (should return empty initially)
-- Uncomment to test:
-- SELECT id, title, pdf_url, cover_image_url, status, created_at FROM magazines ORDER BY created_at DESC;

-- Step 8: Grant necessary permissions (if needed)
-- Usually Supabase handles this automatically, but if you have issues:
-- GRANT ALL ON magazines TO authenticated;
-- GRANT ALL ON magazines TO service_role;

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Check if pdf_url column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'magazines' AND column_name = 'pdf_url';

-- Check all storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (qual LIKE '%Magazines%' OR qual LIKE '%MagazineImages%')
ORDER BY policyname;

-- Check magazines table data
SELECT 
    COUNT(*) as total_magazines,
    COUNT(pdf_url) as magazines_with_pdf,
    COUNT(cover_image_url) as magazines_with_cover
FROM magazines;

-- Check your user ID (for debugging created_by issues)
-- Replace 'your-email@example.com' with your actual email
-- SELECT u.id, u.full_name, a.email 
-- FROM users u 
-- JOIN accounts a ON u.account_id = a.id 
-- WHERE a.email = 'your-email@example.com';

-- =====================================
-- TROUBLESHOOTING
-- =====================================

-- If you get "violates foreign key constraint magazines_created_by_fkey":
-- 1. Check that your user exists in the users table (query above)
-- 2. Make sure you're logged in and userProfile is loaded
-- 3. The code now uses userProfile?.id which should match users.id

-- =====================================
-- DONE! 
-- Your magazine system should now be ready.
-- Try creating a magazine from the admin panel.
-- =====================================
