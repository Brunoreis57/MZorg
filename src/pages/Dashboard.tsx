import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, FileText, Calendar, ChevronRight, Bell, Plus,
  AlertTriangle, Clock, Send, Trophy, Truck, Gavel, Pencil, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTasksWidget } from "@/components/notes/DashboardTasksWidget";
import { DashboardNotesWidget } from "@/components/notes/DashboardNotesWidget";
import { DashboardServicesWidget } from "@/components/services/DashboardServicesWidget";
import { Badge } from "@/components/ui/badge";
import { useReminders, type ReminderType, type Reminder } from "@/contexts/RemindersContext";
import { CreateReminderDialog } from "@/components/CreateReminderDialog";
import { Button } from "@/components/ui/button";
import { differenceInDays, parseISO, format } from "date-fns";
import { pt } from "date-fns/locale";
import { useBiddings, useEmpresas, useDailyServices } from "@/hooks/useSupabaseData";
import { useNavigate } from "react-router-dom";

function getStatusColor(status: string) {
  switch (status) {
    case "Ganha": return "bg-success/10 text-success border-success/20";
    case "Perdida": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Em Análise": return "bg-warning/10 text-warning border-warning/20";
    case "Proposta Enviada": return "bg-info/10 text-info border-info/20";
    case "Habilitação": return "bg-primary/10 text-primary border-primary/20";
    default: return "bg-muted text-muted-foreground";
  }
}

function getReminderIcon(type: ReminderType | "servico") {
  switch (type) {
    case "recurso": return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "documento": return <Send className="h-4 w-4 text-info" />;
    case "certidao": return <Clock className="h-4 w-4 text-destructive" />;
    case "pregao": return <FileText className="h-4 w-4 text-primary" />;
    case "servico": return <Truck className="h-4 w-4 text-primary" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function getEventBadge(daysLeft: number) {
  if (daysLeft <= 2) return "bg-destructive/10 text-destructive border-destructive/20";
  if (daysLeft <= 5) return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Dashboard() {
  const { reminders, removeReminder } = useReminders();
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { data: biddings } = useBiddings();
  const { data: empresas } = useEmpresas();
  const { data: services } = useDailyServices();
  const navigate = useNavigate();

  const allBiddings = useMemo(() => biddings || [], [biddings]);

  const kpis = useMemo(() => {
    const ativas = allBiddings.filter((b) => !["Ganha", "Perdida", "Cancelada"].includes(b.status));
    const ganhas = allBiddings.filter((b) => ["Ganha", "Em Execução"].includes(b.status));
    const valorDisputa = ativas.reduce((a, b) => a + Number(b.estimated_value), 0);
    const valorGanho = ganhas.reduce((a, b) => a + Number(b.estimated_value), 0);
    return { valorDisputa, valorGanho, qtdAtivas: ativas.length, qtdGanhas: ganhas.length };
  }, [allBiddings]);

  const inResourceBiddings = useMemo(() => {
    return allBiddings.filter((b) => b.status === "Recurso");
  }, [allBiddings]);

  const statusCounts = useMemo(() => {
    const ganhos = allBiddings.filter((b) => b.status === "Ganha").length;
    const recursos = allBiddings.filter((b) => b.status === "Recurso").length;
    const emAnalise = allBiddings.filter((b) => b.status === "Em Análise").length;
    const emExecucao = allBiddings.filter((b) => b.status === "Em Execução").length;
    return { ganhos, recursos, emAnalise, emExecucao };
  }, [allBiddings]);

  const upcomingPregoes = useMemo(() => {
    const hoje = new Date();
    return allBiddings
      .filter((b) => !["Ganha", "Perdida", "Cancelada"].includes(b.status) && new Date(b.date) >= hoje)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map((b) => ({
        ...b,
        daysLeft: differenceInDays(new Date(b.date), hoje),
      }));
  }, [allBiddings]);

  const recentBiddings = useMemo(() => {
    return [...allBiddings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [allBiddings]);

  const serviceEvents = (services || [])
    .filter((s: any) => s.status === "agendado")
    .map((s: any) => ({
      id: s.id,
      bidding_id: s.bidding_id,
      title: `Serviço: ${s.fornecedor_nome}`,
      description: `${s.hora_saida} - ${s.previsao_volta}`,
      date: s.data,
      time: s.hora_saida,
      type: "servico" as const,
    }));

  const validReminders = reminders.filter((r) => differenceInDays(parseISO(r.date), new Date()) >= 0);

  const upcomingReminders = [...validReminders, ...serviceEvents]
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  // Certidões expiring
  const certidoesAlerts = useMemo(() => {
    if (!empresas) return [];
    const alerts: { doc: string; empresa: string; dias: number; ok: boolean }[] = [];
    empresas.forEach((emp: any) => {
      (emp.certidoes || []).forEach((c: any) => {
        const dias = differenceInDays(parseISO(c.data_vencimento), new Date());
        if (dias <= 15) {
          alerts.push({ doc: c.tipo, empresa: emp.nome, dias, ok: dias > 0 });
        }
      });
    });
    return alerts.sort((a, b) => a.dias - b.dias).slice(0, 4);
  }, [empresas]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua operação de licitações</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
            <Card className={`border-warning/20 bg-warning/5 ${inResourceBiddings.length === 0 ? "opacity-50" : ""}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-warning-700">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Licitações em Recurso ({inResourceBiddings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inResourceBiddings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma licitação em recurso</p>
                )}
                {inResourceBiddings.map((bid) => (
                  <div 
                    key={bid.id} 
                    className="flex gap-3 p-3 rounded-lg bg-background/50 border border-warning/20 cursor-pointer hover:bg-background/80"
                    onClick={() => navigate(`/licitacoes`)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                      <Gavel className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{bid.code} - {bid.object}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{bid.entity} • {(bid.city || "").toUpperCase()}/{(bid.uf || "").toUpperCase()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono font-medium">{fmt(Number(bid.estimated_value))}</span>
                        <span className="status-badge border bg-warning/10 text-warning border-warning/20 text-[10px]">Recurso</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-success/20 bg-success/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Ganhas</p>
                  <p className="text-2xl font-bold text-success">{statusCounts.ganhos}</p>
                </CardContent>
              </Card>
              <Card className="border-warning/20 bg-warning/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Recursos</p>
                  <p className="text-2xl font-bold text-warning">{statusCounts.recursos}</p>
                </CardContent>
              </Card>
              <Card className="border-info/20 bg-info/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Em Análise</p>
                  <p className="text-2xl font-bold text-info">{statusCounts.emAnalise}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Em Execução</p>
                  <p className="text-2xl font-bold text-primary">{statusCounts.emExecucao}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Próximos Pregões */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Próximos Pregões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingPregoes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum pregão próximo</p>}
              {upcomingPregoes.map((pregao, i) => (
                <div key={pregao.id} className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 animate-fade-in cursor-pointer hover:bg-muted/80" style={{ animationDelay: `${i * 80}ms` }} onClick={() => navigate(`/licitacoes`)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{pregao.code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{pregao.entity}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">{format(new Date(pregao.date), "dd MMM yyyy", { locale: pt })} • {pregao.time}</span>
                      <span className={`status-badge border text-[10px] ${pregao.daysLeft <= 2 ? "bg-destructive/10 text-destructive border-destructive/20" : pregao.daysLeft <= 5 ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-muted-foreground border-border"}`}>{pregao.daysLeft}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Biddings */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Licitações Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header text-left pb-3 pr-4">Licitação</th>
                      <th className="table-header text-left pb-3 pr-4">Cidade</th>
                      <th className="table-header text-left pb-3 pr-4">Valor</th>
                      <th className="table-header text-left pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBiddings.map((bid) => (
                      <tr key={bid.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => navigate(["Ganha", "Em Execução"].includes(bid.status) ? `/ganhas/${bid.id}` : `/licitacoes`)}>
                        <td className="py-3 pr-4"><span className="text-sm font-medium text-foreground">{bid.code}</span></td>
                        <td className="py-3 pr-4"><span className="text-sm text-muted-foreground">{(bid.city || "").toUpperCase()}/{(bid.uf || "").toUpperCase()}</span></td>
                        <td className="py-3 pr-4"><span className="text-sm font-mono font-medium text-foreground">{fmt(Number(bid.estimated_value))}</span></td>
                        <td className="py-3"><span className={`status-badge border ${getStatusColor(bid.status)}`}>{bid.status}</span></td>
                      </tr>
                    ))}
                    {recentBiddings.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">Nenhuma licitação cadastrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Próximos Eventos</span>
                <CreateReminderDialog trigger={<Button variant="ghost" size="icon" className="h-7 w-7" title="Novo lembrete"><Plus className="h-4 w-4" /></Button>} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingReminders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento próximo</p>}
              {upcomingReminders.map((event, i) => {
                const daysLeft = differenceInDays(parseISO(event.date), new Date());
                const isService = event.type === "servico";
                const isClickable = isService && (event as any).bidding_id;
                
                return (
                  <div
                    key={event.id}
                    className={`flex gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 animate-slide-in-right group relative ${isClickable ? "cursor-pointer hover:bg-muted/80 transition-colors" : ""}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => isClickable && navigate(`/ganhas/${(event as any).bidding_id}`)}
                  >
                    <div className="mt-0.5">{getReminderIcon(event.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{format(parseISO(event.date), "dd MMM yyyy", { locale: pt })}{event.time && ` • ${event.time}`}</span>
                        <span className={`status-badge border text-[10px] ${getEventBadge(daysLeft)}`}>{daysLeft === 0 ? "Hoje" : `${daysLeft}d`}</span>
                      </div>
                    </div>
                    {!isService && (
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 rounded-md p-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); setEditingReminder(event as Reminder); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeReminder(event.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <DashboardServicesWidget />

          <CreateReminderDialog 
            open={!!editingReminder} 
            onOpenChange={(open) => !open && setEditingReminder(null)}
            initialData={editingReminder || undefined}
            mode="edit"
            trigger={<></>}
          />

          <DashboardTasksWidget />
          <DashboardNotesWidget />
          
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Certidões</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {certidoesAlerts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Todas as certidões em dia</p>}
              {certidoesAlerts.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md">
                  <div><p className="text-sm font-medium text-foreground">{doc.doc}</p><p className="text-xs text-muted-foreground">{doc.empresa}</p></div>
                  <span className={`status-badge border ${doc.dias > 0 ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                    {doc.dias > 0 ? `${doc.dias}d restantes` : `Vencida há ${Math.abs(doc.dias)}d`}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
