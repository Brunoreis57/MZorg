import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── BIDDINGS ──
export function useBiddings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["biddings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("biddings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateBidding() {
  const qc = useQueryClient();
  const { user, logActivity } = useAuth();
  return useMutation({
    mutationFn: async (bidding: any) => {
      const { data, error } = await supabase.from("biddings").insert({ ...bidding, user_id: user!.id }).select().single();
      if (error) throw error;
      await logActivity("create", "licitacao", data.id, `Criou licitação ${data.code}`);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["biddings"] }); toast.success("Licitação criada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateBidding() {
  const qc = useQueryClient();
  const { logActivity } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("biddings").update(updates).eq("id", id);
      if (error) throw error;
      await logActivity("update", "licitacao", id, "Atualizou licitação");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["biddings"] }); toast.success("Licitação atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteBidding() {
  const qc = useQueryClient();
  const { logActivity } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("biddings").delete().eq("id", id);
      if (error) throw error;
      await logActivity("delete", "licitacao", id, "Excluiu licitação");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["biddings"] }); toast.success("Licitação excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── EMPRESAS ──
export function useEmpresas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nome"); // Ordenar por nome (que é a razão social)
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function useCertidoes(empresaId?: string) {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["certidoes", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase.from("certidoes").select("*").eq("empresa_id", empresaId).order("data_vencimento");
            if (error) throw error;
            return data;
        },
        enabled: !!user && !!empresaId,
    });
}

export function useDocumentos(empresaId?: string) {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["documentos", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase.from("documentos").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user && !!empresaId,
    });
}

export function useCreateEmpresa() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (empresa: any) => {
      const { data, error } = await supabase.from("empresas").insert({ ...empresa, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newItem) => { 
        qc.setQueryData(["empresas"], (oldData: any[]) => {
            if (!oldData) return [newItem];
            return [...oldData, newItem].sort((a, b) => a.nome.localeCompare(b.nome));
        });
        qc.invalidateQueries({ queryKey: ["empresas"] }); 
        toast.success("Empresa cadastrada!"); 
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("empresas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empresas"] }); toast.success("Empresa atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empresas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empresas"] }); toast.success("Empresa excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── BUDGETS ──
export function useBudgets(biddingId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["budgets", biddingId],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("*, budget_items(*)").eq("bidding_id", biddingId);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!biddingId,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  const { user, logActivity } = useAuth();
  return useMutation({
    mutationFn: async ({ items, ...budget }: any) => {
      const { data, error } = await supabase.from("budgets").insert({ ...budget, user_id: user!.id }).select().single();
      if (error) throw error;
      if (items && items.length > 0) {
        await supabase.from("budget_items").insert(
          items.map((item: any) => ({ ...item, budget_id: data.id, user_id: user!.id }))
        );
      }
      await logActivity("create", "orcamento", data.id, `Criou orçamento`);
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["budgets", vars.bidding_id] }); toast.success("Orçamento salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("budgets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Orçamento atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bidding_id }: { id: string; bidding_id: string }) => {
      await supabase.from("budget_items").delete().eq("budget_id", id);
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      return { bidding_id };
    },
    onSuccess: (result) => { qc.invalidateQueries({ queryKey: ["budgets", result.bidding_id] }); toast.success("Orçamento removido!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── WON ITEMS ──
export function useWonItems(biddingId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["won_items", biddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("won_items")
        .select("*")
        .eq("bidding_id", biddingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!biddingId,
  });
}

export function useUpsertWonItems() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { bidding_id: string; won_type: string; valor_total_edital: number; valor_km_total: number; items: any }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("won_items")
        .select("id")
        .eq("bidding_id", data.bidding_id)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("won_items").update({
          won_type: data.won_type,
          valor_total_edital: data.valor_total_edital,
          valor_km_total: data.valor_km_total,
          items: data.items,
        }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("won_items").insert({ ...data, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["won_items", vars.bidding_id] }); toast.success("Itens ganhos salvos!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── DAILY SERVICES ──
export function useDailyServices(biddingId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_services", biddingId || "all"],
    queryFn: async () => {
      let q = supabase.from("daily_services").select("*, daily_service_items(*)").order("data", { ascending: false });
      if (biddingId) q = q.eq("bidding_id", biddingId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateDailyService() {
  const qc = useQueryClient();
  const { user, logActivity } = useAuth();
  return useMutation({
    mutationFn: async ({ items, ...service }: any) => {
      const { data, error } = await supabase.from("daily_services").insert({ ...service, user_id: user!.id }).select().single();
      if (error) throw error;
      if (items && items.length > 0) {
        await supabase.from("daily_service_items").insert(
          items.map((item: any) => ({ ...item, service_id: data.id, user_id: user!.id }))
        );
      }
      await logActivity("create", "servico_diario", data.id, `Criou OS`);
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["daily_services"] }); toast.success("OS criada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateDailyService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("daily_services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["daily_services"] }); toast.success("OS atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateDailyServiceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("daily_service_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["daily_services"] }); },
  });
}

export function useDeleteDailyService() {
  const qc = useQueryClient();
  const { logActivity } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_services").delete().eq("id", id);
      if (error) throw error;
      await logActivity("delete", "servico_diario", id, "Excluiu OS");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["daily_services"] }); toast.success("OS excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── EDITAIS+ (ANÁLISE) ──
export function useEditaisAnalise() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["editais_analise"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("editais_analise" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useCreateEditalAnalise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (edital: any) => {
      const { error } = await supabase
        .from("editais_analise" as any)
        .insert({ ...edital, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editais_analise"] }); toast.success("Edital cadastrado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateEditalAnalise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("editais_analise" as any).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editais_analise"] }); toast.success("Edital atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteEditalAnalise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("editais_analise" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editais_analise"] }); toast.success("Edital removido!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useFornecedores() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*, fornecedor_precos(*)")
        .order("nome_fantasia");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateFinancialTransaction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tx: any) => {
      const { data, error } = await supabase.from("financial_transactions").insert({ ...tx, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_transactions"] }); toast.success("Transação registrada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateFinancialTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("financial_transactions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_transactions"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteFinancialTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_transactions"] }); toast.success("Transação excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── PRICING SCENARIOS ──
export function usePricingScenarios(biddingId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pricing_scenarios", biddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_scenarios")
        .select("*")
        .eq("bidding_id", biddingId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!biddingId,
  });
}

export function useCreatePricingScenario() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (scenario: { bidding_id: string; name: string; inputs: any; results: any }) => {
      const { data, error } = await supabase.from("pricing_scenarios").insert({ ...scenario, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["pricing_scenarios", vars.bidding_id] }); toast.success("Cenário salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── PRICING CONFIG ──
export function usePricingConfig(biddingId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pricing_config", biddingId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_configs").select("config").eq("bidding_id", biddingId).maybeSingle();
      if (error) throw error;
      return data?.config;
    },
    enabled: !!user && !!biddingId,
  });
}

export function useUpdatePricingConfig() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ biddingId, config }: { biddingId: string; config: any }) => {
      const { data: existing, error: fetchError } = await supabase.from("pricing_configs").select("id").eq("bidding_id", biddingId).maybeSingle();
      if (fetchError) throw fetchError;
      
      if (existing) {
        const { error } = await supabase.from("pricing_configs").update({ config }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricing_configs").insert({ bidding_id: biddingId, config, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["pricing_config", vars.biddingId] }); toast.success("Configuração salva!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── TASKS ──
export function useTasks(biddingId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", biddingId],
    queryFn: async () => {
      if (biddingId) {
        const { data, error } = await supabase.from("tasks" as any).select("*").eq("bidding_id", biddingId).order("created_at", { ascending: false });
        if (error) throw error;
        return data as any[];
      }
      const { data, error } = await supabase.from("tasks" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (task: any) => {
      const { error } = await supabase.from("tasks").insert({ ...task, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, vars) => { 
        qc.invalidateQueries({ queryKey: ["tasks"] }); 
        if (vars.bidding_id) qc.invalidateQueries({ queryKey: ["tasks", vars.bidding_id] });
        toast.success("Tarefa criada!"); 
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Tarefa atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Tarefa excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── NOTES ──
export function useNotes(biddingId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes", biddingId],
    queryFn: async () => {
      if (biddingId) {
        const { data, error } = await supabase.from("notes" as any).select("*").eq("bidding_id", biddingId).order("created_at", { ascending: false });
        if (error) throw error;
        return data as any[];
      }
      const { data, error } = await supabase.from("notes" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (note: any) => {
      const { error } = await supabase.from("notes").insert({ ...note, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, vars) => { 
        qc.invalidateQueries({ queryKey: ["notes"] }); 
        if (vars.bidding_id) qc.invalidateQueries({ queryKey: ["notes", vars.bidding_id] });
        toast.success("Nota criada!"); 
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("notes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Nota atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Nota excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── BUDGET ITEMS ──
export function useBudgetItems(budgetId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["budget_items", budgetId],
    queryFn: async () => {
      const { data, error } = await supabase.from("budget_items").select("*").eq("budget_id", budgetId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!budgetId,
  });
}

export function useCreateBudgetItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase.from("budget_items").insert({ ...item, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["budget_items", vars.budget_id] }); qc.invalidateQueries({ queryKey: ["budgets"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("budget_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budget_items"] }); qc.invalidateQueries({ queryKey: ["budgets"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── BIDDING ATTACHMENTS ──
export function useBiddingAttachments(biddingId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bidding_attachments", biddingId],
    queryFn: async () => {
      const { data, error } = await supabase.from("bidding_attachments" as any).select("*").eq("bidding_id", biddingId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && !!biddingId,
  });
}

export function useCreateBiddingAttachment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (attachment: any) => {
      const { error } = await supabase.from("bidding_attachments" as any).insert({ ...attachment, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, vars) => { 
        qc.invalidateQueries({ queryKey: ["bidding_attachments", vars.bidding_id] });
        toast.success("Anexo adicionado!"); 
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteBiddingAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bidding_attachments" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bidding_attachments"] }); toast.success("Anexo removido!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, budget_id }: { id: string; budget_id: string }) => {
      const { error } = await supabase.from("budget_items").delete().eq("id", id);
      if (error) throw error;
      return { budget_id };
    },
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["budget_items", res.budget_id] }); qc.invalidateQueries({ queryKey: ["budgets"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── CONTRACTS ──
export function useContract(biddingId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contract", biddingId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*, contract_items(*)").eq("bidding_id", biddingId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!biddingId,
  });
}

export function useUpsertContract() {
  const qc = useQueryClient();
  const { user, logActivity } = useAuth();
  return useMutation({
    mutationFn: async ({ items, ...contract }: any) => {
      const { data: existing } = await supabase.from("contracts").select("id").eq("bidding_id", contract.bidding_id).maybeSingle();
      let contractId = existing?.id;

      if (existing) {
        const { error } = await supabase.from("contracts").update(contract).eq("id", existing.id);
        if (error) throw error;
        await logActivity("update", "contrato", existing.id, "Atualizou contrato");
      } else {
        const { data, error } = await supabase.from("contracts").insert({ ...contract, user_id: user!.id }).select().single();
        if (error) throw error;
        contractId = data.id;
        await logActivity("create", "contrato", data.id, "Criou contrato");
      }
      return contractId;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["contract", vars.bidding_id] }); toast.success("Contrato salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpsertContractItems() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ contractId, items }: { contractId: string; items: any[] }) => {
        if (items.length > 0) {
            const { error: delError } = await supabase.from("contract_items").delete().eq("contract_id", contractId);
            if (delError) throw delError;
            
            const { error } = await supabase.from("contract_items").insert(
                items.map(i => ({ ...i, contract_id: contractId, user_id: user!.id }))
            );
            if (error) throw error;
        }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useContractItems(contractId?: string) {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["contract_items", contractId],
        queryFn: async () => {
            const { data, error } = await supabase.from("contract_items").select("*").eq("contract_id", contractId!);
            if (error) throw error;
            return data;
        },
        enabled: !!user && !!contractId,
    });
}

// ── FORNECEDORES MUTATIONS ──
export function useCreateFornecedor() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ precos, ...data }: any) => {
      const { data: fornecedor, error } = await supabase.from("fornecedores").insert({ ...data, user_id: user!.id }).select().single();
      if (error) throw error;
      if (precos && precos.length > 0) {
        const { error: precosError } = await supabase.from("fornecedor_precos").insert(
          precos.map((p: any) => ({ ...p, fornecedor_id: fornecedor.id, user_id: user!.id }))
        );
        if (precosError) throw precosError;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); toast.success("Fornecedor criado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateFornecedor() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, precos, ...data }: { id: string; precos?: any[]; [key: string]: any }) => {
      const { error } = await supabase.from("fornecedores").update(data).eq("id", id);
      if (error) throw error;
      if (precos) {
        await supabase.from("fornecedor_precos").delete().eq("fornecedor_id", id);
        if (precos.length > 0) {
          const { error: precosError } = await supabase.from("fornecedor_precos").insert(
            precos.map((p: any) => ({ ...p, fornecedor_id: id, user_id: user!.id }))
          );
          if (precosError) throw precosError;
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); toast.success("Fornecedor atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; nome?: string }) => {
      const { error } = await supabase.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); toast.success("Fornecedor excluído!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── FINANCIAL & SCHEDULE ──
export function useFinancialTransactions(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["financial_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_transactions").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && enabled,
  });
}

export function usePaymentSchedule(contractId?: string, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["payment_schedules", contractId || "all"],
    queryFn: async () => {
      let q = supabase.from("payment_schedule").select("*").order("expected_date");
      if (contractId) q = q.eq("contract_id", contractId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user && enabled,
  });
}

export function useUpdatePaymentSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("payment_schedule").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment_schedules"] }); toast.success("Cronograma atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useFinanceAllowed() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["finance_allowed", user?.id || "anon"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("is_finance_allowed");
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

// ── CONTRACT HELPERS ──
export function useCreateContract() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (contract: any) => {
      const { data, error } = await supabase.from("contracts").insert({ ...contract, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["contract", vars.bidding_id] }); toast.success("Contrato criado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("contracts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract"] }); toast.success("Contrato atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── CERTIDOES ──
export function useCreateCertidao() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (cert: any) => {
      const { error } = await supabase.from("certidoes").insert({ ...cert, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empresas"] }); toast.success("Certidão adicionada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateCertidao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("certidoes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empresas"] }); toast.success("Certidão atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteCertidao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certidoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empresas"] }); toast.success("Certidão excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── DOCUMENTOS ──
export function useCreateDocumento() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (doc: any) => {
      const { error } = await supabase.from("documentos").insert({ ...doc, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empresas"] }); toast.success("Documento salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empresas"] }); toast.success("Documento excluído!"); },
    onError: (e: any) => toast.error(e.message),
  });
}
