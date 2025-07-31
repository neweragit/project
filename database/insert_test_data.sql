-- Insert Test Data for 5 Months of Statistics
-- This script will populate all tables with realistic data

-- 1. Insert test accounts
INSERT INTO accounts (id, email, password_hash, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@newera.com', 'hashed_password', '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'john.doe@newera.com', 'hashed_password', '2024-02-01 14:30:00+00', '2024-02-01 14:30:00+00'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'jane.smith@newera.com', 'hashed_password', '2024-02-15 09:15:00+00', '2024-02-15 09:15:00+00'),
('d4e5f6a7-b8c9-0123-defa-456789012345', 'mike.wilson@newera.com', 'hashed_password', '2024-03-01 16:45:00+00', '2024-03-01 16:45:00+00'),
('e5f6a7b8-c9d0-1234-efab-567890123456', 'sarah.jones@newera.com', 'hashed_password', '2024-03-15 11:20:00+00', '2024-03-15 11:20:00+00'),
('f6a7b8c9-d0e1-2345-fabc-678901234567', 'david.brown@newera.com', 'hashed_password', '2024-04-01 13:10:00+00', '2024-04-01 13:10:00+00'),
('a7b8c9d0-e1f2-3456-abcd-789012345678', 'emma.davis@newera.com', 'hashed_password', '2024-04-15 15:30:00+00', '2024-04-15 15:30:00+00'),
('b8c9d0e1-f2a3-4567-bcde-890123456789', 'alex.taylor@newera.com', 'hashed_password', '2024-05-01 08:45:00+00', '2024-05-01 08:45:00+00'),
('c9d0e1f2-a3b4-5678-cdef-901234567890', 'lisa.anderson@newera.com', 'hashed_password', '2024-05-15 12:00:00+00', '2024-05-15 12:00:00+00'),
('d0e1f2a3-b4c5-6789-defa-012345678901', 'robert.garcia@newera.com', 'hashed_password', '2024-06-01 10:30:00+00', '2024-06-01 10:30:00+00');

-- 2. Insert test users
INSERT INTO users (id, account_id, full_name, field_of_interest, role, created_at, updated_at) VALUES
('u1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Admin User', 'Computer Science', 'Administrator', '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00'),
('u2c3d4e5-f6a7-8901-bcde-f23456789012', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'John Doe', 'Physics', 'Member', '2024-02-01 14:30:00+00', '2024-02-01 14:30:00+00'),
('u3d4e5f6-a7b8-9012-cdef-345678901234', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'Jane Smith', 'Chemistry', 'Member', '2024-02-15 09:15:00+00', '2024-02-15 09:15:00+00'),
('u4e5f6a7-b8c9-0123-defa-456789012345', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'Mike Wilson', 'Biology', 'Member', '2024-03-01 16:45:00+00', '2024-03-01 16:45:00+00'),
('u5f6a7b8-c9d0-1234-efab-567890123456', 'e5f6a7b8-c9d0-1234-efab-567890123456', 'Sarah Jones', 'Mathematics', 'Member', '2024-03-15 11:20:00+00', '2024-03-15 11:20:00+00'),
('u6a7b8c9-d0e1-2345-fabc-678901234567', 'f6a7b8c9-d0e1-2345-fabc-678901234567', 'David Brown', 'Engineering', 'Member', '2024-04-01 13:10:00+00', '2024-04-01 13:10:00+00'),
('u7b8c9d0-e1f2-3456-abcd-789012345678', 'a7b8c9d0-e1f2-3456-abcd-789012345678', 'Emma Davis', 'Computer Science', 'Member', '2024-04-15 15:30:00+00', '2024-04-15 15:30:00+00'),
('u8c9d0e1-f2a3-4567-bcde-890123456789', 'b8c9d0e1-f2a3-4567-bcde-890123456789', 'Alex Taylor', 'Physics', 'Member', '2024-05-01 08:45:00+00', '2024-05-01 08:45:00+00'),
('u9d0e1f2-a3b4-5678-cdef-901234567890', 'c9d0e1f2-a3b4-5678-cdef-901234567890', 'Lisa Anderson', 'Chemistry', 'Member', '2024-05-15 12:00:00+00', '2024-05-15 12:00:00+00'),
('u0e1f2a3-b4c5-6789-defa-012345678901', 'd0e1f2a3-b4c5-6789-defa-012345678901', 'Robert Garcia', 'Biology', 'Member', '2024-06-01 10:30:00+00', '2024-06-01 10:30:00+00');

-- 3. Insert field of interest options
INSERT INTO field_of_interest_options (id, name, display_order, is_active, created_at) VALUES
(1, 'Computer Science', 1, true, '2024-01-01 00:00:00+00'),
(2, 'Physics', 2, true, '2024-01-01 00:00:00+00'),
(3, 'Chemistry', 3, true, '2024-01-01 00:00:00+00'),
(4, 'Biology', 4, true, '2024-01-01 00:00:00+00'),
(5, 'Mathematics', 5, true, '2024-01-01 00:00:00+00'),
(6, 'Engineering', 6, true, '2024-01-01 00:00:00+00'),
(7, 'Astronomy', 7, true, '2024-01-01 00:00:00+00'),
(8, 'Geology', 8, true, '2024-01-01 00:00:00+00');

-- 4. Insert events across 5 months
INSERT INTO events (id, title, description, date, time, location, image_url, attendees, max_attendees, created_at, updated_at) VALUES
-- January 2024
('e1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Quantum Computing Workshop', 'Introduction to quantum computing principles and applications', '2024-01-20 14:00:00+00', '14:00:00', 'Main Auditorium', 'https://example.com/quantum.jpg', 25, 50, '2024-01-10 09:00:00+00', '2024-01-10 09:00:00+00'),
('e2c3d4e5-f6a7-8901-bcde-f23456789012', 'AI in Healthcare Seminar', 'Exploring artificial intelligence applications in medical diagnosis', '2024-01-25 16:00:00+00', '16:00:00', 'Conference Room A', 'https://example.com/ai-health.jpg', 18, 30, '2024-01-12 11:00:00+00', '2024-01-12 11:00:00+00'),

-- February 2024
('e3d4e5f6-a7b8-9012-cdef-345678901234', 'Machine Learning Bootcamp', 'Hands-on workshop on machine learning algorithms', '2024-02-05 10:00:00+00', '10:00:00', 'Computer Lab 1', 'https://example.com/ml-bootcamp.jpg', 35, 40, '2024-01-25 14:00:00+00', '2024-01-25 14:00:00+00'),
('e4e5f6a7-b8c9-0123-defa-456789012345', 'Data Science Symposium', 'Advanced topics in data science and analytics', '2024-02-15 13:00:00+00', '13:00:00', 'Main Auditorium', 'https://example.com/data-science.jpg', 42, 60, '2024-02-01 10:00:00+00', '2024-02-01 10:00:00+00'),
('e5f6a7b8-c9d0-1234-efab-567890123456', 'Blockchain Technology Talk', 'Understanding blockchain and cryptocurrency fundamentals', '2024-02-28 15:00:00+00', '15:00:00', 'Conference Room B', 'https://example.com/blockchain.jpg', 22, 35, '2024-02-10 16:00:00+00', '2024-02-10 16:00:00+00'),

-- March 2024
('e6a7b8c9-d0e1-2345-fabc-678901234567', 'Cybersecurity Conference', 'Latest trends in cybersecurity and threat prevention', '2024-03-10 09:00:00+00', '09:00:00', 'Main Auditorium', 'https://example.com/cybersecurity.jpg', 55, 80, '2024-02-20 12:00:00+00', '2024-02-20 12:00:00+00'),
('e7b8c9d0-e1f2-3456-abcd-789012345678', 'Web Development Workshop', 'Modern web development with React and Node.js', '2024-03-20 14:00:00+00', '14:00:00', 'Computer Lab 2', 'https://example.com/web-dev.jpg', 28, 30, '2024-03-01 08:00:00+00', '2024-03-01 08:00:00+00'),
('e8c9d0e1-f2a3-4567-bcde-890123456789', 'Mobile App Development', 'Building iOS and Android applications', '2024-03-30 11:00:00+00', '11:00:00', 'Conference Room A', 'https://example.com/mobile-dev.jpg', 32, 40, '2024-03-15 15:00:00+00', '2024-03-15 15:00:00+00'),

-- April 2024
('e9d0e1f2-a3b4-5678-cdef-901234567890', 'Cloud Computing Summit', 'AWS, Azure, and Google Cloud best practices', '2024-04-05 13:00:00+00', '13:00:00', 'Main Auditorium', 'https://example.com/cloud-summit.jpg', 65, 100, '2024-03-25 10:00:00+00', '2024-03-25 10:00:00+00'),
('e0e1f2a3-b4c5-6789-defa-012345678901', 'DevOps Workshop', 'CI/CD pipelines and automation strategies', '2024-04-15 16:00:00+00', '16:00:00', 'Computer Lab 1', 'https://example.com/devops.jpg', 25, 30, '2024-04-01 09:00:00+00', '2024-04-01 09:00:00+00'),
('e1f2a3b4-c5d6-7890-efab-123456789012', 'Database Design Seminar', 'Advanced database design and optimization', '2024-04-25 10:00:00+00', '10:00:00', 'Conference Room B', 'https://example.com/database.jpg', 38, 50, '2024-04-10 14:00:00+00', '2024-04-10 14:00:00+00'),

-- May 2024
('e2a3b4c5-d6e7-8901-fabc-234567890123', 'Software Architecture Conference', 'Designing scalable software systems', '2024-05-05 14:00:00+00', '14:00:00', 'Main Auditorium', 'https://example.com/architecture.jpg', 45, 70, '2024-04-20 11:00:00+00', '2024-04-20 11:00:00+00'),
('e3b4c5d6-e7f8-9012-abcd-345678901234', 'UI/UX Design Workshop', 'Creating user-friendly interfaces', '2024-05-15 11:00:00+00', '11:00:00', 'Design Studio', 'https://example.com/ui-ux.jpg', 20, 25, '2024-05-01 13:00:00+00', '2024-05-01 13:00:00+00'),
('e4c5d6e7-f8a9-0123-bcde-456789012345', 'Testing and Quality Assurance', 'Best practices for software testing', '2024-05-25 15:00:00+00', '15:00:00', 'Conference Room A', 'https://example.com/testing.jpg', 30, 40, '2024-05-10 16:00:00+00', '2024-05-10 16:00:00+00');

-- 5. Insert contact messages
INSERT INTO contact_messages (id, first_name, last_name, email, subject, message, status, created_at, updated_at) VALUES
('m1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Alice', 'Johnson', 'alice.johnson@email.com', 'General Inquiry', 'I would like to know more about your events', 'read', '2024-01-20 10:30:00+00', '2024-01-21 14:20:00+00'),
('m2c3d4e5-f6a7-8901-bcde-f23456789012', 'Bob', 'Williams', 'bob.williams@email.com', 'Event Registration', 'How do I register for the Quantum Computing Workshop?', 'replied', '2024-01-25 16:45:00+00', '2024-01-26 09:15:00+00'),
('m3d4e5f6-a7b8-9012-cdef-345678901234', 'Carol', 'Miller', 'carol.miller@email.com', 'Partnership Request', 'Interested in partnering for future events', 'unread', '2024-02-10 11:20:00+00', '2024-02-10 11:20:00+00'),
('m4e5f6a7-b8c9-0123-defa-456789012345', 'David', 'Thompson', 'david.thompson@email.com', 'Technical Question', 'Need help with event registration system', 'read', '2024-02-15 14:10:00+00', '2024-02-16 10:30:00+00'),
('m5f6a7b8-c9d0-1234-efab-567890123456', 'Eva', 'Martinez', 'eva.martinez@email.com', 'Feedback', 'Great event! Looking forward to more', 'replied', '2024-03-05 09:45:00+00', '2024-03-06 15:20:00+00'),
('m6a7b8c9-d0e1-2345-fabc-678901234567', 'Frank', 'Anderson', 'frank.anderson@email.com', 'Event Suggestion', 'Would love to see a robotics workshop', 'unread', '2024-03-20 13:30:00+00', '2024-03-20 13:30:00+00'),
('m7b8c9d0-e1f2-3456-abcd-789012345678', 'Grace', 'Taylor', 'grace.taylor@email.com', 'Registration Issue', 'Having trouble registering for events', 'read', '2024-04-10 16:20:00+00', '2024-04-11 11:45:00+00'),
('m8c9d0e1-f2a3-4567-bcde-890123456789', 'Henry', 'Brown', 'henry.brown@email.com', 'General Question', 'What are the upcoming events?', 'replied', '2024-04-25 10:15:00+00', '2024-04-26 14:30:00+00'),
('m9d0e1f2-a3b4-5678-cdef-901234567890', 'Ivy', 'Davis', 'ivy.davis@email.com', 'Technical Support', 'Need help with account access', 'unread', '2024-05-10 12:40:00+00', '2024-05-10 12:40:00+00'),
('m0e1f2a3-b4c5-6789-defa-012345678901', 'Jack', 'Wilson', 'jack.wilson@email.com', 'Event Cancellation', 'Need to cancel my registration', 'read', '2024-05-20 15:50:00+00', '2024-05-21 09:10:00+00');

-- 6. Insert event tickets (simulating ticket purchases)
INSERT INTO event_tickets (id, event_id, user_id, created_at) VALUES
-- January tickets
('t1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e1b2c3d4-e5f6-7890-abcd-ef1234567890', 'u2c3d4e5-f6a7-8901-bcde-f23456789012', '2024-01-15 10:30:00+00'),
('t2c3d4e5-f6a7-8901-bcde-f23456789012', 'e1b2c3d4-e5f6-7890-abcd-ef1234567890', 'u3d4e5f6-a7b8-9012-cdef-345678901234', '2024-01-16 14:20:00+00'),
('t3d4e5f6-a7b8-9012-cdef-345678901234', 'e2c3d4e5-f6a7-8901-bcde-f23456789012', 'u4e5f6a7-b8c9-0123-defa-456789012345', '2024-01-18 09:15:00+00'),

-- February tickets
('t4e5f6a7-b8c9-0123-defa-456789012345', 'e3d4e5f6-a7b8-9012-cdef-345678901234', 'u2c3d4e5-f6a7-8901-bcde-f23456789012', '2024-02-01 11:45:00+00'),
('t5f6a7b8-c9d0-1234-efab-567890123456', 'e3d4e5f6-a7b8-9012-cdef-345678901234', 'u5f6a7b8-c9d0-1234-efab-567890123456', '2024-02-02 16:30:00+00'),
('t6a7b8c9-d0e1-2345-fabc-678901234567', 'e4e5f6a7-b8c9-0123-defa-456789012345', 'u3d4e5f6-a7b8-9012-cdef-345678901234', '2024-02-10 13:20:00+00'),
('t7b8c9d0-e1f2-3456-abcd-789012345678', 'e4e5f6a7-b8c9-0123-defa-456789012345', 'u6a7b8c9-d0e1-2345-fabc-678901234567', '2024-02-12 10:15:00+00'),
('t8c9d0e1-f2a3-4567-bcde-890123456789', 'e5f6a7b8-c9d0-1234-efab-567890123456', 'u7b8c9d0-e1f2-3456-abcd-789012345678', '2024-02-20 15:40:00+00'),

-- March tickets
('t9d0e1f2-a3b4-5678-cdef-901234567890', 'e6a7b8c9-d0e1-2345-fabc-678901234567', 'u2c3d4e5-f6a7-8901-bcde-f23456789012', '2024-03-01 08:30:00+00'),
('t0e1f2a3-b4c5-6789-defa-012345678901', 'e6a7b8c9-d0e1-2345-fabc-678901234567', 'u4e5f6a7-b8c9-0123-defa-456789012345', '2024-03-02 12:45:00+00'),
('t1f2a3b4-c5d6-7890-efab-123456789012', 'e6a7b8c9-d0e1-2345-fabc-678901234567', 'u8c9d0e1-f2a3-4567-bcde-890123456789', '2024-03-05 14:20:00+00'),
('t2a3b4c5-d6e7-8901-fabc-234567890123', 'e7b8c9d0-e1f2-3456-abcd-789012345678', 'u5f6a7b8-c9d0-1234-efab-567890123456', '2024-03-15 09:10:00+00'),
('t3b4c5d6-e7f8-9012-abcd-345678901234', 'e8c9d0e1-f2a3-4567-bcde-890123456789', 'u6a7b8c9-d0e1-2345-fabc-678901234567', '2024-03-20 16:50:00+00'),

-- April tickets
('t4c5d6e7-f8a9-0123-bcde-456789012345', 'e9d0e1f2-a3b4-5678-cdef-901234567890', 'u2c3d4e5-f6a7-8901-bcde-f23456789012', '2024-04-01 10:25:00+00'),
('t5d6e7f8-a9b0-1234-cdef-567890123456', 'e9d0e1f2-a3b4-5678-cdef-901234567890', 'u3d4e5f6-a7b8-9012-cdef-345678901234', '2024-04-02 13:40:00+00'),
('t6e7f8a9-b0c1-2345-defa-678901234567', 'e0e1f2a3-b4c5-6789-defa-012345678901', 'u7b8c9d0-e1f2-3456-abcd-789012345678', '2024-04-10 11:15:00+00'),
('t7f8a9b0-c1d2-3456-efab-789012345678', 'e1f2a3b4-c5d6-7890-efab-123456789012', 'u9d0e1f2-a3b4-5678-cdef-901234567890', '2024-04-20 15:30:00+00'),

-- May tickets
('t8a9b0c1-d2e3-4567-fabc-890123456789', 'e2a3b4c5-d6e7-8901-fabc-234567890123', 'u2c3d4e5-f6a7-8901-bcde-f23456789012', '2024-05-01 08:45:00+00'),
('t9b0c1d2-e3f4-5678-abcd-901234567890', 'e2a3b4c5-d6e7-8901-fabc-234567890123', 'u4e5f6a7-b8c9-0123-defa-456789012345', '2024-05-02 12:20:00+00'),
('t0c1d2e3-f4a5-6789-bcde-012345678901', 'e3b4c5d6-e7f8-9012-abcd-345678901234', 'u0e1f2a3-b4c5-6789-defa-012345678901', '2024-05-10 14:35:00+00'),
('t1d2e3f4-a5b6-7890-cdef-123456789012', 'e4c5d6e7-f8a9-0123-bcde-456789012345', 'u8c9d0e1-f2a3-4567-bcde-890123456789', '2024-05-15 10:50:00+00');

-- 7. Insert admin actions
INSERT INTO admin_actions (id, admin_name, action_type, table_name, record_id, details, created_at) VALUES
('aa1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Admin User', 'CREATE', 'events', 'e1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Created Quantum Computing Workshop', '2024-01-10 09:00:00+00'),
('aa2c3d4e5-f6a7-8901-bcde-f23456789012', 'Admin User', 'CREATE', 'events', 'e2c3d4e5-f6a7-8901-bcde-f23456789012', 'Created AI in Healthcare Seminar', '2024-01-12 11:00:00+00'),
('aa3d4e5f6-a7b8-9012-cdef-345678901234', 'Admin User', 'UPDATE', 'users', 'u2c3d4e5-f6a7-8901-bcde-f23456789012', 'Updated user profile', '2024-02-01 14:30:00+00'),
('aa4e5f6a7-b8c9-0123-defa-456789012345', 'Admin User', 'CREATE', 'events', 'e3d4e5f6-a7b8-9012-cdef-345678901234', 'Created Machine Learning Bootcamp', '2024-01-25 14:00:00+00'),
('aa5f6a7b8-c9d0-1234-efab-567890123456', 'Admin User', 'DELETE', 'events', 'old-event-id', 'Deleted outdated event', '2024-03-15 16:00:00+00'),
('aa6a7b8c9-d0e1-2345-fabc-678901234567', 'Admin User', 'CREATE', 'field_of_interest_options', '8', 'Added new field: Geology', '2024-04-01 10:00:00+00'),
('aa7b8c9d0-e1f2-3456-abcd-789012345678', 'Admin User', 'UPDATE', 'contact_messages', 'm1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Marked message as read', '2024-01-21 14:20:00+00'),
('aa8c9d0e1-f2a3-4567-bcde-890123456789', 'Admin User', 'CREATE', 'events', 'e9d0e1f2-a3b4-5678-cdef-901234567890', 'Created Cloud Computing Summit', '2024-03-25 10:00:00+00');

-- Update event attendees based on ticket count
UPDATE events SET attendees = 2 WHERE id = 'e1b2c3d4-e5f6-7890-abcd-ef1234567890';
UPDATE events SET attendees = 1 WHERE id = 'e2c3d4e5-f6a7-8901-bcde-f23456789012';
UPDATE events SET attendees = 2 WHERE id = 'e3d4e5f6-a7b8-9012-cdef-345678901234';
UPDATE events SET attendees = 2 WHERE id = 'e4e5f6a7-b8c9-0123-defa-456789012345';
UPDATE events SET attendees = 1 WHERE id = 'e5f6a7b8-c9d0-1234-efab-567890123456';
UPDATE events SET attendees = 3 WHERE id = 'e6a7b8c9-d0e1-2345-fabc-678901234567';
UPDATE events SET attendees = 1 WHERE id = 'e7b8c9d0-e1f2-3456-abcd-789012345678';
UPDATE events SET attendees = 1 WHERE id = 'e8c9d0e1-f2a3-4567-bcde-890123456789';
UPDATE events SET attendees = 2 WHERE id = 'e9d0e1f2-a3b4-5678-cdef-901234567890';
UPDATE events SET attendees = 1 WHERE id = 'e0e1f2a3-b4c5-6789-defa-012345678901';
UPDATE events SET attendees = 1 WHERE id = 'e1f2a3b4-c5d6-7890-efab-123456789012';
UPDATE events SET attendees = 2 WHERE id = 'e2a3b4c5-d6e7-8901-fabc-234567890123';
UPDATE events SET attendees = 1 WHERE id = 'e3b4c5d6-e7f8-9012-abcd-345678901234';
UPDATE events SET attendees = 1 WHERE id = 'e4c5d6e7-f8a9-0123-bcde-456789012345'; 