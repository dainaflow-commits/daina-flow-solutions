
-- 1. Revoke EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.notify_new_project_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_new_ticket_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_proposal_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_contract_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_admin_for_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_ai_quote_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_client() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_project_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_legal_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_service_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2. Restrict storage listing on public buckets (direct URLs still work)
DROP POLICY IF EXISTS "Public can read site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read portfolio bucket" ON storage.objects;

-- 3. Tighten leads INSERT (avoid literal `true`)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
ON public.leads FOR INSERT
WITH CHECK (
  length(coalesce(name,'')) > 0
  AND length(coalesce(email,'')) > 0
  AND length(coalesce(message,'')) > 0
);

-- 4. site_settings: restrict public SELECT to allowlisted, non-sensitive keys
DROP POLICY IF EXISTS "Anyone view settings" ON public.site_settings;
CREATE POLICY "Public view safe settings"
ON public.site_settings FOR SELECT
USING (
  key IN ('whatsapp_number','hero_photo_url','about_photo_url','contact_email','linkedin_url')
);

-- 5. user_roles: explicit restrictive policy to block self-insert/update by non-admins
CREATE POLICY "Only admins insert roles"
ON public.user_roles AS RESTRICTIVE FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins update roles"
ON public.user_roles AS RESTRICTIVE FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins delete roles"
ON public.user_roles AS RESTRICTIVE FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Realtime: scope subscriptions to authenticated users
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated can receive realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (true);
