
-- ═══════════════════════════════════════════════
-- LICITAÇÕES
-- ═══════════════════════════════════════════════
CREATE TABLE public.biddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  object TEXT NOT NULL,
  entity TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  uf TEXT NOT NULL DEFAULT '',
  portal TEXT NOT NULL DEFAULT 'ComprasNet',
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT NOT NULL DEFAULT '09:00',
  status TEXT NOT NULL DEFAULT 'Em Análise',
  type TEXT NOT NULL DEFAULT 'Pregão Eletrônico',
  edital_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.biddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own biddings" ON public.biddings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_biddings_updated_at BEFORE UPDATE ON public.biddings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════
-- ITENS GANHOS
-- ═══════════════════════════════════════════════
CREATE TABLE public.won_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bidding_id UUID NOT NULL REFERENCES public.biddings(id) ON DELETE CASCADE,
  won_type TEXT NOT NULL DEFAULT 'total', -- 'total' or 'itens'
  valor_total_edital NUMERIC NOT NULL DEFAULT 0,
  valor_km_total NUMERIC NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.won_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own won_items" ON public.won_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- EMPRESAS
-- ═══════════════════════════════════════════════
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL DEFAULT '',
  inscricao_estadual TEXT DEFAULT '',
  inscricao_municipal TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  cidade TEXT DEFAULT '',
  uf TEXT DEFAULT '',
  cep TEXT DEFAULT '',
  banco TEXT DEFAULT '',
  agencia TEXT DEFAULT '',
  conta TEXT DEFAULT '',
  pix_chave TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own empresas" ON public.empresas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════
-- CERTIDÕES
-- ═══════════════════════════════════════════════
CREATE TABLE public.certidoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  data_vencimento DATE NOT NULL,
  arquivo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certidoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own certidoes" ON public.certidoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- DOCUMENTOS (EMPRESA)
-- ═══════════════════════════════════════════════
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'documento',
  arquivo_url TEXT,
  data_upload DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documentos" ON public.documentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- FORNECEDORES
-- ═══════════════════════════════════════════════
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT DEFAULT '',
  cnpj TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Van', -- Van, Ônibus, Micro, Máquinas
  cidade TEXT DEFAULT '',
  uf TEXT DEFAULT '',
  contato_whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fornecedores" ON public.fornecedores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════
-- PREÇOS FORNECEDOR
-- ═══════════════════════════════════════════════
CREATE TABLE public.fornecedor_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  veiculo TEXT NOT NULL,
  tipo_cobranca TEXT NOT NULL DEFAULT 'mensal', -- mensal, por_km
  valor NUMERIC NOT NULL DEFAULT 0,
  nome_maquina TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fornecedor_precos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fornecedor_precos" ON public.fornecedor_precos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- CONTRATOS
-- ═══════════════════════════════════════════════
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bidding_id UUID NOT NULL REFERENCES public.biddings(id) ON DELETE CASCADE,
  orgao TEXT NOT NULL DEFAULT '',
  contract_number TEXT NOT NULL DEFAULT '',
  contract_start_date TEXT DEFAULT '',
  contract_end_date TEXT DEFAULT '',
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  payment_cycle TEXT NOT NULL DEFAULT 'mensal',
  estimated_payment_days INTEGER NOT NULL DEFAULT 30,
  supplier_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  supplier_name TEXT DEFAULT '',
  supplier_payment_rule TEXT DEFAULT '',
  supplier_monthly_value NUMERIC NOT NULL DEFAULT 0,
  anticipation_allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contracts" ON public.contracts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════
-- CRONOGRAMA DE PAGAMENTOS
-- ═══════════════════════════════════════════════
CREATE TABLE public.payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  bidding_code TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'entrada', -- entrada, saida
  description TEXT DEFAULT '',
  entity TEXT DEFAULT '',
  expected_date TEXT DEFAULT '',
  actual_date TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'previsto',
  nf_number TEXT,
  nf_status TEXT,
  anticipation_requested BOOLEAN NOT NULL DEFAULT false,
  anticipation_date TEXT,
  health_status TEXT NOT NULL DEFAULT 'em_dia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payment_schedule" ON public.payment_schedule FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- SERVIÇOS DIÁRIOS (ORDENS DE SERVIÇO)
-- ═══════════════════════════════════════════════
CREATE TABLE public.daily_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bidding_id UUID REFERENCES public.biddings(id) ON DELETE SET NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_saida TEXT DEFAULT '07:00',
  previsao_volta TEXT DEFAULT '17:00',
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'agendado', -- agendado, em_andamento, finalizado, faturado
  km_inicial NUMERIC,
  km_final NUMERIC,
  km_total NUMERIC NOT NULL DEFAULT 0,
  foto_odometro TEXT,
  receita_bruta NUMERIC NOT NULL DEFAULT 0,
  impostos NUMERIC NOT NULL DEFAULT 0,
  custo_fornecedor NUMERIC NOT NULL DEFAULT 0,
  lucro_liquido NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily_services" ON public.daily_services FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_daily_services_updated_at BEFORE UPDATE ON public.daily_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════
-- ITENS DA OS
-- ═══════════════════════════════════════════════
CREATE TABLE public.daily_service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.daily_services(id) ON DELETE CASCADE,
  tipo_veiculo TEXT NOT NULL DEFAULT 'van',
  quantidade INTEGER NOT NULL DEFAULT 1,
  origem TEXT DEFAULT '',
  destino TEXT DEFAULT '',
  paradas JSONB NOT NULL DEFAULT '[]'::jsonb,
  passageiros_carga TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_service_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily_service_items" ON public.daily_service_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- ORÇAMENTOS
-- ═══════════════════════════════════════════════
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bidding_id UUID NOT NULL REFERENCES public.biddings(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome TEXT DEFAULT '',
  fornecedor_categoria TEXT DEFAULT '',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT DEFAULT '',
  vinculado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- ITENS DO ORÇAMENTO
-- ═══════════════════════════════════════════════
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT '',
  quantidade NUMERIC NOT NULL DEFAULT 1,
  unidade TEXT NOT NULL DEFAULT 'un',
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budget_items" ON public.budget_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- NOTAS
-- ═══════════════════════════════════════════════
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'yellow',
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════
-- TAREFAS
-- ═══════════════════════════════════════════════
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'media', -- urgente, alta, media, baixa
  completed BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  reminder_date TIMESTAMPTZ,
  linked_bidding TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════
-- CENÁRIOS DE PRECIFICAÇÃO
-- ═══════════════════════════════════════════════
CREATE TABLE public.pricing_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bidding_id UUID NOT NULL REFERENCES public.biddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Cenário',
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pricing_scenarios" ON public.pricing_scenarios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- TRANSAÇÕES FINANCEIRAS (DESPESAS AVULSAS)
-- ═══════════════════════════════════════════════
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'receita', -- receita, despesa
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  nf_number TEXT,
  entity TEXT DEFAULT '',
  supplier_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own financial_transactions" ON public.financial_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
