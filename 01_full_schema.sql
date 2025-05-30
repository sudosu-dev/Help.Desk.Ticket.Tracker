-- =============================================================================
-- Help Desk Ticket System - Full Database Schema (Version 1.0)
-- Last Updated: 2025-05-30
--
-- This script creates all necessary custom types, tables, relationships,
-- and automation (triggers) for the core database structure.
-- It is designed to be re-runnable
-- =============================================================================

-- =============================================================================
-- SECTION 1: Custom Data Type Definitions (ENUMs)
-- Defining ENUM types to ensure data integrity and consistency for
-- ticket status, priority, and category fields.
-- These are created first as they are prerequisites for the 'tickets' table.
-- =============================================================================

-- Extension for trigram index warning
-- CREATE EXTENSION IF NOT EXISTS pg_trgm; --Uncomment 

-- Drop existing types if they exist
DROP TYPE IF EXISTS ticket_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_priority_enum CASCADE;
DROP TYPE IF EXISTS ticket_category_enum CASCADE;

CREATE TYPE ticket_status_enum AS ENUM (
    'Open',
    'In Progress',
    'Pending Customer',
    'Resolved',
    'Closed'
);
COMMENT ON TYPE ticket_status_enum IS 'Defines the allowed workflow statuses for a ticket';

CREATE TYPE ticket_priority_enum AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
);
COMMENT ON TYPE ticket_priority_enum IS 'Defines the allowed priority levels for a ticket';

CREATE TYPE ticket_category_enum AS ENUM (
    'Hardware Issue',
    'Software Issue',
    'Network Access',
    'Account & Access',
    'Resource Request',
    'Facilities Support',
    'HR & Admin Inquiry',
    'General IT Support'
);
COMMENT ON TYPE ticket_category_enum IS 'Defines the allowed categories for classifying a ticket';

-- =============================================================================
-- SECTION 2: Table Definitions
-- Order of creation matters due to foreign key dependencies
-- 1. roles
-- 2. users (depends on roles)
-- 3. tickets (depends on users and ENUMs)
-- 4. ticket_attachments (depends on tickets)
-- =============================================================================

-- =============================================================================
-- Table: roles
-- Stores the different user roles within the system
-- =============================================================================
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (role_id, name) VALUES
(1, 'Admin'),
(2, 'User'),
(3, 'Agent')
ON CONFLICT (role_id) DO NOTHING;

COMMENT ON TABLE roles IS 'Stores the different user roles';
COMMENT ON COLUMN roles.role_id IS 'Unique auto-incrementing identifier for the role';
COMMENT ON COLUMN roles.name IS 'The unique name of the role';

-- =============================================================================
-- Table: users
-- Stores the account details, credentials, and profile information
-- =============================================================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) NOT NULL
        CHECK (phone_number ~ '^[\+]?[0-9\s\-\(\)]{7,30}$'),
    department VARCHAR(100) NULL,
    profile_image_url VARCHAR(512) NULL,
    role_id INTEGER NOT NULL DEFAULT 2, -- User
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY(role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

COMMENT ON TABLE users IS 'Stores user account information, credentials, and profile details';
COMMENT ON COLUMN users.user_id IS 'Unique auto-incrementing identifier for the user';
COMMENT ON COLUMN users.username IS 'User''s unique login identifier';
COMMENT ON COLUMN users.email IS 'User''s unique email address (for communication, password resets)';
COMMENT ON COLUMN users.password_hash IS 'Securely hashed version of the user''s password';
COMMENT ON COLUMN users.first_name IS 'User''s first name';
COMMENT ON COLUMN users.last_name IS 'User''s last name';
COMMENT ON COLUMN users.phone_number IS 'User''s phone number';
COMMENT ON COLUMN users.department IS 'User''s department (optional)';
COMMENT ON COLUMN users.profile_image_url IS 'URL to the user''s profile picture in cloud storage (optional)';
COMMENT ON COLUMN users.role_id IS 'Foreign key referencing roles.role_id, linking user to their role. Defaults to ''User''';
COMMENT ON COLUMN users.is_active IS 'Indicates if the user account is active (TRUE) or disabled (FALSE). Defaults to TRUE';
COMMENT ON COLUMN users.created_at IS 'Timestamp of when the user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of when the user account was last updated (automatically managed by a trigger)';

-- =============================================================================
-- Table: tickets
-- Stores information about support tickets
-- =============================================================================
DROP TABLE IF EXISTS tickets CASCADE;
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    requester_user_id INTEGER NOT NULL,
    assignee_user_id INTEGER NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status ticket_status_enum NOT NULL DEFAULT 'Open',
    priority ticket_priority_enum NOT NULL DEFAULT 'Medium',
    category ticket_category_enum NOT NULL DEFAULT 'General IT Support',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NULL,
    resolved_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_ticket_requester FOREIGN KEY(requester_user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT -- Prevent deleting a user if they have submitted tickets
        ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_assignee FOREIGN KEY(assignee_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL -- If an assigned user is deleted the ticket becomes unassigned
        ON UPDATE CASCADE
);
COMMENT ON TABLE tickets IS 'Stores information about support tickets for the internal help desk system';
COMMENT ON COLUMN tickets.ticket_id IS 'Unique auto-incrementing identifier for the ticket';
COMMENT ON COLUMN tickets.requester_user_id IS 'Foreign key referencing users.user_id, indicating who submitted the ticket';
COMMENT ON COLUMN tickets.assignee_user_id IS 'Foreign key referencing users.user_id, indicating who is assigned to the ticket (optional)';
COMMENT ON COLUMN tickets.subject IS 'A brief title or summary of the ticket/issue';
COMMENT ON COLUMN tickets.description IS 'Detailed description of the issue or request. Defaults to an empty string if not provided';
COMMENT ON COLUMN tickets.status IS 'The current workflow status of the ticket (e.g., Open, In Progress)';
COMMENT ON COLUMN tickets.priority IS 'The urgency or importance level of the ticket (e.g., Low, Medium, High)';
COMMENT ON COLUMN tickets.category IS 'The classification of the ticket for internal support';
COMMENT ON COLUMN tickets.created_at IS 'Timestamp (with time zone) indicating when the ticket was created';
COMMENT ON COLUMN tickets.updated_at IS 'Timestamp (with time zone) indicating when the ticket was last updated (automatically managed by a trigger)';
COMMENT ON COLUMN tickets.due_date IS 'Optional target date by which the ticket should ideally be resolved';
COMMENT ON COLUMN tickets.resolved_at IS 'Timestamp (with time zone) indicating when the ticket was marked as resolved. NULL if not yet resolved';

-- -----------------------------------------------------------------------------
-- Table: ticket_attachments
-- Stores information about files attached to tickets.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS ticket_attachments CASCADE;
CREATE TABLE ticket_attachments (
    attachment_id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NULL,
    file_type VARCHAR(100) NULL,
    file_size INTEGER NULL, --Size in bytes
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_ticket FOREIGN KEY(ticket_id) REFERENCES tickets(ticket_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

COMMENT ON TABLE ticket_attachments IS 'Stores references to files attached to tickets, with links to cloud storage';
COMMENT ON COLUMN ticket_attachments.attachment_id IS 'Unique auto-incrementing identifier for the attachment';
COMMENT ON COLUMN ticket_attachments.ticket_id IS 'Foreign key referencing tickets.ticket_id, linking the attachment to a specific ticket';
COMMENT ON COLUMN ticket_attachments.file_url IS 'URL to the actual file stored in cloud storage';
COMMENT ON COLUMN ticket_attachments.file_name IS 'Original name of the uploaded file (optional)';
COMMENT ON COLUMN ticket_attachments.file_type IS 'MIME type of the file (e.g., ''image/jpeg'', ''application/pdf'') (optional)';
COMMENT ON COLUMN ticket_attachments.file_size IS 'Size of the uploaded file in bytes (optional)';
COMMENT ON COLUMN ticket_attachments.uploaded_at IS 'Timestamp indicating when the file was uploaded';

-- =============================================================================
-- SECTION 3: Automation - Triggers for 'updated_at' Timestamps
-- This function and associated triggers ensure that the 'updated_at'
-- column is automatically updated whenever a row in the specified
-- tables ('users', 'tickets') is modified.
-- =============================================================================

-- Drop existing function and triggers if they exist
DROP FUNCTION IF EXISTS fn_update_timestamp() CASCADE;

-- Generic function to update the 'updated_at' column of any table that has it.
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION fn_update_timestamp() IS 'Generic trigger function to set the updated_at column to the current timestamp upon row modification';

-- Trigger for 'users' table
CREATE TRIGGER trg_users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();
COMMENT ON TRIGGER trg_users_update_timestamp ON users IS 'Automatically updates users.updated_at on row modification';

-- Trigger for 'tickets' table
CREATE TRIGGER trg_tickets_update_timestamp
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();
COMMENT ON TRIGGER trg_tickets_update_timestamp ON tickets IS 'Automatically updates tickets.updated_at on row modification.';

-- =============================================================================
-- SECTION 4: Performance Indexes
-- These indexes optimize common querry patterns
-- Created after all tables and constraints to avoid dependency issues
-- =============================================================================

-- =============================================================================
-- Single column indexes
-- =============================================================================


-- users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets (priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets (category);

-- Tickets table indexes - Foreign Keys (essential for JOINs)
CREATE INDEX IF NOT EXISTS idx_tickets_requester_user_id ON tickets (requester_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_user_id ON tickets (assignee_user_id);

-- Tickets table indexes - Date/Time columns (reporting and sorting)
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets (updated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets (due_date);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON tickets (resolved_at);

-- Ticket attachments indexes
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_at ON ticket_attachments (uploaded_at);

-- -----------------------------------------------------------------------------
-- Composite Indexes - Optimized Query Patterns
-- -----------------------------------------------------------------------------

-- Agent dashboard: "Show me my open/in progress tickets"
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_status ON tickets (assignee_user_id, status);

-- Priority dashboard: "Show urgent tickets by status"
CREATE INDEX IF NOT EXISTS idx_tickets_priority_status ON tickets (priority, status);

-- Time-based status reporting: "Open tickets created this month"
CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON tickets (status, created_at);

-- Department reporting: "Hardware issues by status"
CREATE INDEX IF NOT EXISTS idx_tickets_category_status ON tickets (category, status);

-- SLA monitoring: "Overdue tickets by priority"
CREATE INDEX IF NOT EXISTS idx_tickets_due_date_priority ON tickets (due_date, priority);

-- Resolution time analysis: "Resolved tickets with times"
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at_created_at ON tickets (resolved_at, created_at) 
WHERE resolved_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Specialized Indexes
-- -----------------------------------------------------------------------------

-- Partial index for unassigned tickets (common dashboard view)
CREATE INDEX IF NOT EXISTS idx_tickets_unassigned ON tickets (created_at, priority) 
WHERE assignee_user_id IS NULL;

-- Partial index for overdue tickets (critical monitoring)  
CREATE INDEX IF NOT EXISTS idx_tickets_overdue ON tickets (due_date, priority) 
WHERE due_date < CURRENT_DATE AND status NOT IN ('Resolved', 'Closed');

-- Text search on subject (basic search functionality)
CREATE INDEX IF NOT EXISTS idx_tickets_subject_trgm ON tickets USING gin (subject gin_trgm_ops);
-- Note: Requires CREATE EXTENSION pg_trgm; for trigram similarity

-- Comments explaining index strategy
COMMENT ON INDEX idx_tickets_assignee_status IS 'Optimizes agent dashboard queries for assigned tickets by status';
COMMENT ON INDEX idx_tickets_priority_status IS 'Optimizes urgent/high priority ticket filtering and reporting';
COMMENT ON INDEX idx_tickets_unassigned IS 'Partial index for unassigned ticket queue, filtered to reduce index size';
COMMENT ON INDEX idx_tickets_overdue IS 'Partial index for overdue ticket monitoring';

-- =============================================================================
-- End of Schema Script
-- =============================================================================