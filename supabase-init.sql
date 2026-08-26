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

-- Production auth link. Supabase Auth owns credentials; profiles stores app data only.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS password;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  selected_role text := 'employee';
BEGIN
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND NEW.raw_user_meta_data->>'role' IN ('employee', 'company', 'admin') THEN
    selected_role := NEW.raw_user_meta_data->>'role';
  END IF;

  INSERT INTO public.profiles (id, auth_user_id, email, role, full_name, phone, status, email_verified)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    selected_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE WHEN selected_role = 'admin' THEN 'active' ELSE 'pending' END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    auth_user_id = EXCLUDED.auth_user_id;

  IF selected_role = 'company' THEN
    INSERT INTO public.company_profiles (id, company_name, email, business_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'business_type'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email;
  ELSE
    INSERT INTO public.employee_profiles (id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Employee-specific profile data
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  avatar_status text DEFAULT 'pending',
  gender text,
  date_of_birth date,
  age integer CONSTRAINT employee_profiles_age_nonnegative CHECK (age IS NULL OR age >= 0),
  nationality text,
  marital_status text,
  work_sector text,
  alternative_phone text,
  residence_city text,
  residence_sub_city text,
  residence_woreda text,
  residence_area text,
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  desired_position text,
  years_experience integer,
  preferred_cities text,
  expected_salary_min integer,
  expected_salary_max integer,
  skills text[],
  languages text[] NOT NULL DEFAULT '{}',
  bio text,
  highest_education text,
  employment_type text,
  availability text,
  willing_to_relocate boolean
);
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS marital_status text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS work_sector text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS alternative_phone text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS residence_city text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS residence_sub_city text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS residence_woreda text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS residence_area text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS avatar_status text DEFAULT 'pending';
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'employee_profiles_age_nonnegative'
      AND conrelid = 'public.employee_profiles'::regclass
  ) THEN
    ALTER TABLE public.employee_profiles
      ADD CONSTRAINT employee_profiles_age_nonnegative
      CHECK (age IS NULL OR age >= 0) NOT VALID;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_age(date_of_birth date)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN date_of_birth IS NULL THEN NULL
    ELSE GREATEST(
      date_part('year', age(current_date, date_of_birth))::integer,
      0
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.set_employee_profile_age()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.age := public.calculate_age(NEW.date_of_birth);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_employee_profile_age_before_save ON employee_profiles;
CREATE TRIGGER set_employee_profile_age_before_save
  BEFORE INSERT OR UPDATE OF date_of_birth ON employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_employee_profile_age();

UPDATE employee_profiles
SET age = public.calculate_age(date_of_birth)
WHERE date_of_birth IS NOT NULL;

CREATE TABLE IF NOT EXISTS employee_cvs (
  employee_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE employee_cvs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.prevent_employee_cv_review_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin' AND status = 'active'
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('approved', 'rejected')
      OR NEW.reviewed_at IS NOT NULL
      OR NEW.reviewed_by IS NOT NULL
      OR NEW.review_note IS NOT NULL THEN
      RAISE EXCEPTION 'Only an administrator can approve or reject a CV';
    END IF;
  ELSIF NEW.status IN ('approved', 'rejected')
    OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
    OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
    OR NEW.review_note IS DISTINCT FROM OLD.review_note THEN
    RAISE EXCEPTION 'Only an administrator can approve or reject a CV';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_employee_cv_review_changes ON employee_cvs;
CREATE TRIGGER prevent_employee_cv_review_changes
  BEFORE INSERT OR UPDATE ON employee_cvs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_employee_cv_review_changes();

-- Company-specific profile data
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text,
  email text,
  description text,
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
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS logo_status text;

-- Backfill emails from profiles table if missing
UPDATE public.company_profiles cp
SET email = p.email
FROM public.profiles p
WHERE cp.id = p.id AND (cp.email IS NULL OR cp.email = '');

UPDATE public.employee_profiles ep
SET email = p.email
FROM public.profiles p
WHERE ep.id = p.id AND (ep.email IS NULL OR ep.email = '');

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
CREATE INDEX IF NOT EXISTS idx_employee_cvs_status ON employee_cvs (status);

-- Recruitment workflow. Keep IDs tied to profiles.id so the same schema can
-- support Supabase Auth once profiles are provisioned from auth.users.
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  website_url text,
  employment_type text NOT NULL,
  experience_required integer NOT NULL DEFAULT 0 CHECK (experience_required >= 0),
  min_age integer NOT NULL DEFAULT 18 CHECK (min_age >= 18),
  max_age integer NOT NULL DEFAULT 65 CHECK (max_age >= min_age),
  gender_preference text,
  education_required text,
  skills text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  salary_min integer CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max integer CHECK (salary_max IS NULL OR salary_max >= salary_min),
  application_deadline timestamptz,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft','pending_review','published','closed','expired','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_age integer DEFAULT 18;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_age integer DEFAULT 65;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS gender_preference text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_required text;

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','shortlisted','interview','hired','rejected','withdrawn')),
  match_score smallint CHECK (match_score BETWEEN 0 AND 100),
  cover_note text,
  applicant_gender text,
  applicant_date_of_birth date,
  applicant_age integer CHECK (applicant_age IS NULL OR applicant_age >= 0),
  sent_to_company_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, employee_id)
);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicant_gender text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicant_date_of_birth date;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicant_age integer;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS sent_to_company_at timestamptz;

CREATE TABLE IF NOT EXISTS application_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_note text,
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

-- Admin setup is intentionally linked to Supabase Auth.
-- First create the admin user in Dashboard > Authentication > Users.
-- Then run this command, replacing the email with that Auth user's email:
-- UPDATE public.profiles
-- SET role = 'admin', status = 'active', email_verified = true
-- WHERE auth_user_id = (
--   SELECT id FROM auth.users
--   WHERE lower(email) = lower('admin@addishospitality.et')
-- );

-- RLS helper. The service-owned function avoids recursive profile policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Row-level security for browser clients.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS profiles_applicant_read ON profiles;
CREATE POLICY profiles_applicant_read ON profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.applications
    JOIN public.jobs ON jobs.id = applications.job_id
    WHERE applications.employee_id = profiles.id
      AND jobs.company_id::text = auth.uid()::text
  ));
DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
  USING (id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS employee_profiles_access ON employee_profiles;
CREATE POLICY employee_profiles_access ON employee_profiles FOR ALL TO authenticated
  USING (id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS employee_profiles_read ON employee_profiles;
CREATE POLICY employee_profiles_read ON employee_profiles FOR SELECT TO authenticated
  USING (id::text = auth.uid()::text OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.employee_id = employee_profiles.id AND j.company_id::text = auth.uid()::text
  ));

DROP POLICY IF EXISTS employee_cvs_access ON employee_cvs;
CREATE POLICY employee_cvs_access ON employee_cvs FOR ALL TO authenticated
  USING (employee_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (employee_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS company_profiles_access ON company_profiles;
CREATE POLICY company_profiles_access ON company_profiles FOR ALL TO authenticated
  USING (id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS company_profiles_read ON company_profiles;
CREATE POLICY company_profiles_read ON company_profiles FOR SELECT TO authenticated
  USING (id::text = auth.uid()::text OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.company_id = company_profiles.id AND j.status = 'published'
  ));

DROP POLICY IF EXISTS documents_access ON documents;
CREATE POLICY documents_access ON documents FOR ALL TO authenticated
  USING (owner_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (owner_id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS avatars_access ON avatars;
CREATE POLICY avatars_access ON avatars FOR ALL TO authenticated
  USING (owner_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (owner_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS jobs_read ON jobs;
CREATE POLICY jobs_read ON jobs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS jobs_write ON jobs;
CREATE POLICY jobs_write ON jobs FOR ALL TO authenticated
  USING (company_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (company_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS applications_access ON applications;
DROP POLICY IF EXISTS applications_select ON applications;
CREATE POLICY applications_select ON applications FOR SELECT TO authenticated
  USING (employee_id::text = auth.uid()::text OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.company_id::text = auth.uid()::text
  ));
DROP POLICY IF EXISTS applications_insert ON applications;
CREATE POLICY applications_insert ON applications FOR INSERT TO authenticated
  WITH CHECK (employee_id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS applications_update ON applications;
CREATE POLICY applications_update ON applications FOR UPDATE TO authenticated
  USING (employee_id::text = auth.uid()::text OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.company_id::text = auth.uid()::text
  ))
  WITH CHECK (employee_id::text = auth.uid()::text OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.company_id::text = auth.uid()::text
  ));
DROP POLICY IF EXISTS applications_delete ON applications;
CREATE POLICY applications_delete ON applications FOR DELETE TO authenticated
  USING (employee_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS application_drafts_access ON application_drafts;
CREATE POLICY application_drafts_access ON application_drafts FOR ALL TO authenticated
  USING (employee_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (employee_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS interviews_access ON interviews;
CREATE POLICY interviews_access ON interviews FOR ALL TO authenticated
  USING (company_id::text = auth.uid()::text OR employee_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (company_id::text = auth.uid()::text OR employee_id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS notifications_access ON notifications;
CREATE POLICY notifications_access ON notifications FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS ratings_access ON ratings;
CREATE POLICY ratings_access ON ratings FOR ALL TO authenticated
  USING (author_id::text = auth.uid()::text OR subject_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (author_id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS subscriptions_access ON subscriptions;
CREATE POLICY subscriptions_access ON subscriptions FOR ALL TO authenticated
  USING (company_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (company_id::text = auth.uid()::text OR public.is_admin());
DROP POLICY IF EXISTS payment_transactions_access ON payment_transactions;
CREATE POLICY payment_transactions_access ON payment_transactions FOR ALL TO authenticated
  USING (company_id::text = auth.uid()::text OR public.is_admin())
  WITH CHECK (company_id::text = auth.uid()::text OR public.is_admin());

-- Storage: avatars are public because the existing UI uses getPublicUrl;
-- documents remain private and are accessed through signed URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS avatar_objects_access ON storage.objects;
CREATE POLICY avatar_objects_access ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (owner_id::text = auth.uid()::text OR public.is_admin()))
  WITH CHECK (bucket_id = 'avatars' AND (owner_id::text = auth.uid()::text OR public.is_admin()));
DROP POLICY IF EXISTS document_objects_access ON storage.objects;
CREATE POLICY document_objects_access ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'documents' AND (owner_id::text = auth.uid()::text OR public.is_admin()))
  WITH CHECK (bucket_id = 'documents' AND (owner_id::text = auth.uid()::text OR public.is_admin()));