-- Shoghil Database Schema
-- Syria location-based job marketplace

-- ============================================
-- Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- Enums
-- ============================================
CREATE TYPE user_role AS ENUM ('worker', 'employer');
CREATE TYPE phone_visibility AS ENUM ('public', 'request_only');
CREATE TYPE search_radius AS ENUM ('village', 'subdistrict', 'district', 'governorate');
CREATE TYPE job_status AS ENUM ('active', 'filled', 'cancelled');
CREATE TYPE call_request_status AS ENUM ('pending', 'accepted', 'rejected');

-- ============================================
-- Syria Administrative Divisions
-- ============================================
CREATE TABLE governorates (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    governorate_id INTEGER NOT NULL REFERENCES governorates(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION
);

CREATE TABLE subdistricts (
    id SERIAL PRIMARY KEY,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION
);

CREATE TABLE villages (
    id SERIAL PRIMARY KEY,
    subdistrict_id INTEGER NOT NULL REFERENCES subdistricts(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

-- ============================================
-- Job Categories
-- ============================================
CREATE TABLE job_categories (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- ============================================
-- Users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    role user_role,
    name VARCHAR(100),
    avatar_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    governorate_id INTEGER REFERENCES governorates(id),
    district_id INTEGER REFERENCES districts(id),
    subdistrict_id INTEGER REFERENCES subdistricts(id),
    village_id INTEGER REFERENCES villages(id),
    phone_visibility phone_visibility DEFAULT 'request_only',
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Worker Profiles
-- ============================================
CREATE TABLE worker_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_ids INTEGER[] DEFAULT '{}',
    experience_years SMALLINT,
    available_hours SMALLINT,
    available_from TIME,
    available_to TIME,
    search_radius search_radius DEFAULT 'district',
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Employer Profiles
-- ============================================
CREATE TABLE employer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Job Posts
-- ============================================
CREATE TABLE job_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES job_categories(id),
    title VARCHAR(200),
    description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    search_radius search_radius DEFAULT 'district',
    status job_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Call Requests
-- ============================================
CREATE TABLE call_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
    status call_request_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- ============================================
-- Notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OTP Codes
-- ============================================
CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    code_hash VARCHAR(100) NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_location ON users(lat, lng);
CREATE INDEX idx_users_governorate ON users(governorate_id);
CREATE INDEX idx_users_district ON users(district_id);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_worker_profiles_user ON worker_profiles(user_id);
CREATE INDEX idx_worker_categories ON worker_profiles USING GIN(category_ids);

CREATE INDEX idx_job_posts_employer ON job_posts(employer_id);
CREATE INDEX idx_job_posts_category ON job_posts(category_id);
CREATE INDEX idx_job_posts_status ON job_posts(status);
CREATE INDEX idx_job_posts_location ON job_posts(lat, lng);

CREATE INDEX idx_call_requests_from ON call_requests(from_user_id);
CREATE INDEX idx_call_requests_to ON call_requests(to_user_id);
CREATE INDEX idx_call_requests_status ON call_requests(status);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_otp_phone ON otp_codes(phone, expires_at);

CREATE INDEX idx_districts_gov ON districts(governorate_id);
CREATE INDEX idx_subdistricts_dist ON subdistricts(district_id);
CREATE INDEX idx_villages_subdist ON villages(subdistrict_id);
