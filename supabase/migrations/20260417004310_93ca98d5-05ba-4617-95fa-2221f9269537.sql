
-- 1) Preço livre nos serviços
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price_text text;

-- 2) Portfólio
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  cover_url text,
  link_url text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view active portfolio"
  ON public.portfolio_items FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage portfolio"
  ON public.portfolio_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_portfolio_updated
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Storage bucket "portfolio"
INSERT INTO storage.buckets (id, name, public)
  VALUES ('portfolio', 'portfolio', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read portfolio bucket"
  ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Admins write portfolio bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update portfolio bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete portfolio bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio' AND has_role(auth.uid(), 'admin'::app_role));

-- 4) Contratos
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho', -- rascunho | enviado | assinado | recusado
  sign_token text UNIQUE,
  signer_name text,
  signer_email text,
  signer_ip text,
  signature_data text,
  signed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage contracts"
  ON public.contracts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "client view own contracts"
  ON public.contracts FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id AND c.user_id = auth.uid())
  );

-- Permite que o portal cliente assine seu próprio contrato (UPDATE limitado via app)
CREATE POLICY "client sign own contract"
  ON public.contracts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id AND c.user_id = auth.uid())
  );

CREATE TRIGGER trg_contracts_updated
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Trigger de notificação para contratos
CREATE OR REPLACE FUNCTION public.notify_contract_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE client_user uuid; admin_user uuid;
BEGIN
  SELECT user_id INTO client_user FROM clients WHERE id = NEW.client_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'enviado' AND client_user IS NOT NULL THEN
    INSERT INTO notifications(user_id, type, title, message, link)
    VALUES (client_user, 'contract', 'Novo contrato recebido', NEW.title, '/portal/contratos');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'enviado' AND client_user IS NOT NULL THEN
        INSERT INTO notifications(user_id, type, title, message, link)
        VALUES (client_user, 'contract', 'Novo contrato recebido', NEW.title, '/portal/contratos');
      ELSIF NEW.status IN ('assinado','recusado') THEN
        FOR admin_user IN SELECT user_id FROM user_roles WHERE role = 'admin' LOOP
          INSERT INTO notifications(user_id, type, title, message, link)
          VALUES (admin_user, 'contract', 'Contrato ' || NEW.status, NEW.title, '/dashboard/contratos');
        END LOOP;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE TRIGGER trg_notify_contract
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.notify_contract_change();
