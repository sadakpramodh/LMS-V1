-- Add account enablement flag to profiles so administrators can control access
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false;

-- Ensure existing users remain enabled, while new signups will default to disabled
UPDATE public.profiles
SET is_enabled = true
WHERE is_enabled IS NULL;

-- Guarantee the default administrator keeps access
UPDATE public.profiles AS p
SET is_enabled = true
FROM auth.users AS u
WHERE p.id = u.id
  AND u.email = 'sadakpramodh_maduru@welspun.com';

-- Prevent null values for the new column going forward
ALTER TABLE public.profiles
ALTER COLUMN is_enabled SET NOT NULL;

-- Allow administrators to update the profile status for any user
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage profile access"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
