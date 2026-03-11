import { useState, useMemo } from "react";
import {
  ArrowUpRight, ArrowDownRight, Building2, Truck, DollarSign,
  Clock, CheckCircle2, Search, Filter, FileDown,
  Plus, Receipt, CreditCard, CalendarDays,
  TrendingUp, TrendingDown, AlertTriangle,
  Pencil, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePaymentSchedule, useFinancialTransactions, useCreateFinancialTransaction, useUpdateFinancialTransaction, useDeleteFinancialTransaction, useUpdatePaymentSchedule } from "@/hooks/useSupabaseData";
import { LoadingButton } from "@/components/LoadingButton";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceAllowed } from "@/hooks/useSupabaseData";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const paymentStatusColor = (s: string) => {
  switch (s) {
    case "pago": return "bg-success/10 text-success border-success/20";
    case "atrasado": return "bg-destructive/10 text-destructive border-destructive/20";
    case "antecipacao_solicitada": return "bg-warning/10 text-warning border-warning/20";
    case "agendado": return "bg-info/10 text-info border-info/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

const paymentStatusLabel: Record<string, string> = {
  previsto: "Previsto", agendado: "Agendado", antecipacao_solicitada: "Antecipação", pago: "Pago", atrasado: "Atrasado",
};

const healthIcon = (h: string) => {
  switch (h) {
    case "em_dia": return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    case "pendente_repasse": return <Clock className="h-3.5 w-3.5 text-warning" />;
    case "antecipacao_pendente": return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    default: return null;
  }
};

const healthLabel: Record<string, string> = { em_dia: "Em dia", pendente_repasse: "Repasse pendente", antecipacao_pendente: "Antecipação pendente" };

export default function Financeiro() {
  const { user } = useAuth();
  const { data: financeAllowed = false, isLoading: loadingFinanceAllowed } = useFinanceAllowed();
  const { data: payments, isLoading: loadingPayments } = usePaymentSchedule(undefined, financeAllowed);
  const { data: transactions, isLoading: loadingTx } = useFinancialTransactions(financeAllowed);
  const createTransaction = useCreateFinancialTransaction();
  const updateTransaction = useUpdateFinancialTransaction();
  const deleteTransaction = useDeleteFinancialTransaction();
  const updatePayment = useUpdatePaymentSchedule();

  const [search, setSearch] = useState("");
  const [flowFilter, setFlowFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<"receita" | "despesa">("receita");
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [txForm, setTxForm] = useState({ amount: "", paid_amount: "", description: "", date: new Date().toISOString().split("T")[0], entity: "", nf_number: "", category: "", status: "pendente" });

  const paymentsList: any[] = (payments as any[]) || [];
  const transactionsList: any[] = (transactions as any[]) || [];

  const paidPortion = (t: any) => {
    const amount = Number(t?.amount || 0);
    const paid = Number(t?.paid_amount || 0);
    if (paid > 0) return Math.min(paid, amount);
    if (t?.status === "pago") return amount;
    return 0;
  };

  const totalEntradas = transactionsList.filter((t) => t.type === "receita").reduce((a, t) => a + paidPortion(t), 0);
  const totalSaidas = transactionsList.filter((t) => t.type === "despesa").reduce((a, t) => a + paidPortion(t), 0);
  const contasReceber = transactionsList.filter((t) => t.type === "receita").reduce((a, t) => a + (Number(t?.amount || 0) - paidPortion(t)), 0);
  const contasPagar = transactionsList.filter((t) => t.type === "despesa").reduce((a, t) => a + (Number(t?.amount || 0) - paidPortion(t)), 0);
  const saldo = totalEntradas - totalSaidas - contasPagar;

  const filteredSchedule = useMemo(() => {
    return paymentsList.filter((p) => {
      const matchSearch = search === "" || (p.entity || "").toLowerCase().includes(search.toLowerCase()) || (p.bidding_code || "").toLowerCase().includes(search.toLowerCase());
      const matchFlow = flowFilter === "all" || p.type === flowFilter;
      return matchSearch && matchFlow;
    });
  }, [search, flowFilter, paymentsList]);

  const resetTxForm = () => {
    setTxForm({ amount: "", paid_amount: "", description: "", date: new Date().toISOString().split("T")[0], entity: "", nf_number: "", category: "", status: "pendente" });
    setEditingTxId(null);
  };

  const openNewTransaction = () => {
    resetTxForm();
    setSheetType("receita");
    setSheetOpen(true);
  };

  const openEditTransaction = (tx: any) => {
    setEditingTxId(tx.id);
    setSheetType(tx.type === "despesa" ? "despesa" : "receita");
    setTxForm({
      amount: String(tx.amount ?? ""),
      paid_amount: String(tx.paid_amount ?? ""),
      description: tx.description ?? "",
      date: tx.date ?? new Date().toISOString().split("T")[0],
      entity: tx.entity ?? "",
      nf_number: tx.nf_number ?? "",
      category: tx.category ?? "",
      status: tx.status ?? "pendente",
    });
    setSheetOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!txForm.amount || !txForm.description) { toast.error("Preencha valor e descrição."); return; }
    const amountN = parseFloat(txForm.amount);
    const paidN = txForm.paid_amount === "" ? 0 : parseFloat(txForm.paid_amount);
    if (Number.isNaN(amountN) || amountN < 0) { toast.error("Valor inválido."); return; }
    if (Number.isNaN(paidN) || paidN < 0) { toast.error("Valor pago inválido."); return; }
    if (paidN > amountN) { toast.error("Valor pago não pode ser maior que o valor."); return; }

    const computedStatus = paidN >= amountN ? "pago" : (txForm.status || "pendente");
    const payload = {
      type: sheetType === "receita" ? "receita" : "despesa",
      amount: amountN,
      paid_amount: paidN,
      description: txForm.description,
      date: txForm.date,
      entity: txForm.entity,
      nf_number: txForm.nf_number || null,
      category: txForm.category || null,
      status: computedStatus,
    };
    if (editingTxId) {
      updateTransaction.mutate(
        { id: editingTxId, ...payload },
        {
          onSuccess: () => {
            setSheetOpen(false);
            resetTxForm();
            toast.success("Transação atualizada!");
          },
        }
      );
    } else {
      createTransaction.mutate(payload, {
        onSuccess: () => {
          setSheetOpen(false);
          resetTxForm();
        },
      });
    }
  };

  if (!loadingFinanceAllowed && !financeAllowed) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  if (loadingFinanceAllowed || loadingPayments || loadingTx) {
    return <div className="p-6 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Financeiro</h1><p className="text-sm text-muted-foreground">Triangulação financeira: recebimentos, repasses e antecipações</p></div>
        <div className="flex items-center gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={openNewTransaction}><Plus className="h-3.5 w-3.5" /> Nova Receita/Despesa</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>{editingTxId ? "Editar Transação" : sheetType === "receita" ? "Nova Receita" : "Nova Despesa"}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex gap-2">
                  <Button variant={sheetType === "receita" ? "default" : "outline"} size="sm" onClick={() => setSheetType("receita")}><Building2 className="h-3.5 w-3.5 mr-1.5" />Receita</Button>
                  <Button variant={sheetType === "despesa" ? "default" : "outline"} size="sm" onClick={() => setSheetType("despesa")}><Truck className="h-3.5 w-3.5 mr-1.5" />Despesa</Button>
                </div>
                <div className="space-y-2"><Label>Entidade</Label><Input value={txForm.entity} onChange={(e) => setTxForm((p) => ({ ...p, entity: e.target.value }))} placeholder="Nome do órgão ou fornecedor" /></div>
                <div className="space-y-2"><Label>Descrição</Label><Input value={txForm.description} onChange={(e) => setTxForm((p) => ({ ...p, description: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={txForm.amount} onChange={(e) => setTxForm((p) => ({ ...p, amount: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Valor Pago (R$)</Label><Input type="number" value={txForm.paid_amount} onChange={(e) => setTxForm((p) => ({ ...p, paid_amount: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={txForm.date} onChange={(e) => setTxForm((p) => ({ ...p, date: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={txForm.status} onValueChange={(v) => setTxForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="atrasado">Atrasado</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="antecipacao_solicitada">Antecipação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {sheetType === "receita" && <div className="space-y-2"><Label>Nº NF</Label><Input value={txForm.nf_number} onChange={(e) => setTxForm((p) => ({ ...p, nf_number: e.target.value }))} /></div>}
                {sheetType === "despesa" && (
                  <div className="space-y-2"><Label>Categoria</Label>
                    <Select value={txForm.category} onValueChange={(v) => setTxForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent><SelectItem value="repasse">Repasse</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem><SelectItem value="folha">Folha</SelectItem><SelectItem value="outros">Outros</SelectItem></SelectContent>
                    </Select>
                  </div>
                )}
                <LoadingButton className="w-full" onClick={handleSaveTransaction} loading={createTransaction.isPending || updateTransaction.isPending}>Salvar</LoadingButton>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card"><CardContent className="p-0"><div className="flex items-center justify-between"><div><p className="kpi-label">Recebido</p><p className="kpi-value mt-1">{fmt(totalEntradas)}</p><div className="mt-1 flex items-center gap-1 text-xs text-success"><ArrowUpRight className="h-3 w-3" />Inclui recebimentos parciais</div></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Building2 className="h-5 w-5 text-success" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-0"><div className="flex items-center justify-between"><div><p className="kpi-label">Pago</p><p className="kpi-value mt-1">{fmt(totalSaidas)}</p><div className="mt-1 flex items-center gap-1 text-xs text-destructive"><ArrowDownRight className="h-3 w-3" />Inclui pagamentos parciais</div></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><Truck className="h-5 w-5 text-destructive" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-0"><div className="flex items-center justify-between"><div><p className="kpi-label">A Receber</p><p className="kpi-value mt-1">{fmt(contasReceber)}</p><div className="mt-1 flex items-center gap-1 text-xs text-warning"><Clock className="h-3 w-3" />Pendentes</div></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Receipt className="h-5 w-5 text-warning" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-0"><div className="flex items-center justify-between"><div><p className="kpi-label">Saldo Líquido</p><p className="kpi-value mt-1">{fmt(saldo)}</p><div className={`mt-1 flex items-center gap-1 text-xs ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{saldo >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}Recebido - Pago - Em aberto</div></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="transactions" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Transações</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Cronograma</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." className="h-8 w-48 pl-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>
        </div>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-header">Data</TableHead>
                    <TableHead className="table-header">Tipo</TableHead>
                    <TableHead className="table-header">Descrição</TableHead>
                    <TableHead className="table-header">Entidade</TableHead>
                    <TableHead className="table-header text-right">Valor</TableHead>
                    <TableHead className="table-header">Status</TableHead>
                    <TableHead className="table-header text-right pr-4">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsList.filter((t) => {
                    if (search === "") return true;
                    return (t.description || "").toLowerCase().includes(search.toLowerCase()) || (t.entity || "").toLowerCase().includes(search.toLowerCase());
                  }).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{t.date}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${t.type === "receita" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{t.type === "receita" ? "Receita" : "Despesa"}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{t.description}</TableCell>
                      <TableCell className="text-xs">{t.entity}</TableCell>
                      <TableCell className="text-xs font-mono font-medium text-right">
                        {fmt(Number(t.amount))}
                        {Number(t.paid_amount || 0) > 0 && Number(t.paid_amount || 0) < Number(t.amount || 0) && (
                          <div className="text-[10px] text-muted-foreground font-normal">
                            Pago: {fmt(Number(t.paid_amount))} • Em aberto: {fmt(Number(t.amount) - Number(t.paid_amount))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {Number(t.paid_amount || 0) > 0 && Number(t.paid_amount || 0) < Number(t.amount || 0) ? (
                          <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">Parcial</Badge>
                        ) : (
                          <Badge variant="outline" className={`text-[10px] ${paymentStatusColor(t.status)}`}>{paymentStatusLabel[t.status] || t.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditTransaction(t)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTxId(t.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactionsList.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Nenhuma transação registrada</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Cronograma de Pagamentos</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-header">Contrato</TableHead>
                    <TableHead className="table-header">Descrição</TableHead>
                    <TableHead className="table-header">Tipo</TableHead>
                    <TableHead className="table-header">Entidade</TableHead>
                    <TableHead className="table-header text-right">Valor</TableHead>
                    <TableHead className="table-header">Previsão</TableHead>
                    <TableHead className="table-header">Status</TableHead>
                    <TableHead className="table-header">Saúde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedule.map((p) => (
                    <TableRow key={p.id} className={p.health_status === "antecipacao_pendente" ? "bg-destructive/5" : p.health_status === "pendente_repasse" ? "bg-warning/5" : ""}>
                      <TableCell className="text-xs font-medium">{p.bidding_code}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">{p.description}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${p.type === "entrada" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{p.type === "entrada" ? "Entrada" : "Saída"}</Badge></TableCell>
                      <TableCell className="text-xs">{p.entity}</TableCell>
                      <TableCell className="text-xs font-mono font-medium text-right">{fmt(Number(p.amount))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.expected_date}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${paymentStatusColor(p.status)}`}>{paymentStatusLabel[p.status] || p.status}</Badge></TableCell>
                      <TableCell><div className="flex items-center gap-1.5">{healthIcon(p.health_status)}<span className="text-[10px] text-muted-foreground">{healthLabel[p.health_status]}</span></div></TableCell>
                    </TableRow>
                  ))}
                  {filteredSchedule.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Nenhum registro no cronograma</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteTxId}
        onOpenChange={(open) => !open && setDeleteTxId(null)}
        title="Excluir transação"
        description="Esta ação não pode ser desfeita."
        loading={deleteTransaction.isPending}
        onConfirm={() => {
          if (!deleteTxId) return;
          deleteTransaction.mutate(deleteTxId, { onSuccess: () => setDeleteTxId(null) });
        }}
      />
    </div>
  );
}
