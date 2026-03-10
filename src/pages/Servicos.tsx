import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CreateServiceDialog } from "@/components/services/CreateServiceDialog";
import { useBiddings, useDailyServices, useDeleteDailyService, useFornecedores } from "@/hooks/useSupabaseData";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronDown, ChevronUp, Eye, Plus, Search, Truck, Pencil, Trash2 } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  em_andamento: { label: "Em andamento", className: "bg-warning/10 text-warning border-warning/20" },
  finalizado: { label: "Finalizado", className: "bg-success/10 text-success border-success/20" },
  faturado: { label: "Faturado", className: "bg-primary/10 text-primary border-primary/20" },
};

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function Servicos() {
  const navigate = useNavigate();
  const { data: servicesData, isLoading } = useDailyServices();
  const { data: fornecedoresData } = useFornecedores();
  const { data: biddingsData } = useBiddings();
  const deleteService = useDeleteDailyService();

  const services = servicesData || [];
  const fornecedores = fornecedoresData || [];
  const biddings = biddingsData || [];

  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [fornecedorFilter, setFornecedorFilter] = useState<string>("todos");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const fornecedorNameById = useMemo(() => {
    const m: Record<string, string> = {};
    fornecedores.forEach((f: any) => {
      m[f.id] = f.nome_fantasia;
    });
    return m;
  }, [fornecedores]);

  const biddingCodeById = useMemo(() => {
    const m: Record<string, string> = {};
    biddings.forEach((b: any) => {
      m[b.id] = b.code;
    });
    return m;
  }, [biddings]);

  const fornecedoresSorted = useMemo(() => {
    return [...fornecedores].sort((a: any, b: any) => (a.nome_fantasia || "").localeCompare(b.nome_fantasia || ""));
  }, [fornecedores]);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return services.filter((s: any) => {
      const fornecedorNome = s.fornecedor_nome || (s.fornecedor_id ? fornecedorNameById[s.fornecedor_id] : "") || "";
      const biddingCode = s.bidding_id ? (biddingCodeById[s.bidding_id] || "") : "";
      const matchBusca = !q || fornecedorNome.toLowerCase().includes(q) || biddingCode.toLowerCase().includes(q);
      const matchStatus = statusFilter === "todos" || s.status === statusFilter;
      const matchFornecedor = fornecedorFilter === "todos" || s.fornecedor_id === fornecedorFilter;
      return matchBusca && matchStatus && matchFornecedor;
    });
  }, [services, busca, statusFilter, fornecedorFilter, fornecedorNameById, biddingCodeById]);

  const groups = useMemo(() => {
    const m: Record<string, { key: string; fornecedorNome: string; services: any[] }> = {};
    filtered.forEach((s: any) => {
      const key = s.fornecedor_id || "sem_fornecedor";
      const fornecedorNome =
        s.fornecedor_nome ||
        (s.fornecedor_id ? fornecedorNameById[s.fornecedor_id] : "") ||
        "Sem fornecedor";
      if (!m[key]) m[key] = { key, fornecedorNome, services: [] };
      m[key].services.push(s);
    });
    return Object.values(m)
      .map((g) => ({
        ...g,
        services: [...g.services].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
      }))
      .sort((a, b) => a.fornecedorNome.localeCompare(b.fornecedorNome));
  }, [filtered, fornecedorNameById]);

  const statusOptions = useMemo(() => {
    return [
      { value: "todos", label: "Todos" },
      { value: "agendado", label: "Agendado" },
      { value: "em_andamento", label: "Em andamento" },
      { value: "finalizado", label: "Finalizado" },
      { value: "faturado", label: "Faturado" },
    ];
  }, []);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Serviços
          </h1>
          <p className="text-sm text-muted-foreground">OS por fornecedor</p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditingService(null);
            setOpenDialog(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por fornecedor ou código..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
            </div>
            <Select value={fornecedorFilter} onValueChange={setFornecedorFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos fornecedores</SelectItem>
                {fornecedoresSorted.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {groups.length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Nenhum serviço encontrado.
        </div>
      )}

      <div className="space-y-4">
        {groups.map((g) => {
          const isOpen = openGroups[g.key] ?? true;
          const total = g.services.length;
          const totals = g.services.reduce(
            (acc, s: any) => {
              acc.km += Number(s.km_total || 0);
              acc.receita += Number(s.receita_bruta || 0);
              acc.custo += Number(s.custo_fornecedor || 0);
              acc.lucro += Number(s.lucro_liquido || 0);
              return acc;
            },
            { km: 0, receita: 0, custo: 0, lucro: 0 }
          );

          return (
            <Card key={g.key}>
              <Collapsible open={isOpen} onOpenChange={() => toggleGroup(g.key)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer select-none">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold truncate">{g.fornecedorNome}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {total} serviço(s) • {totals.km.toLocaleString("pt-BR")} km • {fmt(totals.receita)} receita
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border">
                          {fmt(totals.lucro)} lucro
                        </Badge>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/20">
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Data</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Licitação</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                            <th className="text-right p-3 text-xs font-medium text-muted-foreground">KM</th>
                            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Receita</th>
                            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Custo</th>
                            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Lucro</th>
                            <th className="p-3 text-xs font-medium text-muted-foreground"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.services.map((s: any) => {
                            const st = statusConfig[s.status] || { label: s.status, className: "bg-muted text-muted-foreground border-border" };
                            const dateLabel = (() => {
                              try {
                                return format(parseISO(s.data), "dd MMM yyyy", { locale: pt });
                              } catch {
                                return s.data;
                              }
                            })();
                            const biddingCode = s.bidding_id ? (biddingCodeById[s.bidding_id] || "—") : "—";
                            return (
                              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                <td className="p-3">
                                  <span className="text-sm text-foreground">{dateLabel}</span>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {s.hora_saida || "—"} • {s.previsao_volta || "—"}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="text-sm text-foreground">{biddingCode}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`status-badge border text-[10px] ${st.className}`}>{st.label}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="text-sm font-mono text-foreground">{Number(s.km_total || 0).toLocaleString("pt-BR")}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="text-sm font-mono text-foreground">{fmt(Number(s.receita_bruta || 0))}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="text-sm font-mono text-foreground">{fmt(Number(s.custo_fornecedor || 0))}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="text-sm font-mono text-foreground">{fmt(Number(s.lucro_liquido || 0))}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => s.bidding_id ? navigate(`/ganhas/${s.bidding_id}`) : navigate(`/servicos`)}
                                      title="Ver"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => {
                                        setEditingService(s);
                                        setOpenDialog(true);
                                      }}
                                      title="Editar"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => setDeleteTarget(s)}
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      <CreateServiceDialog open={openDialog} onOpenChange={setOpenDialog} initialService={editingService} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir serviço"
        description="Esta ação não pode ser desfeita."
        loading={deleteService.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteService.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
