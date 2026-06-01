-- =========================================================================
-- DATABASE ALIGNMENT MIGRATION SCRIPT - PHASE 2 (STAGING SAFE)
-- Target: Supabase / PostgreSQL (public schema)
-- Safety: IDEMPOTENT (No DROPs, No DELETEs, No TRUNCATEs, CREATE IF NOT EXISTS)
-- =========================================================================

-- =========================================================================
-- A. public.profiles (Idempotent enrichments)
-- =========================================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- =========================================================================
-- B. public.worker_profiles (Table creation & split schema mapping)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.worker_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text DEFAULT ''::text,
  last_name text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  city text,
  skills text[] DEFAULT '{}'::text[] NOT NULL,
  experience_years integer DEFAULT 0 CHECK (experience_years >= 0) NOT NULL,
  bio text,
  hourly_rate numeric DEFAULT 0 CHECK (hourly_rate >= 0) NOT NULL,
  rating numeric DEFAULT 5.00 CHECK (rating BETWEEN 1.00 AND 5.00) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- C. public.restaurant_profiles (Idempotent column integrations)
-- =========================================================================
ALTER TABLE public.restaurant_profiles
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS vat_number text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS phone text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS address text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- =========================================================================
-- D. public.shifts (Table creation for scheduled matches)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  restaurant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'assigned'::text CHECK (status IN ('assigned', 'scheduled', 'completed', 'no_show', 'cancelled')) NOT NULL,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  checked_in_at timestamp with time zone,
  checked_out_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- E. public.messages (Table alignment with core chat columns)
-- =========================================================================
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- =========================================================================
-- F. public.notifications (Table creation / alignment)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'general'::text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- G. public.reviews (Multidimensional review system)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  reliability_rating integer CHECK (reliability_rating BETWEEN 1 AND 5),
  punctuality_rating integer CHECK (punctuality_rating BETWEEN 1 AND 5),
  professionalism_rating integer CHECK (professionalism_rating BETWEEN 1 AND 5),
  quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- H. public.credit_transactions (Credits history logging)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL, -- e.g., 'purchase', 'consume', 'refund'
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- I. public.subscriptions (Stripe subscriptions mapping)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL,
  status text NOT NULL, -- e.g., 'active', 'canceled', 'past_due'
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- J. Query Optimization Indexes
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_id ON public.worker_profiles(id);
CREATE INDEX IF NOT EXISTS idx_restaurant_profiles_id ON public.restaurant_profiles(id);
CREATE INDEX IF NOT EXISTS idx_shifts_worker_id ON public.shifts(worker_id);
CREATE INDEX IF NOT EXISTS idx_shifts_restaurant_id ON public.shifts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_job_id ON public.shifts(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON public.messages(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
