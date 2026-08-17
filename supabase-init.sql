-- Supabase / Postgres schema for Addis Hospitality (run in SQL editor)

-- Users / profiles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text,
  role text NOT NULL DEFAULT 'employee',
  full_name text,
  phone text,
  status text DEFAULT 'pending',
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  status_note text,
  reviewed_by uuid REFERENCES profiles(id)
);

-- Employee-specific profile data
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_url text,
  desired_position text,
  years_experience integer,
  preferred_cities text,
  expected_salary_min integer,
  expected_salary_max integer,
  skills text[],
  bio text,
  highest_education text,
  employment_type text,
  availability text,
  willing_to_relocate boolean
);

-- Company-specific profile data
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text,
  logo_url text,
  trade_license_number text,
  tin_number text,
  year_established integer,
  employee_count integer,
  website text,
  contact_person text,
  contact_position text,
  contact_phone text,
  contact_email text,
  region text,
  sub_city text,
  address text,
  is_verified boolean DEFAULT false,
  business_type text
);

-- Documents uploaded by users
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text,
  file_name text,
  file_path text,
  file_size bigint,
  status text DEFAULT 'pending',
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  review_note text
);

-- Avatars / logos mapping (optional, storage handled separately)
CREATE TABLE IF NOT EXISTS avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  bucket text,
  file_path text,
  content_type text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents (owner_id);

-- Recruitment workflow. Keep IDs tied to profiles.id so the same schema can
-- support Supabase Auth once profiles are provisioned from auth.users.
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  employment_type text NOT NULL,
  experience_required integer NOT NULL DEFAULT 0 CHECK (experience_required >= 0),
  skills text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  salary_min integer CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max integer CHECK (salary_max IS NULL OR salary_max >= salary_min),
  application_deadline timestamptz,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft','pending_review','published','closed','expired','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','shortlisted','interview','hired','rejected','withdrawn')),
  match_score smallint CHECK (match_score BETWEEN 0 AND 100),
  cover_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, employee_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  meeting_type text NOT NULL CHECK (meeting_type IN ('in_person','phone','video')),
  location_or_link text NOT NULL,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','accepted','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, author_id),
  CHECK (author_id <> subject_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','past_due','cancelled','expired')),
  current_period_end timestamptz,
  gateway_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_etb numeric(12,2) NOT NULL CHECK (amount_etb >= 0),
  transaction_type text NOT NULL CHECK (transaction_type IN ('subscription','premium_posting','cv_download','refund')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  gateway_reference text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_status ON jobs (company_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_published_deadline ON jobs (status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications (job_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_employee ON applications (employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at, created_at DESC);

-- Seed admin (change password/hashing as needed)
INSERT INTO profiles (id, email, password, role, full_name, phone, status, email_verified)
VALUES ('00000000-0000-0000-0000-000000000001','admin@addishospitality.et','AddisAdmin2026!','admin','Admin','+251911000000','active', true)
ON CONFLICT (email) DO NOTHING;

-- Notes:
-- 1) Supabase storage buckets are managed via the UI; you can create a bucket named "documents" and "avatars".
-- 2) Adjust constraints, types, and policies for production (RLS policies, password hashing, etc.).
