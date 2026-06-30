-- Switch has_role to SECURITY INVOKER. user_roles already grants SELECT to authenticated
-- and has an RLS policy ("Users view own roles") allowing each user to read their own role,
-- which is sufficient for has_role(auth.uid(), ...) calls used in other policies.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Drop the wildcard Realtime policy. The app does not use Broadcast or Presence;
-- postgres_changes subscriptions continue to be filtered by each table's RLS.
DROP POLICY IF EXISTS "Authenticated can receive realtime" ON realtime.messages;
