-- Tabela de rastreabilidade de consentimento LGPD
CREATE TABLE public.legal_consent_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  slug text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_legal_consent_user ON public.legal_consent_tracking(user_id);
CREATE INDEX idx_legal_consent_slug ON public.legal_consent_tracking(slug);

ALTER TABLE public.legal_consent_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own consent"
ON public.legal_consent_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own consent"
ON public.legal_consent_tracking FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all consent"
ON public.legal_consent_tracking FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));