-- ============================================
-- Migration 008: Admin account "syria"
-- Dedicated admin login (username/password), separate from the user login page.
-- Password is "syria" (bcryptjs, 12 rounds).
-- ============================================

INSERT INTO admins (username, password_hash)
VALUES ('syria', '$2a$12$tw4XrdNnttkE293h7ovH9OR.muUiENl.MRhu11GfTRSSeLszfmHJO')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
