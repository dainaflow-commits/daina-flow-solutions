ALTER TABLE public.ai_quotes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.ai_quotes
  DROP CONSTRAINT IF EXISTS ai_quotes_status_check;

ALTER TABLE public.ai_quotes
  ADD CONSTRAINT ai_quotes_status_check
  CHECK (status IN ('rascunho','enviado','aprovado','faturado'));

CREATE POLICY "Admins update ai_quotes"
ON public.ai_quotes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS ai_quotes_updated_at ON public.ai_quotes;
CREATE TRIGGER ai_quotes_updated_at
BEFORE UPDATE ON public.ai_quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();