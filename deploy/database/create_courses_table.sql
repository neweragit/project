-- Create enum for course status


-- Create course_types table (replacing the enum for flexibility)
CREATE TABLE course_types (
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

-- Create courses table
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_type_id INTEGER REFERENCES course_types(id),
    course_type VARCHAR(50), -- Keep for backward compatibility
    start_date DATE NOT NULL,
    end_date DATE,
    link VARCHAR(512),
    image_url VARCHAR(512),
    status course_status NOT NULL DEFAULT 'upcoming',
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
INSERT INTO courses (title, description, course_type_id, course_type, start_date, end_date, link, status)
SELECT 
    'React Masterclass',
    'Complete React development course including hooks and TypeScript',
    ct.id,
    ct.name,
    '2025-09-01'::date,
    '2025-12-31'::date,
    'https://udemy.com/react-masterclass',
    'upcoming'
FROM course_types ct WHERE ct.name = 'udemy'
UNION ALL
SELECT 
    'Python for Data Science',
    'Learn Python for Data Analysis and Machine Learning',
    ct.id,
    ct.name,
    '2025-08-15'::date,
    '2025-11-15'::date,
    'https://coursera.org/python-data-science',
    'active'
FROM course_types ct WHERE ct.name = 'coursera'
UNION ALL
SELECT 
    'JavaScript Fundamentals',
    'Basic to Advanced JavaScript concepts',
    ct.id,
    ct.name,
    '2025-07-01'::date,
    '2025-08-31'::date,
    'https://youtube.com/javascript-fundamentals',
    'expired'
FROM course_types ct WHERE ct.name = 'youtube';

-- Create enum for enrollment status (when a user "collects" / enrolls in a course)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'dropped');
    END IF;
END$$;

-- Table to track course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status enrollment_status NOT NULL DEFAULT 'enrolled',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_course UNIQUE(course_id, user_id)
);

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

-- Sample enrollment insert (commented out - requires existing users)
-- INSERT INTO course_enrollments (course_id, user_id, status, progress)
-- VALUES (
--   (SELECT id FROM courses WHERE title = 'React Masterclass' LIMIT 1),
--   (SELECT id FROM users LIMIT 1),
--   'enrolled', 0
-- );
