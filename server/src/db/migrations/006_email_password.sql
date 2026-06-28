-- ============================================
-- Migration 006: Email + Password auth, reset users
-- ============================================

-- Reset all user-related data (clean start)
DELETE FROM ratings;
DELETE FROM reports;
DELETE FROM call_requests;
DELETE FROM notifications;
DELETE FROM job_posts;
DELETE FROM worker_profiles;
DELETE FROM employer_profiles;
DELETE FROM otp_codes;
DELETE FROM users;

-- Add email and password columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add unique constraint on email (separate from ADD COLUMN for compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END$$;

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
