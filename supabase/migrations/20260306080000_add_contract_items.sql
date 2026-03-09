-- ═══════════════════════════════════════════════
-- ITENS DO CONTRATO
-- ═══════════════════════════════════════════════
CREATE TABLE public.contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  item_number INTEGER,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contract_items"
ON public.contract_items FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
