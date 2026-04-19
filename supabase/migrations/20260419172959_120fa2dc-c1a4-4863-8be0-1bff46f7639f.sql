
-- 1) SERVICES: campos para página detalhada
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS target_audience jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deliverables jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duration_estimate text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- Função para gerar slug a partir do título
CREATE OR REPLACE FUNCTION public.slugify(v text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(
    lower(translate(v,
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüçñÑ',
      'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuucnN'
    )),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

-- Preencher slugs existentes
UPDATE public.services
SET slug = public.slugify(title) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL;

ALTER TABLE public.services ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS services_slug_key ON public.services(slug);

-- Trigger para auto-gerar slug em novos
CREATE OR REPLACE FUNCTION public.ensure_service_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify(NEW.title) || '-' || substr(NEW.id::text, 1, 6);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ensure_service_slug ON public.services;
CREATE TRIGGER trg_ensure_service_slug BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.ensure_service_slug();

-- 2) TICKETS
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  guest_name text,
  guest_email text,
  type text NOT NULL CHECK (type IN ('reclamacao','sugestao','bug','duvida')),
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_analise','resolvido','fechado')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta')),
  source text NOT NULL DEFAULT 'chatbot',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets" ON public.tickets FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can open ticket" ON public.tickets FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL)
    OR (auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin manage tickets" ON public.tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete tickets" ON public.tickets FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) TICKET MESSAGES
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_role text NOT NULL CHECK (sender_role IN ('client','admin','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own ticket messages" ON public.ticket_messages FOR SELECT
  USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Insert own ticket messages" ON public.ticket_messages FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

-- 4) Notificação para admin ao abrir ticket
CREATE OR REPLACE FUNCTION public.notify_new_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_user uuid;
BEGIN
  FOR admin_user IN SELECT user_id FROM user_roles WHERE role = 'admin' LOOP
    INSERT INTO notifications(user_id, type, title, message, link)
    VALUES (admin_user, 'ticket', 'Novo ticket: ' || NEW.type,
            NEW.subject, '/dashboard/tickets');
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_new_ticket ON public.tickets;
CREATE TRIGGER trg_notify_new_ticket AFTER INSERT ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_new_ticket();

-- 5) Atualizar documentos legais com menção à IA
UPDATE public.legal_documents
SET content_markdown = content_markdown || E'\n\n## Uso de Inteligência Artificial\n\nA Daina Flow utiliza ferramentas de Inteligência Artificial **como auxiliares** em diversas etapas do trabalho — incluindo análise de dados, geração de propostas, atendimento automatizado (chatbot) e elaboração de documentos.\n\n**Importante:** a IA atua como apoio à análise humana, **nunca a substitui**. Toda entrega final passa pela revisão e validação da Larissa Daina, garantindo qualidade, contexto e responsabilidade profissional sobre o resultado.\n\nVocê tem o direito de saber quando está interagindo com IA e de solicitar atendimento exclusivamente humano a qualquer momento.'
WHERE slug IN ('termos','privacidade','transparencia');
