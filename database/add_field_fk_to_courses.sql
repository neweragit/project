-- =====================================================
-- MIGRATION: Add field_of_interest_id to courses table
-- =====================================================
-- This adds a direct foreign key relationship from courses to field_of_interest_options
-- Each course can belong to one field of interest (simpler approach)

-- Add the foreign key column to courses table
ALTER TABLE courses
ADD COLUMN field_of_interest_id INTEGER REFERENCES field_of_interest_options(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_field_of_interest_id ON courses(field_of_interest_id);

-- Optional: Add a comment to document the relationship
COMMENT ON COLUMN courses.field_of_interest_id IS 'Foreign key to field_of_interest_options table - each course belongs to one field of interest';
