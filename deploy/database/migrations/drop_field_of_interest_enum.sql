-- Migration: Drop field_of_interest enum and update users table
-- This migration safely removes the enum and all its dependencies

-- Step 1: First, update the users table to use VARCHAR instead of enum
-- This removes the dependency on the enum type
DO $$
BEGIN
  -- Check if users table exists and has field_of_interest column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'field_of_interest'
  ) THEN
    -- Convert the column to VARCHAR (this works even if it's already VARCHAR)
    ALTER TABLE users 
    ALTER COLUMN field_of_interest TYPE VARCHAR(100);
    
    -- Remove any default constraints
    ALTER TABLE users 
    ALTER COLUMN field_of_interest DROP DEFAULT;
    
    RAISE NOTICE 'Updated users.field_of_interest to VARCHAR(100)';
  ELSE
    RAISE NOTICE 'users table or field_of_interest column does not exist';
  END IF;
END $$;

-- Step 2: Drop the enum type with CASCADE to remove all dependencies
DROP TYPE IF EXISTS field_of_interest CASCADE;

-- Step 3: Verify the enum is dropped
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'field_of_interest'
  ) THEN
    RAISE NOTICE 'Successfully dropped field_of_interest enum';
  ELSE
    RAISE NOTICE 'field_of_interest enum still exists - check for other dependencies';
  END IF;
END $$; 