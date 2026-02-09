-- Migration: Create `magazines` storage bucket and RLS policies
-- Purpose: Create a public 'magazines' bucket and secure storage.objects
-- - Allow public reads for the 'magazines' bucket
-- - Allow authenticated users to upload PDFs only, with a 50 MB size limit
-- - Allow owners (uploader) and service role to update/delete

-- 1) Try to create the bucket using the storage helper (if available)
DO $$
BEGIN
  BEGIN
    PERFORM storage.create_bucket('magazines', true);
  EXCEPTION WHEN undefined_function THEN
    -- storage.create_bucket function not available in this environment; fall back to direct insert
    IF EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'buckets' AND n.nspname = 'storage'
    ) THEN
      INSERT INTO storage.buckets (id, name, owner, public, created_at, updated_at)
      VALUES (gen_random_uuid(), 'magazines', NULL, true, now(), now())
      ON CONFLICT (name) DO NOTHING;
    END IF;
  END;
END$$;

-- 2) Ensure RLS is enabled on storage tables (no-op if already enabled)
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.buckets ENABLE ROW LEVEL SECURITY;

-- 3) Policies for storage.objects
-- Allow SELECT if the object belongs to a public bucket named 'magazines'
-- or if the requesting user is the owner of the object
CREATE POLICY IF NOT EXISTS magazines_public_or_owner_select
  ON storage.objects
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM storage.buckets b
        WHERE b.id = bucket_id AND b.name = 'magazines' AND b.public = true
      )
    )
    OR (owner = auth.uid())
  );

-- Allow INSERT only for authenticated users into the 'magazines' bucket,
-- restrict content type to application/pdf and file size to <= 50 MB.
CREATE POLICY IF NOT EXISTS magazines_insert_auth_and_mime_and_size
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM storage.buckets b WHERE b.id = bucket_id AND b.name = 'magazines')
    AND auth.uid() IS NOT NULL
    AND (content_type = 'application/pdf')
    AND (COALESCE((metadata ->> 'size')::bigint, 0) <= (50 * 1024 * 1024))
  );

-- Allow UPDATE and DELETE only if the requester is the owner or has service_role
CREATE POLICY IF NOT EXISTS magazines_owner_or_service_update_delete
  ON storage.objects
  FOR UPDATE, DELETE
  USING (
    owner = auth.uid() OR auth.role() = 'service_role'
  )
  WITH CHECK (
    owner = auth.uid() OR auth.role() = 'service_role'
  );

-- Replace any existing magazines_* policies with simplified policies (no owner checks)
DO $$
DECLARE
  pol record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'objects' AND n.nspname = 'storage'
  ) THEN
    -- Drop existing magazines_* policies to avoid duplicates
    FOR pol IN
      SELECT polname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname LIKE 'magazines_%'
    LOOP
      EXECUTE format('DROP POLICY %I ON storage.objects', pol.polname);
    END LOOP;

    -- Public read/listing for the Magazines bucket
    EXECUTE $sql$
      CREATE POLICY magazines_select_public
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'Magazines');
    $sql$;

    -- Allow authenticated users to upload PDFs (<= 50 MB) into Magazines
    EXECUTE $sql$
      CREATE POLICY magazines_insert_authenticated_pdf
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'Magazines'
          AND auth.uid() IS NOT NULL
          AND content_type = 'application/pdf'
          AND (COALESCE((metadata ->> 'size')::bigint, 0) <= (50 * 1024 * 1024))
        );
    $sql$;

    -- Allow any authenticated user to UPDATE objects in Magazines (no owner check)
    EXECUTE $sql$
      CREATE POLICY magazines_update_authenticated
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'Magazines')
        WITH CHECK (bucket_id = 'Magazines');
    $sql$;

    -- Allow any authenticated user to DELETE objects in Magazines (no owner check)
    EXECUTE $sql$
      CREATE POLICY magazines_delete_authenticated
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'Magazines');
    $sql$;
  END IF;
END$$;

-- 4) Policies for storage.buckets
-- 4) Policies for storage.buckets (create only if the table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'buckets' AND n.nspname = 'storage'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname = 'storage' AND p.tablename = 'buckets' AND p.polname = 'buckets_select_public_or_service'
    ) THEN
      EXECUTE $policy$
        CREATE POLICY buckets_select_public_or_service
          ON storage.buckets
          FOR SELECT
          USING (public = true OR auth.role() = 'service_role');
      $policy$;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.schemaname = 'storage' AND p.tablename = 'buckets' AND p.polname = 'buckets_manage_service_role'
    ) THEN
      EXECUTE $policy$
        CREATE POLICY buckets_manage_service_role
          ON storage.buckets
          FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
      $policy$;
    END IF;
  END IF;
END$$;

-- Notes:
-- - This migration attempts to be compatible with Supabase's storage helper `storage.create_bucket`.
-- - The INSERT policy checks `metadata->>'size'` for a numeric size in bytes; ensure your upload tool
--   sets the `size` field in object metadata (many clients do). If you rely on a different metadata key,
--   adjust the policy accordingly.
-- - If you prefer to allow multiple MIME types, replace the single content_type check with an
--   `IN (...)` list or with `content_type LIKE 'application/%'` depending on needs.
