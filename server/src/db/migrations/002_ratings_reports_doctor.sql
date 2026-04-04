-- ============================================
-- Migration 002: Ratings, Reports, Doctor fields, Work days
-- ============================================

-- Add doctor-specific fields to worker_profiles
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS clinic_name VARCHAR(150);
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS specialty VARCHAR(150);
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS work_days INTEGER[] DEFAULT '{}';

-- ============================================
-- Ratings
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    call_request_id UUID REFERENCES call_requests(id) ON DELETE SET NULL,
    score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id, call_request_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_from_user ON ratings(from_user_id);

-- ============================================
-- Reports
-- ============================================
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE report_reason AS ENUM ('inappropriate', 'fake', 'dating', 'spam', 'harassment', 'other');

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    details TEXT,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Add blocked field to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Add terms accepted
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add avg rating cache to users for fast queries
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
