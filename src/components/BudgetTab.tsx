import { useState } from "react";
import {
  Plus, Trash2, Building2, DollarSign, Receipt, LinkIcon, Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LoadingButton } from "@/components/LoadingButton";
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useFornecedores } from "@/hooks/useSupabaseData";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categoriaColor: Record<string, string> = {
  Van: "bg-info/15 text-info border-info/30",
  Ônibus: "bg-warning/15 text-warning border-warning/30",
  Micro: "bg-primary/15 text-primary border-primary/30",
  Máquinas: "bg-success/15 text-success border-success/30",
};

interface OrcamentoItem {
  descricao: string; quantidade: number; unidade: string; valor_unitario: number;
}

export function BudgetTab({ biddingId }: { biddingId: string }) {
  const { data: budgets, isLoading } = useBudgets(biddingId);
  const { data: fornecedores } = useFornecedores();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<OrcamentoItem[]>([{ descricao: "", quantidade: 1, unidade: "un", valor_unitario: 0 }]);

  const orcamentos = budgets || [];
  const fornecedoresList = fornecedores || [];

  const resetForm = () => {
    setSelectedFornecedorId(""); setObservacoes("");
    setItens([{ descricao: "", quantidade: 1, unidade: "un", valor_unitario: 0 }]);
    setEditingId(null);
  };

  const handleSelectFornecedor = (fornecedorId: string) => {
    setSelectedFornecedorId(fornecedorId);
    const f = fornecedoresList.find((x) => x.id === fornecedorId);
    if (f && (f.fornecedor_precos || []).length > 0) {
      const autoItens: OrcamentoItem[] = f.fornecedor_precos.map((p: any) => ({
        descricao: p.nome_maquina
          ? `${p.nome_maquina} - ${p.tipo_cobranca === "mensal" ? "Mensal" : "Por KM"}`
          : `${p.veiculo} - ${p.tipo_cobranca === "mensal" ? "Mensal" : "Por KM"}`,
        quantidade: p.tipo_cobranca === "mensal" ? 1 : 0,
        unidade: p.tipo_cobranca === "mensal" ? "un" : "km",
        valor_unitario: Number(p.valor),
      }));
      setItens(autoItens);
      toast.info(`Preços de ${f.nome_fantasia} carregados automaticamente!`);
    }
  };

  const addItem = () => setItens((prev) => [...prev, { descricao: "", quantidade: 1, unidade: "un", valor_unitario: 0 }]);
  const removeItem = (index: number) => setItens((prev) => prev.filter((_, i) => i !== index));
  const updateItem = (index: number, key: keyof OrcamentoItem, value: string | number) => {
    setItens((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const totalOrcamento = (items: any[]) => items.reduce((sum: number, item: any) => sum + (item.quantidade || 0) * (item.valor_unitario || 0), 0);

  const handleSave = () => {
    if (!selectedFornecedorId) { toast.error("Selecione um fornecedor."); return; }
    if (itens.length === 0 || itens.every((i) => !i.descricao)) { toast.error("Adicione pelo menos um item."); return; }

    const f = fornecedoresList.find((x) => x.id === selectedFornecedorId)!;
    const budgetData = {
      bidding_id: biddingId,
      fornecedor_id: f.id,
      fornecedor_nome: f.nome_fantasia,
      fornecedor_categoria: f.categoria,
      observacoes,
      vinculado: true,
      items: itens.map((i) => ({ descricao: i.descricao, quantidade: i.quantidade, unidade: i.unidade, valor_unitario: i.valor_unitario })),
    };

    if (editingId) {
      updateBudget.mutate({ id: editingId, ...budgetData });
    } else {
      createBudget.mutate(budgetData);
    }
    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (orc: any) => {
    setEditingId(orc.id);
    setSelectedFornecedorId(orc.fornecedor_id || "");
    setObservacoes(orc.observacoes || "");
    setItens((orc.budget_items || []).map((i: any) => ({
      descricao: i.descricao, quantidade: i.quantidade, unidade: i.unidade, valor_unitario: i.valor_unitario,
    })));
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    deleteBudget.mutate({ id, bidding_id: biddingId });
  };

  const openCreate = () => { resetForm(); setShowDialog(true); };

  const menorPreco = orcamentos.length > 0
    ? orcamentos.reduce((min: any, o: any) => {
        const t = totalOrcamento(o.budget_items || []);
        return t < min.valor ? { id: o.id, valor: t } : min;
      }, { id: "", valor: Infinity })
    : null;

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Cotações de Fornecedores</h3>
          <p className="text-xs text-muted-foreground">{orcamentos.length} orçamento(s) cadastrado(s)</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Novo Orçamento</Button>
      </div>

      {orcamentos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cotações</p><p className="text-xl font-bold text-foreground">{orcamentos.length}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fornecedores</p><p className="text-xl font-bold text-foreground">{new Set(orcamentos.map((o) => o.fornecedor_id)).size}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Menor Preço</p><p className="text-xl font-bold text-success">{menorPreco && menorPreco.valor < Infinity ? fmt(menorPreco.valor) : "—"}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Maior Preço</p><p className="text-xl font-bold text-destructive">{orcamentos.length > 0 ? fmt(Math.max(...orcamentos.map((o) => totalOrcamento(o.budget_items || [])))) : "—"}</p></CardContent></Card>
        </div>
      )}

      {orcamentos.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Receipt className="h-16 w-16 text-muted-foreground/40" />
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Nenhum orçamento cadastrado</h3>
              <p className="text-sm text-muted-foreground max-w-md">Crie um orçamento vinculando um fornecedor.</p>
            </div>
            <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Criar Orçamento</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orcamentos.map((orc) => {
            const total = totalOrcamento(orc.budget_items || []);
            const isMenor = menorPreco?.id === orc.id;
            return (
              <Card key={orc.id} className={isMenor ? "border-success/40 bg-success/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="h-5 w-5 text-primary" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{orc.fornecedor_nome}</p>
                          {isMenor && <Badge className="bg-success/15 text-success border-success/30 text-[10px]">✦ Menor Preço</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] ${categoriaColor[orc.fornecedor_categoria || ""] || "bg-muted text-muted-foreground"}`}>{orc.fornecedor_categoria}</Badge>
                          <span className="text-xs text-muted-foreground">{orc.data}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(orc)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(orc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/30"><th className="text-left p-2 font-medium text-muted-foreground">Item</th><th className="text-right p-2 font-medium text-muted-foreground">Qtd</th><th className="text-right p-2 font-medium text-muted-foreground">Unit.</th><th className="text-right p-2 font-medium text-muted-foreground">Subtotal</th></tr></thead>
                      <tbody>
                        {(orc.budget_items || []).map((item: any) => (
                          <tr key={item.id} className="border-t border-border/50">
                            <td className="p-2 text-foreground">{item.descricao}</td>
                            <td className="p-2 text-right font-mono text-muted-foreground">{item.quantidade} {item.unidade}</td>
                            <td className="p-2 text-right font-mono text-muted-foreground">{fmt(item.valor_unitario)}</td>
                            <td className="p-2 text-right font-mono font-medium text-foreground">{fmt(item.quantidade * item.valor_unitario)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    {orc.observacoes && <p className="text-xs text-muted-foreground italic truncate max-w-[60%]">"{orc.observacoes}"</p>}
                    <div className="ml-auto text-right"><p className="text-[10px] text-muted-foreground">Total</p><p className={`text-lg font-mono font-bold ${isMenor ? "text-success" : "text-foreground"}`}>{fmt(total)}</p></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" />{editingId ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
            <DialogDescription>Selecione um fornecedor para puxar valores automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fornecedor *</Label>
              <Select value={selectedFornecedorId} onValueChange={handleSelectFornecedor}>
                <SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
                <SelectContent>
                  {fornecedoresList.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2"><span>{f.nome_fantasia}</span><span className="text-muted-foreground text-xs">({f.categoria} • {f.cidade}/{f.uf})</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Itens do Orçamento</Label>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={addItem}><Plus className="h-3 w-3" />Adicionar</Button>
              </div>
              {itens.map((item, index) => (
                <div key={index} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">Item {index + 1}</span>
                    {itens.length > 1 && <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(index)}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                  <Input placeholder="Descrição" value={item.descricao} onChange={(e) => updateItem(index, "descricao", e.target.value)} className="text-xs" />
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem(index, "quantidade", parseFloat(e.target.value) || 0)} className="text-xs font-mono" />
                    <Select value={item.unidade} onValueChange={(v) => updateItem(index, "unidade", v)}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="un">un</SelectItem><SelectItem value="km">km</SelectItem><SelectItem value="hr">hr</SelectItem><SelectItem value="dia">dia</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Valor Unit." value={item.valor_unitario} onChange={(e) => updateItem(index, "valor_unitario", parseFloat(e.target.value) || 0)} className="text-xs font-mono" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Observações</Label><Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
            <div className="flex justify-between items-center pt-2 border-t"><span className="text-sm text-muted-foreground">Total:</span><span className="text-lg font-mono font-bold text-foreground">{fmt(totalOrcamento(itens))}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancelar</Button>
            <LoadingButton onClick={handleSave} loading={createBudget.isPending || updateBudget.isPending}>{editingId ? "Salvar" : "Criar"}</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
