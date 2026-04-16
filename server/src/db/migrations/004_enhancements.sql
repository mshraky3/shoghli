-- ============================================
-- Migration 004: Enhancements — last_seen tracking
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
