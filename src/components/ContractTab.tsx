import { useState, useEffect } from "react";
import {
  Building2, Truck, Upload, FastForward,
  CheckCircle2, Plus, Pencil, Save, X, FileSignature, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LoadingButton } from "@/components/LoadingButton";
import {
  useContract, useCreateContract, useUpdateContract,
  usePaymentSchedule, useFornecedores, useContractItems, useUpsertContractItems,
  usePricingConfig
} from "@/hooks/useSupabaseData";
import { CurrencyInput } from "@/components/ui/currency-input";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const cycleLabel: Record<string, string> = { mensal: "Mensal", quinzenal: "Quinzenal", por_medicao: "Por Medição" };

interface ContractFormData {
  orgao: string; contract_number: string; contract_start_date: string; contract_end_date: string;
  monthly_value: number; payment_cycle: string; estimated_payment_days: number;
  supplier_id: string; supplier_name: string; supplier_payment_rule: string;
  supplier_monthly_value: number; anticipation_allowed: boolean;
}

const emptyForm: ContractFormData = {
  orgao: "", contract_number: "", contract_start_date: "", contract_end_date: "",
  monthly_value: 0, payment_cycle: "mensal", estimated_payment_days: 30,
  supplier_id: "", supplier_name: "", supplier_payment_rule: "",
  supplier_monthly_value: 0, anticipation_allowed: true,
};

const vehicleTypes = ["Van", "Ônibus", "Micro", "Máquina"];

export function ContractTab({ biddingId }: { biddingId: string }) {
  const { data: contract, isLoading } = useContract(biddingId);
  const { data: payments } = usePaymentSchedule(contract?.id);
  const { data: fornecedores } = useFornecedores();
  const { data: contractItems } = useContractItems(contract?.id);
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const upsertItems = useUpsertContractItems();

  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState<ContractFormData>(emptyForm);
  const [items, setItems] = useState<{ id: string; description: string; unit_price: number; quantity: number; unit: string; total_price: number }[]>([]);

  useEffect(() => {
    if (contract) {
      setForm({
        orgao: contract.orgao, contract_number: contract.contract_number,
        contract_start_date: contract.contract_start_date || "",
        contract_end_date: contract.contract_end_date || "",
        monthly_value: Number(contract.monthly_value),
        payment_cycle: contract.payment_cycle,
        estimated_payment_days: contract.estimated_payment_days,
        supplier_id: contract.supplier_id || "",
        supplier_name: contract.supplier_name || "",
        supplier_payment_rule: contract.supplier_payment_rule || "",
        supplier_monthly_value: Number(contract.supplier_monthly_value),
        anticipation_allowed: contract.anticipation_allowed,
      });
    }
  }, [contract]);

  useEffect(() => {
    if (contractItems) {
      setItems(contractItems.map((i: any) => ({
        id: i.id, description: i.description, unit_price: i.unit_price, quantity: i.quantity, unit: i.unit, total_price: i.total_price
      })));
    }
  }, [contractItems]);

  const updateForm = (key: keyof ContractFormData, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
  const fornecedoresList = fornecedores || [];

  const handleCreate = () => {
    if (!form.orgao || !form.contract_number) { toast.error("Preencha Órgão e Nº Contrato."); return; }
    const supplier = fornecedoresList.find((s) => s.id === form.supplier_id);
    createContract.mutate({
      bidding_id: biddingId, ...form,
      supplier_name: supplier?.nome_fantasia || form.supplier_name,
    });
    setShowCreateDialog(false);
  };

  const handleSaveEdit = () => {
    if (!contract) return;
    const supplier = fornecedoresList.find((s) => s.id === form.supplier_id);
    
    // Atualiza contrato
    updateContract.mutate({
      id: contract.id, bidding_id: biddingId, ...form,
      supplier_name: supplier?.nome_fantasia || form.supplier_name,
    });

    // Salva itens do fornecedor
    upsertItems.mutate({
      contractId: contract.id,
      items: items.map((i, idx) => ({
        description: i.description,
        unit: i.unit,
        quantity: 1, // Assumindo 1 por padrao se for valor fixo
        unit_price: i.unit_price,
        total_price: i.unit_price, // Simplificacao
        item_number: idx + 1
      }))
    });

    setIsEditing(false);
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), description: "Van", unit_price: 0, quantity: 1, unit: "km", total_price: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Carrega configurações de preço do edital para inicializar valores se estiver vazio
  const { data: pricingConfig } = usePricingConfig(biddingId);
  useEffect(() => {
    const config = pricingConfig as any;
    if (items.length === 0 && config && config.veiculos) {
       // Se não tiver itens, sugere os do pricing config
       const suggestedItems: any[] = [];
       Object.entries(config.veiculos).forEach(([veiculo, data]: [string, any]) => {
           if (data.custoFornecedor > 0) {
               suggestedItems.push({
                   id: crypto.randomUUID(),
                   description: veiculo.charAt(0).toUpperCase() + veiculo.slice(1),
                   unit: 'km',
                   unit_price: data.custoFornecedor,
                   quantity: 1,
                   total_price: 0
               });
           }
       });
       if (suggestedItems.length > 0) setItems(suggestedItems);
    }
  }, [pricingConfig, items.length]);

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (!contract) {
    return (
      <div className="space-y-4">
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileSignature className="h-16 w-16 text-muted-foreground/40" />
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Nenhum contrato vinculado</h3>
              <p className="text-sm text-muted-foreground max-w-md">Crie um contrato para gerenciar o fluxo financeiro.</p>
            </div>
            <Button className="gap-2" onClick={() => { setForm(emptyForm); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4" />Criar Contrato
            </Button>
          </CardContent>
        </Card>
        <ContractFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} title="Criar Novo Contrato" form={form} updateForm={updateForm} onSave={handleCreate} saveLabel="Criar Contrato" loading={createContract.isPending} fornecedores={fornecedoresList} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{contract.contract_number}</h3>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">Ativo</Badge>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}><X className="h-3.5 w-3.5" /></Button>
            <LoadingButton size="sm" className="gap-1" onClick={handleSaveEdit} loading={updateContract.isPending}><Save className="h-3.5 w-3.5" />Salvar</LoadingButton>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-success/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-success" />Contrato com o Órgão (Receita)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1.5"><Label className="text-xs">Órgão</Label><Input value={form.orgao} onChange={(e) => updateForm("orgao", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Nº Contrato</Label><Input value={form.contract_number} onChange={(e) => updateForm("contract_number", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Início</Label><Input type="date" value={form.contract_start_date} onChange={(e) => updateForm("contract_start_date", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Término</Label><Input type="date" value={form.contract_end_date} onChange={(e) => updateForm("contract_end_date", e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Valor Mensal (R$)</Label><CurrencyInput value={form.monthly_value} onChange={(v) => updateForm("monthly_value", v)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Periodicidade</Label>
                  <Select value={form.payment_cycle} onValueChange={(v) => updateForm("payment_cycle", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="mensal">Mensal</SelectItem><SelectItem value="quinzenal">Quinzenal</SelectItem><SelectItem value="por_medicao">Por Medição</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Prazo Repasse (dias)</Label><Input type="number" value={form.estimated_payment_days} onChange={(e) => updateForm("estimated_payment_days", parseInt(e.target.value) || 0)} /></div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: "Órgão", value: contract.orgao },
                  { label: "Nº Contrato", value: contract.contract_number },
                  { label: "Vigência", value: `${contract.contract_start_date || "—"} → ${contract.contract_end_date || "—"}` },
                  { label: "Valor Mensal", value: fmt(Number(contract.monthly_value)) },
                  { label: "Periodicidade", value: cycleLabel[contract.payment_cycle] || contract.payment_cycle },
                  { label: "Prazo Repasse", value: `${contract.estimated_payment_days} dias` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between"><span className="text-sm text-muted-foreground">{item.label}</span><span className="text-sm font-medium text-foreground">{item.value}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-destructive" />Contrato com Fornecedor (Repasse)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1.5"><Label className="text-xs">Fornecedor</Label>
                  <Select value={form.supplier_id} onValueChange={(v) => updateForm("supplier_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
                    <SelectContent>{fornecedoresList.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome_fantasia}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Regra de Pagamento</Label><Input value={form.supplier_payment_rule} onChange={(e) => updateForm("supplier_payment_rule", e.target.value)} /></div>
                
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Valores Acordados</Label>
                  {items.map((item) => (
                    <div key={item.id} className="flex items-end gap-2 p-2 rounded border bg-muted/10">
                      <div className="space-y-1 w-24">
                        <Label className="text-[10px] text-muted-foreground">Veículo</Label>
                        <Select value={item.description} onValueChange={(v) => updateItem(item.id, "description", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {vehicleTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                      {item.description === "Máquina" && (
                         <div className="space-y-1 flex-1">
                            <Label className="text-[10px] text-muted-foreground">Nome da Máquina</Label>
                            <Input className="h-8 text-xs" placeholder="Ex: Retroescavadeira" onChange={(e) => updateItem(item.id, "description", `Máquina - ${e.target.value}`)} />
                         </div>
                      )}
                      <div className="space-y-1 w-20">
                         <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                         <Select value={item.unit} onValueChange={(v) => updateItem(item.id, "unit", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="km">R$/km</SelectItem>
                                <SelectItem value="mes">Mensal</SelectItem>
                                <SelectItem value="hora">R$/h</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label className="text-[10px] text-muted-foreground">Valor</Label>
                        <CurrencyInput className="h-8 text-xs pl-7" value={item.unit_price} onChange={(v) => updateItem(item.id, "unit_price", v)} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addItem} className="w-full gap-2 text-xs h-8"><Plus className="h-3 w-3"/> Adicionar Valor</Button>
                </div>
                
                <div className="flex items-center justify-between pt-2"><Label className="text-xs">Permitir Antecipação</Label><Switch checked={form.anticipation_allowed} onCheckedChange={(v) => updateForm("anticipation_allowed", v)} /></div>
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  {[
                    { label: "Fornecedor", value: contract.supplier_name || "—" },
                    { label: "Regra de Pagamento", value: contract.supplier_payment_rule || "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between"><span className="text-sm text-muted-foreground">{item.label}</span><span className="text-sm font-medium text-foreground">{item.value}</span></div>
                  ))}
                  
                  {items.length > 0 && (
                      <div className="pt-2 space-y-1">
                          <Label className="text-xs font-semibold text-muted-foreground">Valores Acordados</Label>
                          <div className="rounded-md border text-xs overflow-hidden">
                              {items.map((i, idx) => (
                                  <div key={i.id} className={`flex justify-between p-2 ${idx !== items.length - 1 ? 'border-b' : ''}`}>
                                      <span>{i.description}</span>
                                      <span className="font-medium font-mono">{fmt(i.unit_price)} / {i.unit}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="flex justify-between pt-2"><span className="text-sm text-muted-foreground">Antecipação</span><span className="text-sm font-medium text-foreground">{contract.anticipation_allowed ? "✅ Permitida" : "❌ Não Permitida"}</span></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContractFormDialog({ open, onOpenChange, title, form, updateForm, onSave, saveLabel, loading, fornecedores }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Preencha os dados do contrato.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Órgão *</Label><Input value={form.orgao} onChange={(e: any) => updateForm("orgao", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Nº Contrato *</Label><Input value={form.contract_number} onChange={(e: any) => updateForm("contract_number", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Início</Label><Input type="date" value={form.contract_start_date} onChange={(e: any) => updateForm("contract_start_date", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Término</Label><Input type="date" value={form.contract_end_date} onChange={(e: any) => updateForm("contract_end_date", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Valor Mensal (R$)</Label><CurrencyInput value={form.monthly_value} onChange={(v) => updateForm("monthly_value", v)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Fornecedor</Label>
              <Select value={form.supplier_id} onValueChange={(v: any) => updateForm("supplier_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{(fornecedores || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome_fantasia}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <LoadingButton onClick={onSave} loading={loading}>{saveLabel}</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
