import { useMemo } from "react";
import {
  FileText, TrendingUp, Trophy, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBiddings } from "@/hooks/useSupabaseData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend
} from "recharts";
import { format, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtCompact = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#6366f1'];

export default function Relatorios() {
  const { data: biddings = [] } = useBiddings();

  const stats = useMemo(() => {
    const total = biddings.length;
    const ganhas = biddings.filter(b => ["Ganha", "Em Execução"].includes(b.status));
    const perdidas = biddings.filter(b => b.status === "Perdida");
    const recurso = biddings.filter(b => b.status === "Recurso");
    // Removemos "Recurso" do "Em Análise" para não duplicar no gráfico, mas podemos manter no KPI de "Em Disputa" se desejado
    const emAnalise = biddings.filter(b => ["Em Análise", "Habilitação", "Proposta Enviada"].includes(b.status));
    
    // Total em disputa (inclui recurso e em análise)
    const totalEmDisputa = emAnalise.length + recurso.length;
    
    const valorGanho = ganhas.reduce((acc, curr) => acc + Number(curr.estimated_value), 0);
    const valorDisputa = [...emAnalise, ...recurso].reduce((acc, curr) => acc + Number(curr.estimated_value), 0);
    
    const conversao = total > 0 ? (ganhas.length / total) * 100 : 0;

    // Dados para gráfico mensal (últimos 6 meses)
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const label = format(date, "MMM", { locale: ptBR }).toUpperCase();
      
      const monthBids = biddings.filter(b => isSameMonth(new Date(b.date), date));
      const monthGanho = monthBids.filter(b => ["Ganha", "Em Execução"].includes(b.status))
                                  .reduce((acc, curr) => acc + Number(curr.estimated_value), 0);
      
      return { name: label, valor: monthGanho };
    });

    // Dados para gráfico de status
    const statusData = [
      { name: 'Ganhas', value: ganhas.length, color: '#10b981' },
      { name: 'Perdidas', value: perdidas.length, color: '#ef4444' },
      { name: 'Em Análise', value: emAnalise.length, color: '#3b82f6' }, // Azul
      { name: 'Em Recurso', value: recurso.length, color: '#f59e0b' }, // Laranja/Amarelo
    ].filter(i => i.value > 0);

    // Top Órgãos
    const orgaosMap: Record<string, number> = {};
    ganhas.forEach(b => {
        orgaosMap[b.entity] = (orgaosMap[b.entity] || 0) + Number(b.estimated_value);
    });
    const topOrgaos = Object.entries(orgaosMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return {
        total, ganhas: ganhas.length, perdidas: perdidas.length, emAnalise: emAnalise.length, recurso: recurso.length,
        totalEmDisputa, valorGanho, valorDisputa, conversao, last6Months, statusData, topOrgaos
    };
  }, [biddings]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatórios de Performance</h1>
        <p className="text-muted-foreground mt-1">Análise detalhada das suas licitações e resultados financeiros.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Ganho</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{fmt(stats.valorGanho)}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Trophy className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="text-success flex items-center font-medium mr-2">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +{stats.ganhas}
              </span>
              contratos fechados
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-warning">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Disputa</p>
                <h3 className="text-2xl font-bold mt-1 text-warning-700">{fmt(stats.valorDisputa)}</h3>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg text-warning-700"><TrendingUp className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="font-medium mr-2">{stats.totalEmDisputa}</span>
              licitações ativas ({stats.recurso} em recurso)
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-info">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa de Conversão</p>
                <h3 className="text-2xl font-bold mt-1 text-info">{stats.conversao.toFixed(1)}%</h3>
              </div>
              <div className="p-2 bg-info/10 rounded-lg text-info"><PieChart className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              De {stats.total} licitações totais
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-muted">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Licitações</p>
                <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="p-2 bg-muted/20 rounded-lg text-muted-foreground"><FileText className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              Histórico completo
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Evolução Mensal */}
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Evolução de Valor Ganho (Últimos 6 meses)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.last6Months} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tickFormatter={(v) => `R$${v/1000}k`} 
                            />
                            <Tooltip 
                                formatter={(value: number) => [fmt(value), "Valor Ganho"]}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Gráfico de Status */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Distribuição por Status</CardTitle>
                <CardDescription>Panorama atual das licitações</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={stats.statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </RePieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Top Órgãos */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Top Órgãos (Valor Ganho)</CardTitle>
                <CardDescription>Principais clientes por volume financeiro</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {stats.topOrgaos.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                    ) : (
                        stats.topOrgaos.map((org, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs">
                                        {i + 1}
                                    </div>
                                    <div className="truncate font-medium text-sm" title={org.name}>
                                        {org.name}
                                    </div>
                                </div>
                                <div className="font-mono text-sm font-bold text-primary">
                                    {fmt(org.value)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
