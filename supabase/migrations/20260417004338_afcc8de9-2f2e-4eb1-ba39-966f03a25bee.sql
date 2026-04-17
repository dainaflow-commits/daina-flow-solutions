
DROP POLICY IF EXISTS "client sign own contract" ON public.contracts;
CREATE POLICY "client sign own contract"
  ON public.contracts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id AND c.user_id = auth.uid())
  );
