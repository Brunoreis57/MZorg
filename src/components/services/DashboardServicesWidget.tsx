import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateServiceDialog } from "@/components/services/CreateServiceDialog";
import { useDailyServices } from "@/hooks/useSupabaseData";
import { Plus, Truck, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

const statusConfig: Record<string, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  em_andamento: { label: "Em andamento", className: "bg-warning/10 text-warning border-warning/20" },
  finalizado: { label: "Finalizado", className: "bg-success/10 text-success border-success/20" },
  faturado: { label: "Faturado", className: "bg-primary/10 text-primary border-primary/20" },
};

export function DashboardServicesWidget() {
  const navigate = useNavigate();
  const { data: servicesData = [] } = useDailyServices();
  const [openCreate, setOpenCreate] = useState(false);

  const upcoming = useMemo(() => {
    const now = new Date();
    return (servicesData as any[])
      .filter((s) => s.status === "agendado" || s.status === "em_andamento")
      .filter((s) => {
        try {
          return parseISO(s.data) >= new Date(now.toISOString().split("T")[0]);
        } catch {
          return true;
        }
      })
      .sort((a, b) => {
        const da = new Date(`${a.data}T${a.hora_saida || "00:00"}`).getTime();
        const db = new Date(`${b.data}T${b.hora_saida || "00:00"}`).getTime();
        return da - db;
      })
      .slice(0, 3);
  }, [servicesData]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Serviços
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Novo serviço" onClick={() => setOpenCreate(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço próximo</p>
          )}
          {upcoming.map((s) => {
            const st = statusConfig[s.status] || { label: s.status, className: "bg-muted text-muted-foreground border-border" };
            const dateLabel = (() => {
              try {
                return format(parseISO(s.data), "dd MMM yyyy", { locale: pt });
              } catch {
                return s.data;
              }
            })();
            return (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.fornecedor_nome || "Fornecedor"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {dateLabel}{s.hora_saida ? ` • ${s.hora_saida}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] border ${st.className}`}>
                  {st.label}
                </Badge>
              </div>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 gap-1.5 text-xs text-muted-foreground"
            onClick={() => navigate("/servicos")}
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      <CreateServiceDialog open={openCreate} onOpenChange={setOpenCreate} />
    </>
  );
}

