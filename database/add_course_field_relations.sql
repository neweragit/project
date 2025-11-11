-- =====================================================
-- MIGRATION: Add Field of Interest Relationship to Courses
-- =====================================================
-- This adds the ability to link courses to field_of_interest_options
-- for better categorization and filtering

-- Step 1: Create course_field_relations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS course_field_relations (
    id SERIAL PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    field_of_interest_id INTEGER NOT NULL REFERENCES field_of_interest_options(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_course_field UNIQUE(course_id, field_of_interest_id)
);

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_field_relations_course_id ON course_field_relations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_field_relations_field_id ON course_field_relations(field_of_interest_id);

-- Step 3: Create a view for easier querying of courses with their fields
CREATE OR REPLACE VIEW courses_with_fields AS
SELECT
    c.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', fio.id,
                'name', fio.name
            )
        ) FILTER (WHERE fio.id IS NOT NULL),
        '[]'::json
    ) as fields_of_interest
FROM courses c
LEFT JOIN course_field_relations cfr ON c.id = cfr.course_id
LEFT JOIN field_of_interest_options fio ON cfr.field_of_interest_id = fio.id
GROUP BY c.id;

-- =====================================================
-- OPTIONAL: Add some sample relationships
-- =====================================================

-- Uncomment and modify these to link existing courses to fields:
/*
-- Link React Masterclass to Computer Science
INSERT INTO course_field_relations (course_id, field_of_interest_id)
SELECT c.id, fio.id
FROM courses c, field_of_interest_options fio
WHERE c.title = 'React Masterclass' AND fio.name = 'Computer Science'
ON CONFLICT (course_id, field_of_interest_id) DO NOTHING;

-- Link Python for Data Science to Computer Science and Science and Technology
INSERT INTO course_field_relations (course_id, field_of_interest_id)
SELECT c.id, fio.id
FROM courses c, field_of_interest_options fio
WHERE c.title = 'Python for Data Science'
  AND fio.name IN ('Computer Science', 'Science and Technology')
ON CONFLICT (course_id, field_of_interest_id) DO NOTHING;

-- Link JavaScript Fundamentals to Computer Science
INSERT INTO course_field_relations (course_id, field_of_interest_id)
SELECT c.id, fio.id
FROM courses c, field_of_interest_options fio
WHERE c.title = 'JavaScript Fundamentals' AND fio.name = 'Computer Science'
ON CONFLICT (course_id, field_of_interest_id) DO NOTHING;
*/

-- =====================================================
-- ADMIN DASHBOARD UPDATE QUERIES
-- =====================================================

-- Query to get courses with their field relationships for admin:
SELECT
    c.*,
    array_agg(fio.name) FILTER (WHERE fio.name IS NOT NULL) as field_names
FROM courses c
LEFT JOIN course_field_relations cfr ON c.id = cfr.course_id
LEFT JOIN field_of_interest_options fio ON cfr.field_of_interest_id = fio.id
GROUP BY c.id
ORDER BY c.created_at DESC;

-- Query to get all available fields for course assignment:
SELECT id, name FROM field_of_interest_options WHERE is_active = true ORDER BY display_order;</content>
<parameter name="filePath">d:\New Era\database\add_course_field_relations.sql
