
-- 1. Replace overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by all authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authorities can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'authority'::public.app_role));

-- 2. Add UPDATE policy for report-media bucket (own folder only)
CREATE POLICY "Users update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'report-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'report-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 3. Convert SECURITY DEFINER helpers to SECURITY INVOKER.
-- Both functions only read rows the caller can already see under RLS
-- (user_roles: "Users can view own roles"; profiles: "Users can view own profile").
-- All existing call sites pass auth.uid(), so INVOKER works and eliminates
-- definer-privilege exposure without breaking policies.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS public.gov_department
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT department FROM public.profiles WHERE id = auth.uid();
$$;
