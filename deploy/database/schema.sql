-- Events table for event management
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    image_url TEXT,
    attendees INTEGER DEFAULT 0,
    max_attendees INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Field of interest options table (better than enum for flexibility)
CREATE TABLE field_of_interest_options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions tracking table
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_name VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the field of interest options
INSERT INTO field_of_interest_options (name, display_order) VALUES
('Medicine', 1),
('Computer Science', 2),
('Science and Technology', 3),
('Material Sciences', 4),
('Engineering', 5),
('Economics and Management', 6),
('Law and Political Science', 7),
('Human and Social Sciences', 8),
('Languages and Literature', 9),
('Double Specialties', 10),
('Petroleum Engineering', 11),
('Other', 12);