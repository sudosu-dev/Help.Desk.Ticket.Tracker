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
    created_at, updated_at, due_date, resolved_at,
    first_response_due_at, resolution_due_at,
    first_responded_at, sla_status
) VALUES
(
    -- Ticket 1: John (User), Unassigned, Medium Priority
    4, NULL, 'Cannot access shared drive', 
    'I''m trying to access the Marketing shared drive (M://) but keep getting an access denied error. Worked fine yesterday.',
    'Open', 'Medium', 'Network Access',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '3 days', NULL,
    (NOW() - INTERVAL '2 hours') + INTERVAL '8 hours', (NOW() - INTERVAL '2 hours') + INTERVAL '48 hours', NULL, 'Pending' -- (SLA V1)
),
(
    -- Ticket 2: Alice (User), Assigned to Jane (Agent), Urgent Priority
    5, 2, 'Email not sending - CRITICAL for client demo!', 
    'My Outlook is stuck. I have a client demo in 1 hour and need to send them the proposal. Urgent help needed!',
    'Open', 'Urgent', 'Software Issue',
    NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '1 hour', NULL,
    (NOW() - INTERVAL '30 minutes') + INTERVAL '2 hours', (NOW() - INTERVAL '30 minutes') + INTERVAL '8 hours', NULL, 'Pending' -- (SLA V1)
),
(
    -- Ticket 3: John (User), Assigned to Jane (Agent), High Priority
    4, 2, 'Printer in Building B offline', 
    'The main printer on the 2nd floor of Building B is showing an error code E505 and won''t print.',
    'In Progress', 'High', 'Hardware Issue',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '1 day', NULL,
    (NOW() - INTERVAL '1 day') + INTERVAL '4 hours', (NOW() - INTERVAL '1 day') + INTERVAL '24 hours', NULL, 'TTFR Breached, TTR Pending' -- (SLA V1)
),
(
    -- Ticket 4: Adeline (Admin), Assigned to Jane (Agent), Medium Priority
    1, 2, 'Request for new software license - Follow Up', 
    'Following up on my request for a license for ''DesignPro X''. Agent Jane asked for department approval, which I will upload as an attachment.',
    'Pending Customer', 'Medium', 'Resource Request',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NULL, NULL,
    (NOW() - INTERVAL '3 days') + INTERVAL '8 hours', (NOW() - INTERVAL '3 days') + INTERVAL '48 hours', (NOW() - INTERVAL '3 days') + INTERVAL '1 hour', 'TTFR Met, TTR Breached' -- (SLA V1)
),
(
    -- Ticket 5: Alice (User), Assigned to Jane (Agent), Medium Priority, Resolved
    5, 2, 'Password reset for internal portal', 
    'Locked myself out of the benefits portal. Can I get a reset?',
    'Resolved', 'Medium', 'Account & Access',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '4 days', -- Resolved 4 days ago
    (NOW() - INTERVAL '5 days') + INTERVAL '8 hours', (NOW() - INTERVAL '5 days') + INTERVAL '48 hours', (NOW() - INTERVAL '5 days') + INTERVAL '1 hour', 'TTFR Met, TTR Met' -- (SLA V1)
),
(
    -- Ticket 6: John (User), Assigned to Jane (Agent), Low Priority, Closed
    4, 2, 'Laptop running slow - initial query', 
    'My laptop has been very sluggish for the past week, especially when opening large files.',
    'Closed', 'Low', 'Hardware Issue',
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days', NULL, NOW() - INTERVAL '40 days', -- Closed 40 days ago
    (NOW() - INTERVAL '45 days') + INTERVAL '24 hours', (NOW() - INTERVAL '45 days') + INTERVAL '120 hours', (NOW() - INTERVAL '45 days') + INTERVAL '10 hours', 'TTFR Met, TTR Met' -- (SLA V1)
),
(
    -- Ticket 7: Adeline (Admin), Unassigned, Urgent Priority
    1, NULL, 'Server room temperature alert', 
    'Received an automated alert that the server room temperature is above recommended levels. Needs immediate investigation.',
    'Open', 'Urgent', 'Hardware Issue',
    NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '4 hours', NULL,
    (NOW() - INTERVAL '5 minutes') + INTERVAL '2 hours', (NOW() - INTERVAL '5 minutes') + INTERVAL '8 hours', NULL, 'Pending' -- (SLA V1)
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

-- =============================================================================
-- SECTION 4: Seed Ticket Comments
-- =============================================================================
INSERT INTO ticket_comments (
    ticket_id, user_id, comment_text, is_internal, parent_comment_id, created_at, updated_at, first_viewed_by_agent_at
) VALUES
(
    -- Comment 1: On Ticket 1 (Requester: John, user_id=4)
    1, 4, 'Just wanted to add that this also affects my colleague, Bob. Any updates?',
    FALSE, NULL, NOW() - INTERVAL '1 hour 30 minutes', NULL, NULL
),
(
    -- Comment 2: On Ticket 1 (Agent Jane, user_id=2 - internal note)
    1, 2, 'Need to check John''s department AD group permissions for M drive. Also, verify if Bob is in the same group.',
    TRUE, NULL, NOW() - INTERVAL '1 hour 15 minutes', NULL, NULL
),
(
    -- Comment 3: On Ticket 2 (Requester: Alice, user_id=5 - urgent ticket)
    2, 5, 'The demo is starting very soon! Is anyone looking at this? It''s critical!',
    FALSE, NULL, NOW() - INTERVAL '20 minutes', NULL, NULL
),
(
    -- Comment 4: On Ticket 2 (Agent Jane, user_id=2 - reply to Alice's comment (Comment ID 3))
    -- Assumes Comment 3 will have comment_id=3 if this is part of a single batch insert.
    2, 2, 'Hi Alice, I''m on it now. Can you confirm if you restarted Outlook? Also, check if you can send email via webmail as a temporary workaround.',
    FALSE, 3, NOW() - INTERVAL '15 minutes', NULL, NULL
),
(
    -- Comment 5: On Ticket 3 (Agent Jane, user_id=2 - public update)
    3, 2, 'Parts ordered for the printer in Building B. Expected arrival in 2 business days. Will update once fixed.',
    FALSE, NULL, NOW() - INTERVAL '22 hours', NULL, NULL
),
(
    -- Comment 6: On Ticket 5 (Resolved ticket, Requester: Alice, user_id=5)
    5, 5, 'Thanks, the password reset worked perfectly!',
    FALSE, NULL, (SELECT resolved_at FROM tickets WHERE ticket_id = 5) + INTERVAL '1 hour', NULL, NULL
);