-- =====================================================
-- NEW COURSE MANAGEMENT SYSTEM (Flexible Table-Based)
-- =====================================================
-- This replaces the enum-based system with flexible tables
-- Run this in Supabase SQL Editor

-- Create course_types table (replacing course_type enum)
CREATE TABLE course_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    variant VARCHAR(20) DEFAULT 'outline',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create course_statuses table (replacing course_status enum)
CREATE TABLE course_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    variant VARCHAR(20) DEFAULT 'outline',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default course types
INSERT INTO course_types (name, display_name, variant) VALUES
    ('udemy', 'Udemy', 'default'),
    ('coursera', 'Coursera', 'secondary'),
    ('youtube', 'YouTube', 'outline'),
    ('other', 'Other', 'outline');

-- Insert default course statuses
INSERT INTO course_statuses (name, display_name, variant) VALUES
    ('upcoming', 'Upcoming', 'secondary'),
    ('active', 'Active', 'default'),
    ('expired', 'Expired', 'destructive'),
    ('archived', 'Archived', 'outline');

-- Create courses table
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_type_id INTEGER REFERENCES course_types(id),
    course_type VARCHAR(50), -- Keep for backward compatibility
    status_id INTEGER REFERENCES course_statuses(id),
    status VARCHAR(50), -- Keep for backward compatibility
    start_date DATE NOT NULL,
    end_date DATE,
    link VARCHAR(512),
    image_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();

-- Add some sample courses
INSERT INTO courses (title, description, course_type_id, course_type, status_id, status, start_date, end_date, link)
SELECT
    'React Masterclass',
    'Complete React development course including hooks and TypeScript',
    ct.id,
    ct.name,
    cs.id,
    cs.name,
    '2025-09-01'::date,
    '2025-12-31'::date,
    'https://udemy.com/react-masterclass'
FROM course_types ct, course_statuses cs
WHERE ct.name = 'udemy' AND cs.name = 'upcoming'
UNION ALL
SELECT
    'Python for Data Science',
    'Learn Python for Data Analysis and Machine Learning',
    ct.id,
    ct.name,
    cs.id,
    cs.name,
    '2025-08-15'::date,
    '2025-11-15'::date,
    'https://coursera.org/python-data-science'
FROM course_types ct, course_statuses cs
WHERE ct.name = 'coursera' AND cs.name = 'active'
UNION ALL
SELECT
    'JavaScript Fundamentals',
    'Basic to Advanced JavaScript concepts',
    ct.id,
    ct.name,
    cs.id,
    cs.name,
    '2025-07-01'::date,
    '2025-08-31'::date,
    'https://youtube.com/javascript-fundamentals'
FROM course_types ct, course_statuses cs
WHERE ct.name = 'youtube' AND cs.name = 'expired';

-- Create enum for enrollment status (keeping this as enum since it's simpler)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'dropped');
    END IF;
END$$;

Expand your knowledge with our comprehensive courses covering cutting-edge topics in science, technology, and research methodologies.


-- If your users table is named 'users' and has id UUID primary key, create FK
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE course_enrollments
        ADD CONSTRAINT fk_course_enrollments_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END$$;

-- Trigger to update updated_at timestamp on enrollments
CREATE OR REPLACE FUNCTION update_course_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_course_enrollments_updated_at
    BEFORE UPDATE ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_enrollments_updated_at();

-- =====================================================
-- OPTIONAL: Migration queries (if you have existing data)
-- =====================================================

-- If you have existing courses with enum values, you can convert them:
-- UPDATE courses SET
--   course_type_id = (SELECT id FROM course_types WHERE name = course_type::text),
--   status_id = (SELECT id FROM course_statuses WHERE name = status::text)
-- WHERE course_type_id IS NULL OR status_id IS NULL;

-- After migration, you can drop the old enum columns if desired:
-- ALTER TABLE courses DROP COLUMN IF EXISTS course_type;
-- ALTER TABLE courses DROP COLUMN IF EXISTS status;

-- =====================================================
-- VIEWS for easier querying (optional)
-- =====================================================

-- Create a view that joins courses with their types and statuses
CREATE OR REPLACE VIEW courses_with_details AS
SELECT
    c.*,
    ct.display_name as course_type_display,
    ct.variant as course_type_variant,
    cs.display_name as status_display,
    cs.variant as status_variant
FROM courses c
LEFT JOIN course_types ct ON c.course_type_id = ct.id
LEFT JOIN course_statuses cs ON c.status_id = cs.id;

-- =====================================================
-- INDEXES for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_courses_type_id ON courses(course_type_id);
CREATE INDEX IF NOT EXISTS idx_courses_status_id ON courses(status_id);
CREATE INDEX IF NOT EXISTS idx_course_types_active ON course_types(is_active);
CREATE INDEX IF NOT EXISTS idx_course_statuses_active ON course_statuses(is_active);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Add a few more course types for testing
INSERT INTO course_types (name, display_name, variant) VALUES
    ('linkedin', 'LinkedIn Learning', 'default'),
    ('pluralsight', 'Pluralsight', 'secondary'),
    ('udacity', 'Udacity', 'outline')
ON CONFLICT (name) DO NOTHING;

-- Add a few more statuses for testing
INSERT INTO course_statuses (name, display_name, variant) VALUES
    ('draft', 'Draft', 'outline'),
    ('published', 'Published', 'default')
ON CONFLICT (name) DO NOTHING;

</content>
<parameter name="filePath">d:\New Era\database\new_course_system.sql
