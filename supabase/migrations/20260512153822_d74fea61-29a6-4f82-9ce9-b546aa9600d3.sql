CREATE TABLE public.ai_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  complexity text,
  deadline text,
  urgency text,
  client_profile text,
  pricing_style text,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view ai_quotes" ON public.ai_quotes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert ai_quotes" ON public.ai_quotes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);
CREATE POLICY "Admins delete ai_quotes" ON public.ai_quotes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX ai_quotes_created_at_idx ON public.ai_quotes (created_at DESC);