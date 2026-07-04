
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS region_state text,
  ADD COLUMN IF NOT EXISTS region_district text,
  ADD COLUMN IF NOT EXISTS region_city text,
  ADD COLUMN IF NOT EXISTS region_municipality text,
  ADD COLUMN IF NOT EXISTS region_pincode text,
  ADD COLUMN IF NOT EXISTS region_lat double precision,
  ADD COLUMN IF NOT EXISTS region_lng double precision,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
