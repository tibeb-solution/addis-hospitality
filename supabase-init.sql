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
	status text DEFAULT 'active',
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

-- Seed admin (change password/hashing as needed)
INSERT INTO profiles (id, email, password, role, full_name, phone, status)
VALUES ('00000000-0000-0000-0000-000000000001','admin@addishospitality.et','AddisAdmin2026!','admin','Admin','+251911000000','active')
ON CONFLICT (email) DO NOTHING;

-- Employee CV data and review workflow
CREATE TABLE IF NOT EXISTS public.employee_cvs (
	employee_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
	data jsonb NOT NULL DEFAULT '{}'::jsonb,
	status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
	submitted_at timestamptz,
	reviewed_at timestamptz,
	reviewed_by uuid REFERENCES profiles(id),
	review_note text,
	updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their CV"
	ON public.employee_cvs FOR SELECT
	USING (auth.uid() = employee_id);

CREATE POLICY "Employees can create their CV"
	ON public.employee_cvs FOR INSERT
	WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their CV"
	ON public.employee_cvs FOR UPDATE
	USING (auth.uid() = employee_id);

CREATE POLICY "Admins can review employee CVs"
	ON public.employee_cvs FOR ALL
	USING (EXISTS (
		SELECT 1 FROM public.profiles
		WHERE id = auth.uid() AND role = 'admin'
	))
	WITH CHECK (EXISTS (
		SELECT 1 FROM public.profiles
		WHERE id = auth.uid() AND role = 'admin'
	));

-- Notes:
-- 1) Supabase storage buckets are managed via the UI; create "documents" and "avatars".
-- 2) Adjust constraints, types, and policies for production (RLS policies, password hashing, etc.).
whe