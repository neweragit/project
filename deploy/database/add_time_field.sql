    -- Add time field to events table (PostgreSQL)
    ALTER TABLE events ADD COLUMN time TIME;

    -- Update existing events to have a default time (optional)
    -- UPDATE events SET time = '12:00:00' WHERE time IS NULL;

    -- Add comment to document the field
    COMMENT ON COLUMN events.time IS 'Event time in HH:MM format';

    -- Create contact_messages table for contact form submissions
    CREATE TABLE contact_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add comment to contact_messages table
    COMMENT ON TABLE contact_messages IS 'Contact form submissions from the website';

    -- Create index for better query performance
    CREATE INDEX idx_contact_messages_status ON contact_messages(status);
    CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at); 