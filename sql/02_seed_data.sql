-- =============================================================================
-- 02_seed_data.sql
-- Populates the database with sample data for development and testing.
-- Roles seeded by DDL: (1, 'Admin'), (2, 'User'), (3, 'Agent')
-- =============================================================================

-- =============================================================================
-- SECTION 1: Seed Users
-- =============================================================================
INSERT INTO users (
    username, email, password_hash,
    first_name, last_name, phone_number,
    department, profile_image_url, role_id, 
    is_active
) VALUES
(
    'admin_adeline', 'admin.adeline@helpdesk.example.com', '$2b$10$K7zL9NfH0xL8gP6vY3iE7O4jJ2mS5nB1cR9gH2vX1zL0kY3jF4aBc',
    'Adeline', 'Ministrator', '+1-555-0100',
    'IT Operations', NULL,
    1, TRUE -- role_id 1: Admin
),
(
    'agent_jane', 'jane.doe@helpdesk.example.com', '$2b$10$A1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zZaBcDeFgHiJkL', -- Placeholder hash for "password_jane"
    'Jane', 'Doe', '+1-555-0101',
    'Support Team Alpha', 'https://example.com/profiles/jane_doe.jpg',
    3, TRUE -- role_id 3: Agent
),
(
    'agent_mike', 'mike.roe@helpdesk.example.com', '$2b$10$Z0yX9wV8uT7sR6qP5oN4mEl3kJf2hGg1fDcBaS1vY2z0xL9jK8iHg', -- Placeholder hash for "password_mike"
    'Mike', 'Roe', '+1-555-0102',
    'Support Team Bravo', NULL,
    3, FALSE -- role_id 3: Agent, INACTIVE
),
(
    'user_john', 'john.smith@company.example.com', '$2b$10$P4oQ5rS6tU7vW8xY9zZaBcDeFgHiJkLmN1oP2qR3sT4uV5wX6yZ7a', -- Placeholder hash for "password_john"
    'John', 'Smith', '+1-555-0103',
    'Marketing', 'https://example.com/profiles/john_smith.jpg',
    2, TRUE -- role_id 2: User
),
(
    'user_alice', 'alice.w@company.example.com', '$2b$10$S0tU1vW2xY3zZaBcDeFgHiJkLmN1oP2qR3sT4uV5wX6yZ7aP4oQ5r', -- Placeholder hash for "password_alice"
    'Alice', 'Wonder', '+1-555-0104',
    'Sales', NULL,
    2, TRUE -- role_id 2: User
);

-- =============================================================================
-- SECTION 2: Seed Tickets
-- (Assumes user_ids 1-5 correspond to Adeline, Jane, Mike, John, Alice)
-- =============================================================================
INSERT INTO tickets (
    requester_user_id, assignee_user_id, subject,
    description, status, priority, category, 
    created_at, updated_at, due_date, resolved_at
) VALUES
(
    4, NULL, 'Cannot access shared drive', -- John (User), Unassigned
    'I''m trying to access the Marketing shared drive (M://) but keep getting an access denied error. Worked fine yesterday.',
    'Open', 'Medium', 'Network Access',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '3 days', NULL
),
(
    5, 2, 'Email not sending - CRITICAL for client demo!', -- Alice (User), Assigned to Jane (Agent)
    'My Outlook is stuck. I have a client demo in 1 hour and need to send them the proposal. Urgent help needed!',
    'Open', 'Urgent', 'Software Issue',
    NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '1 hour', NULL
),
(
    4, 2, 'Printer in Building B offline', -- John (User), Assigned to Jane (Agent)
    'The main printer on the 2nd floor of Building B is showing an error code E505 and won''t print.',
    'In Progress', 'High', 'Hardware Issue',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '1 day', NULL
),
(
    1, 2, 'Request for new software license - Follow Up', -- Adeline (Admin), Assigned to Jane (Agent)
    'Following up on my request for a license for ''DesignPro X''. Agent Jane asked for department approval, which I will upload as an attachment.',
    'Pending Customer', 'Medium', 'Resource Request',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NULL, NULL -- No due date explicitly set here
),
(
    5, 2, 'Password reset for internal portal', -- Alice (User), Assigned to Jane (Agent)
    'Locked myself out of the benefits portal. Can I get a reset?',
    'Resolved', 'Medium', 'Account & Access',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '4 days' -- Resolved 4 days ago
),
(
    4, 2, 'Laptop running slow - initial query', -- John (User), Assigned to Jane (Agent)
    'My laptop has been very sluggish for the past week, especially when opening large files.',
    'Closed', 'Low', 'Hardware Issue',
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days', NULL, NOW() - INTERVAL '40 days' -- Closed 40 days ago
),
(
    1, NULL, 'Server room temperature alert', -- Adeline (Admin), Unassigned (High priority, needs quick assignment)
    'Received an automated alert that the server room temperature is above recommended levels. Needs immediate investigation.',
    'Open', 'Urgent', 'Hardware Issue',
    NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '4 hours', NULL
);

-- =============================================================================
-- SECTION 3: Seed Ticket Attachments
-- (Assumes ticket_ids 1-7 correspond to the tickets inserted above in order)
-- =============================================================================
INSERT INTO ticket_attachments (
    ticket_id, uploader_user_id, file_url, file_name, file_type, file_size, uploaded_at
) VALUES
(
    -- Attachment for Ticket 1: "Cannot access shared drive" (Ticket Requester: John, user_id=4)
    1, 4, 
    '/uploads/seed_data/ticket_1/access_denied_M_drive.jpg', 
    'access_denied_M_drive.jpg',
    'image/jpeg',
    90 * 1024, -- 90KB
    NOW() - INTERVAL '2 hours' -- Same as ticket creation
),
(
    -- Attachment for Ticket 2: "Email not sending - CRITICAL..." (Ticket Requester: Alice, user_id=5)
    2, 5,
    '/uploads/seed_data/ticket_2/outlook_error_screenshot.png', 
    'outlook_error_screenshot.png',
    'image/png',
    120 * 1024, -- 120KB
    NOW() - INTERVAL '30 minutes' -- Same as ticket creation
),
(
    -- Attachment for Ticket 4: "Request for new software license..." (Ticket Requester: Adeline, user_id=1)
    4, 1,
    '/uploads/seed_data/ticket_4/Department_Approval_DesignProX.pdf', 
    'Department_Approval_DesignProX.pdf',
    'application/pdf',
    250 * 1024, -- 250KB
    NOW() - INTERVAL '1 day' -- Same as when ticket was last updated by Adeline
);
