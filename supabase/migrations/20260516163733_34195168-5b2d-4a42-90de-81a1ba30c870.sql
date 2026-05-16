
CREATE TABLE public.ai_quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.ai_quotes(id) ON DELETE CASCADE,
  changed_by uuid,
  changed_by_email text,
  from_status text,
  to_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_quote_status_history_quote ON public.ai_quote_status_history(quote_id, created_at DESC);

ALTER TABLE public.ai_quote_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view status history" ON public.ai_quote_status_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert status history" ON public.ai_quote_status_history
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.log_ai_quote_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_email text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT email INTO actor_email FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    INSERT INTO public.ai_quote_status_history(quote_id, changed_by, changed_by_email, from_status, to_status)
    VALUES (NEW.id, NEW.user_id, actor_email, NULL, COALESCE(NEW.status, 'rascunho'));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT email INTO actor_email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
    INSERT INTO public.ai_quote_status_history(quote_id, changed_by, changed_by_email, from_status, to_status)
    VALUES (NEW.id, auth.uid(), actor_email, OLD.status, NEW.status);
    RETURN NEW;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ai_quote_status_history ON public.ai_quotes;
CREATE TRIGGER trg_ai_quote_status_history
AFTER INSERT OR UPDATE OF status ON public.ai_quotes
FOR EACH ROW EXECUTE FUNCTION public.log_ai_quote_status_change();
