-- ============================================
-- Migration 007: Employer payment & approval system (Sham Cash, manual review)
-- ============================================

-- Generic admin-editable key/value settings
CREATE TABLE IF NOT EXISTS app_settings (
    key         VARCHAR(50) PRIMARY KEY,
    value       TEXT,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
    ('sham_cash_phone', ''),
    ('employer_fee_amount', '0'),
    ('employer_fee_currency', 'SYP')
ON CONFLICT (key) DO NOTHING;

-- Employer approval status, denormalized onto users for cheap auth-middleware checks
DO $$ BEGIN
    CREATE TYPE employer_approval_status AS ENUM ('pending_payment', 'pending_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS employer_status employer_approval_status;

-- Existing employer rows (if any from before this migration) default to approved
-- so nobody already using the system gets locked out.
UPDATE users SET employer_status = 'approved' WHERE role = 'employer' AND employer_status IS NULL;

-- One application record per employer (re-submission overwrites in place;
-- good enough for manual review at this scale).
CREATE TABLE IF NOT EXISTS employer_applications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_screenshot  TEXT NOT NULL,        -- base64 data URL, same convention as users.avatar_url
    status              employer_approval_status NOT NULL DEFAULT 'pending_review',
    rejection_reason    TEXT,
    reviewed_by         INTEGER REFERENCES admins(id),
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_applications_status ON employer_applications(status);
