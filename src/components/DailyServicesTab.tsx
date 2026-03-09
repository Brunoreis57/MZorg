import { useState, useMemo, useEffect } from "react";
import type { WonItemsData } from "@/components/WonItemsSection";
import {
  Plus, ClipboardList, MapPin, Truck, Users, Calendar, Clock,
  ChevronDown, ChevronUp, FileDown, Send, CheckCircle2,
  TrendingUp, Route, DollarSign, Calculator, Lock, Trash2,
  Settings, Save, Pencil, X,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { LoadingButton } from "@/components/LoadingButton";
import {
  useDailyServices, useCreateDailyService, useUpdateDailyService,
  useDeleteDailyService, useFornecedores, useCreateFinancialTransaction,
  useUpdateDailyServiceItem, usePricingConfig, useUpdatePricingConfig,
  useContract, useContractItems
} from "@/hooks/useSupabaseData";

import { CurrencyInput } from "@/components/ui/currency-input";

const vehicleLabels: Record<string, string> = { onibus: "Ônibus", van: "Van", caminhao: "Caminhão", maquina: "Máquina" };
const statusConfig: Record<string, { label: string; color: string }> = {
  agendado: { label: "Agendado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  em_andamento: { label: "Em Andamento", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  finalizado: { label: "Finalizado", color: "bg-success/10 text-success border-success/20" },
  faturado: { label: "Faturado", color: "bg-primary/10 text-primary border-primary/20" },
};

function fmt(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v); }

interface VehiclePricing {
  custo: number;
  valor: number;
}

interface PricingConfig {
  impostoFaturamento: number;
  veiculos: Record<string, VehiclePricing>;
}

interface ItemForm {
  tipo_veiculo: string;
  quantidade: number;
  origem: string;
  destino: string;
  passageiros_carga: string;
}

const defaultPricingConfig: PricingConfig = {
  impostoFaturamento: 14.25,
  veiculos: {
    onibus: { custo: 3.20, valor: 4.80 },
    van: { custo: 2.50, valor: 3.50 },
    micro: { custo: 2.80, valor: 4.00 },
    caminhao: { custo: 4.00, valor: 6.00 },
    maquina: { custo: 5.00, valor: 8.00 },
  },
};

const emptyItem = (): ItemForm => ({ tipo_veiculo: "van", quantidade: 1, origem: "", destino: "", passageiros_carga: "" });

export function DailyServicesTab({ biddingId, wonData }: { biddingId: string; wonData?: WonItemsData | null }) {
  const { data: servicesData, isLoading } = useDailyServices(biddingId);
  const { data: fornecedores } = useFornecedores();
  const createService = useCreateDailyService();
  const updateService = useUpdateDailyService();
  const updateServiceItem = useUpdateDailyServiceItem();
  const deleteService = useDeleteDailyService();
  const createTransaction = useCreateFinancialTransaction();

  const [showCreate, setShowCreate] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showClose, setShowClose] = useState<string | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(defaultPricingConfig);
  const [showConfig, setShowConfig] = useState(false);

  const { data: savedConfig } = usePricingConfig(biddingId);
  const { data: contract } = useContract(biddingId);
  const { data: contractItems } = useContractItems(contract?.id);
  const updateConfig = useUpdatePricingConfig();

  useEffect(() => {
    if (wonData && wonData.items && wonData.items.length > 0) {
        // Atualiza os valores cobrados com base nos Itens Ganhos
        const newVeiculos: any = {};
        wonData.items.forEach((item: any) => {
            const tipo = (item.objeto || item.descricao).toLowerCase().includes("van") ? "van" :
                         (item.objeto || item.descricao).toLowerCase().includes("ônibus") ? "onibus" :
                         (item.objeto || item.descricao).toLowerCase().includes("micro") ? "micro" :
                         (item.objeto || item.descricao).toLowerCase().includes("máquina") ? "maquina" :
                         "outros";
            
            if (item.valorKm > 0) {
                // Preserva o custo se já existir, atualiza apenas o valor cobrado
                newVeiculos[tipo] = {
                    custo: pricingConfig.veiculos[tipo]?.custo || 0,
                    valor: item.valorKm
                };
            }
        });

        if (Object.keys(newVeiculos).length > 0) {
            setPricingConfig(prev => ({
                ...prev,
                veiculos: { ...prev.veiculos, ...newVeiculos }
            }));
        }
    }
  }, [wonData]);

  useEffect(() => {
    if (savedConfig) {
      const config = savedConfig as any;
      setPricingConfig((prev) => ({
        ...prev,
        ...config,
        veiculos: {
          ...prev.veiculos,
          ...(config.veiculos || {}),
        },
      }));
    } else if (contractItems && contractItems.length > 0) {
        // Se não tiver config salva, tenta puxar do contrato
        const newVeiculos: any = {};
        contractItems.forEach((item: any) => {
            const tipo = item.description.toLowerCase().includes("van") ? "van" :
                         item.description.toLowerCase().includes("ônibus") ? "onibus" :
                         item.description.toLowerCase().includes("micro") ? "micro" :
                         item.description.toLowerCase().includes("máquina") ? "maquina" :
                         "outros";
            
            // Só atualiza se o valor for válido
            if (item.unit_price > 0) {
                newVeiculos[tipo] = { 
                    custo: item.unit_price, 
                    valor: (pricingConfig.veiculos[tipo]?.valor || 0) 
                };
            }
        });
        
        if (Object.keys(newVeiculos).length > 0) {
            setPricingConfig(prev => ({
                ...prev,
                veiculos: { ...prev.veiculos, ...newVeiculos }
            }));
        }
    }
  }, [savedConfig, contractItems]);

  const services = servicesData || [];
  const fornecedoresList = fornecedores || [];

  // useEffect(() => {
  //   if (wonData && wonData.valorKmTotal > 0) {
  //     setPricingConfig((prev) => ({ ...prev, valorCobradoKm: wonData.valorKmTotal }));
  //   }
  // }, [wonData]);

  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    hora_saida: "07:00",
    previsao_volta: "17:00",
    fornecedor_id: "",
  });
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);

  const [closeForm, setCloseForm] = useState({ kmInicial: 0, kmFinal: 0, kmDireto: 0, modoKm: "direto" as "inicial_final" | "direto", observacoes: "" });
  const [itemDetails, setItemDetails] = useState<Record<string, { km: number; valorKm: number; custoKm: number }>>({});

  const selectedService = useMemo(() => services.find((s) => s.id === showClose), [services, showClose]);

  const openCloseDialog = (s: any) => {
    const details: Record<string, any> = {};
    (s.daily_service_items || []).forEach((i: any) => {
      const saved = (i.paradas as any) || {};
      const tipo = i.tipo_veiculo?.toLowerCase() || "van";
      const config = pricingConfig.veiculos[tipo] || pricingConfig.veiculos["van"] || { custo: 0, valor: 0 };
      
      details[i.id] = { 
        km: saved.km || 0, 
        valorKm: saved.valorKm || config.valor, 
        custoKm: saved.custoKm || config.custo 
      };
    });
    setItemDetails(details);
    setCloseForm({ 
      kmInicial: s.km_inicial || 0, 
      kmFinal: s.km_final || 0, 
      kmDireto: s.km_total || 0, 
      modoKm: s.km_inicial !== null ? "inicial_final" : "direto", 
      observacoes: s.observacoes || "" 
    });
    setShowClose(s.id);
  };

  const kpis = useMemo(() => {
    const finalizados = services.filter((s) => s.status === "finalizado" || s.status === "faturado");
    const totalKm = finalizados.reduce((a, s) => a + Number(s.km_total), 0);
    const totalReceita = finalizados.reduce((a, s) => a + Number(s.receita_bruta), 0);
    const totalCusto = finalizados.reduce((a, s) => a + Number(s.custo_fornecedor), 0);
    const totalImposto = finalizados.reduce((a, s) => a + Number(s.impostos), 0);
    const totalLucro = finalizados.reduce((a, s) => a + Number(s.lucro_liquido), 0);
    return { totalKm, totalReceita, totalCusto, totalImposto, totalLucro, qtd: finalizados.length };
  }, [services]);

  const resetForm = () => {
    setForm({ data: new Date().toISOString().split("T")[0], hora_saida: "07:00", previsao_volta: "17:00", fornecedor_id: "" });
    setItems([emptyItem()]);
    setEditingService(null);
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const openEdit = (s: any) => {
    setForm({
      data: s.data,
      hora_saida: s.hora_saida || "07:00",
      previsao_volta: s.previsao_volta || "17:00",
      fornecedor_id: s.fornecedor_id || "",
    });
    const svcItems = (s.daily_service_items || []).map((i: any) => ({
      tipo_veiculo: i.tipo_veiculo || "van",
      quantidade: i.quantidade || 1,
      origem: i.origem || "",
      destino: i.destino || "",
      passageiros_carga: i.passageiros_carga || "",
    }));
    setItems(svcItems.length > 0 ? svcItems : [emptyItem()]);
    setEditingService(s);
    setShowCreate(true);
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof ItemForm, value: any) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleCreateOrEdit = () => {
    const forn = fornecedoresList.find((f) => f.id === form.fornecedor_id);
    if (!form.fornecedor_id) { toast.error("Selecione um fornecedor."); return; }
    const validItems = items.filter((i) => i.origem && i.destino);
    if (validItems.length === 0) { toast.error("Adicione ao menos um item com origem e destino."); return; }

    if (editingService) {
      updateService.mutate({
        id: editingService.id,
        data: form.data,
        hora_saida: form.hora_saida,
        previsao_volta: form.previsao_volta,
        fornecedor_id: form.fornecedor_id,
        fornecedor_nome: forn?.nome_fantasia || "",
        items: validItems.map((i) => ({ ...i, paradas: [] })),
      });
      toast.success("OS atualizada!");
    } else {
      createService.mutate({
        bidding_id: biddingId,
        data: form.data,
        hora_saida: form.hora_saida,
        previsao_volta: form.previsao_volta,
        fornecedor_id: form.fornecedor_id,
        fornecedor_nome: forn?.nome_fantasia || "",
        status: "agendado",
        items: validItems.map((i) => ({ ...i, paradas: [] })),
      });
    }
    setShowCreate(false);
    resetForm();
  };

  const handleClose = () => {
    let totalKm = 0;
    let totalReceita = 0;
    let totalCusto = 0;

    const hasItems = selectedService?.daily_service_items && selectedService.daily_service_items.length > 0;

    if (hasItems) {
      Object.entries(itemDetails).forEach(([id, d]) => {
        const item = selectedService.daily_service_items.find((i:any) => i.id === id);
        const qtd = item?.quantidade || 1;
        
        totalKm += d.km * qtd;
        totalReceita += (d.km * d.valorKm) * qtd;
        totalCusto += (d.km * d.custoKm) * qtd;
      });
    } else {
      // Lógica para serviço sem itens (legado ou simplificado)
      const defaultVal = pricingConfig.veiculos["van"] || { custo: 0, valor: 0 };
      const kmPercorrido = closeForm.modoKm === "direto" ? closeForm.kmDireto : closeForm.kmFinal - closeForm.kmInicial;
      
      totalKm = kmPercorrido;
      totalReceita = totalKm * defaultVal.valor;
      totalCusto = totalKm * defaultVal.custo;
    }

    if (totalKm <= 0 && hasItems) { 
        // Se tem itens e o KM total deu zero, pode ser que o usuario nao preencheu nada
        // Mas vamos permitir salvar com zero se for intencional, ou alertar?
        // Vamos alertar apenas se realmente for zero
        // toast.error("KM total deve ser positivo."); return; 
    }

    const imp = totalReceita * (pricingConfig.impostoFaturamento / 100);

    const updateData = {
      id: showClose!,
      km_inicial: (!hasItems && closeForm.modoKm !== "direto") ? closeForm.kmInicial : null,
      km_final: (!hasItems && closeForm.modoKm !== "direto") ? closeForm.kmFinal : null,
      km_total: totalKm,
      receita_bruta: totalReceita,
      impostos: imp,
      custo_fornecedor: totalCusto,
      lucro_liquido: totalReceita - imp - totalCusto,
      status: "finalizado",
      observacoes: closeForm.observacoes,
    };

    updateService.mutate(updateData);

    if (hasItems) {
      // Atualiza os itens com os KMs e valores individuais
      Object.entries(itemDetails).forEach(([itemId, detail]) => {
        updateServiceItem.mutate({
          id: itemId,
          paradas: { km: detail.km, valorKm: detail.valorKm, custoKm: detail.custoKm } as any
        });
      });
    }

    setShowClose(null);
    toast.success(selectedService?.status === "finalizado" ? "Valores atualizados!" : "Serviço finalizado!");
  };

  const handleFaturar = (s: any) => {
    updateService.mutate({ id: s.id, status: "faturado" });
    createTransaction.mutate({ type: "receita", amount: s.receita_bruta, description: `Receita OS ${s.data}`, date: s.data, status: "pendente", entity: "Órgão" });
    createTransaction.mutate({ type: "despesa", amount: s.custo_fornecedor, description: `Custo fornecedor OS ${s.data}`, date: s.data, status: "pendente", entity: s.fornecedor_nome });
    toast.success("Faturado! Receita e despesa registradas.");
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    deleteService.mutate(deleteConfirm);
    setDeleteConfirm(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Ordens de Serviço</h2>
        <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-3.5 w-3.5" />Nova OS</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total KM", value: `${kpis.totalKm.toLocaleString("pt-BR")} km`, icon: Route, color: "text-primary" },
          { label: "Receita Bruta", value: fmt(kpis.totalReceita), icon: TrendingUp, color: "text-success" },
          { label: "Impostos", value: fmt(kpis.totalImposto), icon: Calculator, color: "text-amber-500" },
          { label: "Custo Fornec.", value: fmt(kpis.totalCusto), icon: Truck, color: "text-destructive" },
          { label: "Lucro Líquido", value: fmt(kpis.totalLucro), icon: DollarSign, color: "text-success" },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-3"><div className="flex items-center gap-2 mb-1"><k.icon className={`h-4 w-4 ${k.color}`} /><span className="text-xs text-muted-foreground">{k.label}</span></div><p className="text-sm font-mono font-bold text-foreground">{k.value}</p></CardContent></Card>
        ))}
      </div>

      {/* Config */}
      <Collapsible open={showConfig} onOpenChange={setShowConfig}>
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /><div className="text-left"><p className="text-sm font-semibold text-foreground">Configuração de Valores</p></div></div>
              {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Imposto sobre Faturamento (%)</Label>
                <Input type="number" value={pricingConfig.impostoFaturamento} onChange={(e) => setPricingConfig((p) => ({ ...p, impostoFaturamento: parseFloat(e.target.value) || 0 }))} className="font-mono text-sm max-w-[150px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["onibus", "van", "micro"].map((type) => (
                  <div key={type} className="space-y-2 p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-semibold capitalize">{vehicleLabels[type] || type}</p>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Custo Fornecedor (R$/km)</Label>
                      <CurrencyInput 
                        value={pricingConfig.veiculos[type]?.custo || 0} 
                        onChange={(v) => setPricingConfig((p) => ({ ...p, veiculos: { ...p.veiculos, [type]: { ...(p.veiculos[type] || { custo: 0, valor: 0 }), custo: v } } }))} 
                        className="text-xs h-8 pl-7" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Valor Cobrado (R$/km)</Label>
                      <CurrencyInput 
                        value={pricingConfig.veiculos[type]?.valor || 0} 
                        onChange={(v) => setPricingConfig((p) => ({ ...p, veiculos: { ...p.veiculos, [type]: { ...(p.veiculos[type] || { custo: 0, valor: 0 }), valor: v } } }))} 
                        className="text-xs h-8 pl-7" 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <LoadingButton size="sm" className="gap-2" onClick={() => updateConfig.mutate({ biddingId, config: pricingConfig })} loading={updateConfig.isPending}>
                  <Save className="h-4 w-4" />Salvar Configuração
                </LoadingButton>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* List */}
      {services.length === 0 ? (
        <Card className="border-dashed border-2"><CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <ClipboardList className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhuma OS cadastrada</p>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Criar OS</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {services.map((s) => {
            const st = statusConfig[s.status] || statusConfig.agendado;
            return (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={st.color}>{st.label}</Badge>
                      <span className="text-sm font-medium">{s.data}</span>
                      <span className="text-xs text-muted-foreground">{s.hora_saida} - {s.previsao_volta}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.status === "agendado" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openCloseDialog(s)}>Finalizar</Button>
                        </>
                      )}
                      {s.status === "finalizado" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCloseDialog(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" className="gap-1" onClick={() => handleFaturar(s)}><CheckCircle2 className="h-3.5 w-3.5" />Faturar</Button>
                        </>
                      )}
                      {s.status === "faturado" && <Badge variant="outline" className="bg-primary/10 text-primary"><Lock className="h-3 w-3 mr-1" />Faturado</Badge>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{s.fornecedor_nome}</span>
                    {Number(s.km_total) > 0 && <span className="font-mono">{Number(s.km_total)} km</span>}
                    {Number(s.lucro_liquido) > 0 && <span className="font-mono text-success">Lucro: {fmt(Number(s.lucro_liquido))}</span>}
                  </div>
                  {(s.daily_service_items || []).map((item: any) => (
                    <div key={item.id} className="mt-2 p-2 rounded bg-muted/30 text-xs flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">{vehicleLabels[item.tipo_veiculo] || item.tipo_veiculo}</Badge>
                      <span>{item.origem} → {item.destino}</span>
                      {item.passageiros_carga && <span className="text-muted-foreground">({item.passageiros_carga})</span>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
            <DialogDescription>{editingService ? "Altere os dados da OS." : "Preencha os dados da OS."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Data</Label><Input type="date" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Saída</Label><Input type="time" value={form.hora_saida} onChange={(e) => setForm((p) => ({ ...p, hora_saida: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Volta</Label><Input type="time" value={form.previsao_volta} onChange={(e) => setForm((p) => ({ ...p, previsao_volta: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Fornecedor *</Label>
              <Select value={form.fornecedor_id} onValueChange={(v) => setForm((p) => ({ ...p, fornecedor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{fornecedoresList.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Itens da OS</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" />Adicionar Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <Card key={idx} className="relative">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Item {idx + 1}</span>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Veículo</Label>
                        <Select value={item.tipo_veiculo} onValueChange={(v) => updateItem(idx, "tipo_veiculo", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="onibus">Ônibus</SelectItem>
                            <SelectItem value="caminhao">Caminhão</SelectItem>
                            <SelectItem value="maquina">Máquina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quantidade</Label>
                        <Input type="number" min={1} value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", parseInt(e.target.value) || 1)} className="font-mono text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Origem *</Label><Input value={item.origem} onChange={(e) => updateItem(idx, "origem", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Destino *</Label><Input value={item.destino} onChange={(e) => updateItem(idx, "destino", e.target.value)} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Passageiros/Carga</Label><Input value={item.passageiros_carga} onChange={(e) => updateItem(idx, "passageiros_carga", e.target.value)} /></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
            <LoadingButton onClick={handleCreateOrEdit} loading={createService.isPending || updateService.isPending}>
              {editingService ? "Salvar" : "Criar OS"}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={!!showClose} onOpenChange={(open) => !open && setShowClose(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Finalizar Serviço</DialogTitle><DialogDescription>Informe o KM rodado para calcular a rentabilidade.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            {selectedService?.daily_service_items && selectedService.daily_service_items.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Informe o KM rodado para cada item:</p>
                {selectedService.daily_service_items.map((item: any) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{vehicleLabels[item.tipo_veiculo] || item.tipo_veiculo}</span>
                      <span>{item.origem} → {item.destino}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-[10px]">KM Rodado</Label><Input type="number" value={itemDetails[item.id]?.km || 0} onChange={(e) => setItemDetails((prev) => ({ ...prev, [item.id]: { ...prev[item.id], km: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs font-mono" /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Valor (R$/km)</Label><Input type="number" value={itemDetails[item.id]?.valorKm || 0} onChange={(e) => setItemDetails((prev) => ({ ...prev, [item.id]: { ...prev[item.id], valorKm: parseFloat(e.target.value) || 0 } }))} className="h-8 text-xs font-mono" /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Button variant={closeForm.modoKm === "direto" ? "default" : "outline"} size="sm" onClick={() => setCloseForm((p) => ({ ...p, modoKm: "direto" }))}>KM Total Direto</Button>
                  <Button variant={closeForm.modoKm === "inicial_final" ? "default" : "outline"} size="sm" onClick={() => setCloseForm((p) => ({ ...p, modoKm: "inicial_final" }))}>KM Inicial/Final</Button>
                </div>
                {closeForm.modoKm === "direto" ? (
                  <div className="space-y-1.5"><Label className="text-xs">KM Total Rodado</Label><Input type="number" value={closeForm.kmDireto} onChange={(e) => setCloseForm((p) => ({ ...p, kmDireto: parseFloat(e.target.value) || 0 }))} className="font-mono" /></div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">KM Inicial</Label><Input type="number" value={closeForm.kmInicial} onChange={(e) => setCloseForm((p) => ({ ...p, kmInicial: parseFloat(e.target.value) || 0 }))} className="font-mono" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">KM Final</Label><Input type="number" value={closeForm.kmFinal} onChange={(e) => setCloseForm((p) => ({ ...p, kmFinal: parseFloat(e.target.value) || 0 }))} className="font-mono" /></div>
                  </div>
                )}
              </>
            )}
            <div className="space-y-1.5"><Label className="text-xs">Observações</Label><Textarea rows={2} value={closeForm.observacoes} onChange={(e) => setCloseForm((p) => ({ ...p, observacoes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowClose(null)}>Cancelar</Button>
            <LoadingButton onClick={handleClose} loading={updateService.isPending}>Finalizar</LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Excluir OS"
        description="Tem certeza que deseja excluir esta Ordem de Serviço? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        loading={deleteService.isPending}
      />
    </div>
  );
}
