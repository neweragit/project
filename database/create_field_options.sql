-- Create field_of_interest_options table if it doesn't exist
CREATE TABLE IF NOT EXISTS field_of_interest_options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert basic field options
INSERT INTO field_of_interest_options (name, display_order, is_active) VALUES
('Computer Science', 1, true),
('Physics', 2, true),
('Chemistry', 3, true),
('Biology', 4, true),
('Mathematics', 5, true),
('Engineering', 6, true),
('Astronomy', 7, true),
('Geology', 8, true)
ON CONFLICT (name) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_field_options_active ON field_of_interest_options(is_active, display_order); 