
-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  project_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "system/admin insert notifications" ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "users delete own notifications" ON public.notifications FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- ============ NOTIFICATION PREFERENCES ============
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  inapp_messages boolean NOT NULL DEFAULT true,
  inapp_project_status boolean NOT NULL DEFAULT true,
  inapp_proposals boolean NOT NULL DEFAULT true,
  email_messages boolean NOT NULL DEFAULT true,
  email_project_status boolean NOT NULL DEFAULT true,
  email_proposals boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own prefs" ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- ============ PROPOSALS ============
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  intro text,
  valid_until date,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho', -- rascunho|enviada|aceita|recusada|expirada
  signature_data text,
  signed_at timestamptz,
  signer_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proposals_client ON public.proposals(client_id);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage proposals" ON public.proposals FOR ALL
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "client view own proposals" ON public.proposals FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = proposals.client_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "client accept own proposal" ON public.proposals FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = proposals.client_id AND c.user_id = auth.uid()
  ));

CREATE TRIGGER trg_proposals_updated BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROPOSAL ITEMS ============
CREATE TABLE IF NOT EXISTS public.proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pitems_proposal ON public.proposal_items(proposal_id);

ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage items" ON public.proposal_items FOR ALL
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "client view items of own proposals" ON public.proposal_items FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.proposals p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = proposal_items.proposal_id AND c.user_id = auth.uid()
  ));

-- ============ TRIGGER FUNCTIONS for notifications ============

-- Nova mensagem em projeto: notifica o "outro lado"
CREATE OR REPLACE FUNCTION public.notify_new_project_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  client_user uuid;
  proj_title text;
  admin_user uuid;
BEGIN
  SELECT c.user_id, p.title INTO client_user, proj_title
  FROM projects p JOIN clients c ON c.id = p.client_id
  WHERE p.id = NEW.project_id;

  IF NEW.sender_role = 'admin' AND client_user IS NOT NULL THEN
    INSERT INTO notifications(user_id, type, title, message, link, project_id)
    VALUES (client_user, 'message', 'Nova mensagem', 'Você recebeu uma mensagem em ' || COALESCE(proj_title,'seu projeto'), '/portal/projetos/' || NEW.project_id, NEW.project_id);
  ELSIF NEW.sender_role = 'client' THEN
    FOR admin_user IN SELECT user_id FROM user_roles WHERE role = 'admin' LOOP
      INSERT INTO notifications(user_id, type, title, message, link, project_id)
      VALUES (admin_user, 'message', 'Nova mensagem do cliente', COALESCE(proj_title,'Projeto') || ' tem uma nova mensagem', '/dashboard/projetos', NEW.project_id);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_msg ON public.project_messages;
CREATE TRIGGER trg_notify_msg AFTER INSERT ON public.project_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_project_message();

-- Mudança de status de projeto
CREATE OR REPLACE FUNCTION public.notify_project_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE client_user uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT user_id INTO client_user FROM clients WHERE id = NEW.client_id;
    IF client_user IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, message, link, project_id)
      VALUES (client_user, 'project_status', 'Status do projeto atualizado', NEW.title || ' agora está: ' || NEW.status, '/portal/projetos/' || NEW.id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_proj_status ON public.projects;
CREATE TRIGGER trg_notify_proj_status AFTER UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.notify_project_status();

-- Nova proposta enviada / aceita / recusada
CREATE OR REPLACE FUNCTION public.notify_proposal_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE client_user uuid; admin_user uuid;
BEGIN
  SELECT user_id INTO client_user FROM clients WHERE id = NEW.client_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'enviada' AND client_user IS NOT NULL THEN
    INSERT INTO notifications(user_id, type, title, message, link)
    VALUES (client_user, 'proposal', 'Nova proposta recebida', NEW.title, '/portal/propostas');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'enviada' AND client_user IS NOT NULL THEN
        INSERT INTO notifications(user_id, type, title, message, link)
        VALUES (client_user, 'proposal', 'Nova proposta recebida', NEW.title, '/portal/propostas');
      ELSIF NEW.status IN ('aceita','recusada') THEN
        FOR admin_user IN SELECT user_id FROM user_roles WHERE role = 'admin' LOOP
          INSERT INTO notifications(user_id, type, title, message, link)
          VALUES (admin_user, 'proposal', 'Proposta ' || NEW.status, NEW.title, '/dashboard/propostas');
        END LOOP;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_proposal_ins ON public.proposals;
CREATE TRIGGER trg_notify_proposal_ins AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.notify_proposal_change();
DROP TRIGGER IF EXISTS trg_notify_proposal_upd ON public.proposals;
CREATE TRIGGER trg_notify_proposal_upd AFTER UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.notify_proposal_change();

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ============ Promove dainaflow@gmail.com a admin se já existir ============
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'dainaflow@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
