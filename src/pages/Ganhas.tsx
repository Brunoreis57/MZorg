import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy, Search, Building2, Calendar, DollarSign, ArrowRight,
  Filter, LayoutGrid, List, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBiddings } from "@/hooks/useSupabaseData";
import { format, parseISO } from "date-fns";

type ViewMode = "cards" | "list";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(d: string) {
  try { return format(parseISO(d), "dd/MM/yyyy"); } catch { return d; }
}

export default function Ganhas() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<"none" | "status" | "uf">("none");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const navigate = useNavigate();

  const { data: allBiddings = [], isLoading } = useBiddings();

  // Filter only won/executing biddings
  const wonBiddings = allBiddings.filter((b) => b.status === "Ganha" || b.status === "Em Execução");

  const filtered = wonBiddings
    .filter((b) => {
      const matchSearch =
        b.code.toLowerCase().includes(search.toLowerCase()) ||
        b.object.toLowerCase().includes(search.toLowerCase()) ||
        b.entity.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const groups: Record<string, typeof filtered> = {};
  if (groupBy === "none") {
    groups["all"] = filtered;
  } else {
    filtered.forEach((bid) => {
      const key = groupBy === "status" ? bid.status : bid.uf;
      if (!groups[key]) groups[key] = [];
      groups[key].push(bid);
    });
  }
  const groupEntries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-success" />Licitações Ganhas
          </h1>
          <p className="text-sm text-muted-foreground">{filtered.length} licitações encontradas</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar licitação ganha..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Ganha">Ganha</SelectItem>
            <SelectItem value="Em Execução">Em Execução</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Agrupar por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem agrupamento</SelectItem>
            <SelectItem value="status">Por Status</SelectItem>
            <SelectItem value="uf">Por UF</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("cards")} className={`px-3 py-2 transition-colors ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}

      {!isLoading && groupEntries.map(([groupKey, items]) => (
        <div key={groupKey} className="space-y-3">
          {groupBy !== "none" && (
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <span className="text-sm font-semibold text-foreground">{groupKey}</span>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>
          )}

          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((bid) => (
                <Card key={bid.id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/ganhas/${bid.id}`)}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-bold text-primary">{bid.code}</span>
                      <span className={`status-badge border ${bid.status === "Em Execução" ? "bg-info/10 text-info border-info/20" : "bg-success/10 text-success border-success/20"}`}>{bid.status}</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{bid.object}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{bid.entity} • {bid.city}/{bid.uf}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /><span className="font-mono font-semibold text-foreground">{formatBRL(bid.estimated_value)}</span></div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{formatDate(bid.date)}</div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary group-hover:bg-primary/10">Detalhes<ArrowRight className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {viewMode === "list" && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Código</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Objeto</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Órgão</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Cidade/UF</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Valor</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((bid) => (
                        <tr 
                          key={bid.id} 
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => navigate(`/ganhas/${bid.id}`)}
                        >
                          <td className="p-3"><span className="text-sm font-semibold text-primary">{bid.code}</span></td>
                          <td className="p-3 max-w-[260px]"><p className="text-sm text-foreground truncate">{bid.object}</p></td>
                          <td className="p-3"><span className="text-sm text-foreground">{bid.entity}</span></td>
                          <td className="p-3"><span className="text-sm text-muted-foreground">{bid.city}/{bid.uf}</span></td>
                          <td className="p-3"><span className="text-sm font-mono font-semibold text-foreground">{formatBRL(bid.estimated_value)}</span></td>
                          <td className="p-3">
                            <span className={`status-badge border ${bid.status === "Em Execução" ? "bg-info/10 text-info border-info/20" : "bg-success/10 text-success border-success/20"}`}>{bid.status}</span>
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/ganhas/${bid.id}`); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}

      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma licitação encontrada.</div>
      )}
    </div>
  );
}
