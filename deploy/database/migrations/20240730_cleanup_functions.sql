-- Function to get enum values
CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
RETURNS text[] AS $$
DECLARE
  enum_values text[];
BEGIN
  SELECT array_agg(enumlabel ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = enum_name;
  
  RETURN enum_values;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration: Safely drop field_of_interest enum and update users table
DO $$
BEGIN
  -- Step 1: Check if the enum exists
  IF EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'field_of_interest'
  ) THEN
    
    -- Step 2: Update users table field_of_interest column to VARCHAR first
    -- This removes the dependency on the enum
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'field_of_interest'
    ) THEN
      -- Convert enum to VARCHAR (this will work even if it's already VARCHAR)
      ALTER TABLE users 
      ALTER COLUMN field_of_interest TYPE VARCHAR(100);
      
      -- Remove any default constraints that might reference the enum
      ALTER TABLE users 
      ALTER COLUMN field_of_interest DROP DEFAULT;
    END IF;
    
    -- Step 3: Drop any functions that might reference the enum
    -- (get_enum_values function will be recreated above)
    
    -- Step 4: Drop the enum type itself
    DROP TYPE IF EXISTS field_of_interest CASCADE;
    
    RAISE NOTICE 'Successfully dropped field_of_interest enum and updated users table';
  ELSE
    RAISE NOTICE 'field_of_interest enum does not exist, skipping drop';
  END IF;
END $$;