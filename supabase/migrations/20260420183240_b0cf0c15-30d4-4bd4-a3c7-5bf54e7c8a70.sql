CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.send_new_ticket_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  user_email_v text;
  user_name_v text;
  payload jsonb;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT email, full_name INTO user_email_v, user_name_v FROM profiles WHERE user_id = NEW.user_id LIMIT 1;
  END IF;

  payload := jsonb_build_object(
    'id', NEW.id,
    'type', NEW.type,
    'subject', NEW.subject,
    'description', NEW.description,
    'user_email', user_email_v,
    'user_name', user_name_v,
    'guest_email', NEW.guest_email,
    'guest_name', NEW.guest_name
  );

  PERFORM net.http_post(
    url := 'https://ywmebgthufpzzlxtphde.supabase.co/functions/v1/notify-new-ticket',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := payload
  );

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_send_new_ticket_email ON public.tickets;
CREATE TRIGGER trg_send_new_ticket_email
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.send_new_ticket_email();