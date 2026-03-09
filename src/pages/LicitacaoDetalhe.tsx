import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, MapPin, Building2, FileText, Gavel, DollarSign, ExternalLink,
  Briefcase, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBiddings, useContract } from "@/hooks/useSupabaseData";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { SuppliersSection } from "@/components/SuppliersSection";
import { NotesSection } from "@/components/NotesSection";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getStatusColor(status: string) {
  switch (status) {
    case "Ganha": return "bg-success/10 text-success border-success/20";
    case "Perdida": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Em Análise": return "bg-warning/10 text-warning border-warning/20";
    case "Proposta Enviada": return "bg-info/10 text-info border-info/20";
    case "Habilitação": return "bg-primary/10 text-primary border-primary/20";
    case "Recurso": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: string) {
    switch (status) {
        case "Ganha": return <CheckCircle className="h-5 w-5" />;
        case "Perdida": return <XCircle className="h-5 w-5" />;
        case "Recurso": return <AlertTriangle className="h-5 w-5" />;
        case "Em Análise": return <Clock className="h-5 w-5" />;
        default: return <FileText className="h-5 w-5" />;
    }
}

export default function LicitacaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: biddings } = useBiddings();
  const { data: contract } = useContract(id || "");
  
  const bidding = useMemo(() => biddings?.find((b) => b.id === id), [biddings, id]);

  if (!bidding) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <p className="text-muted-foreground">Licitação não encontrada</p>
        <Button variant="outline" onClick={() => navigate("/licitacoes")}>Voltar para a lista</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/licitacoes")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{bidding.code}</h1>
              <Badge variant="outline" className={`gap-1.5 py-1 px-3 text-sm font-medium ${getStatusColor(bidding.status)}`}>
                 {getStatusIcon(bidding.status)}
                 {bidding.status}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl">{bidding.object}</p>
          </div>
          
          <div className="flex gap-2">
            {((bidding as any).attachment_url || (bidding as any).edital_url) && (
                <Button variant="outline" className="gap-2" onClick={() => window.open((bidding as any).attachment_url || (bidding as any).edital_url, '_blank')}>
                    <ExternalLink className="h-4 w-4" /> Ver Edital
                </Button>
            )}
            {bidding.status === "Ganha" && (
                <Button className="gap-2 bg-success hover:bg-success/90 text-white" onClick={() => navigate(`/ganhas/${bidding.id}`)}>
                    <Briefcase className="h-4 w-4" /> Gestão do Contrato
                </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
               <CardHeader className="bg-muted/30 pb-4">
                   <CardTitle className="text-base font-semibold flex items-center gap-2">
                       <FileText className="h-5 w-5 text-primary" /> Informações Principais
                   </CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Órgão</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Building2 className="h-4 w-4 text-primary/70" />
                            {bidding.entity}
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Localização</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <MapPin className="h-4 w-4 text-primary/70" />
                            {(bidding.city || "").toUpperCase()} / {(bidding.uf || "").toUpperCase()}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data e Hora</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-primary/70" />
                            {format(new Date(bidding.date), "dd 'de' MMMM 'de' yyyy", { locale: pt })} às {bidding.time}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Portal</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Gavel className="h-4 w-4 text-primary/70" />
                            {bidding.portal}
                        </div>
                    </div>
               </CardContent>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Valor Estimado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <DollarSign className="h-6 w-6 text-primary" />
                            {fmt(Number(bidding.estimated_value))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Valor máximo aceitável pelo edital</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Modalidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-foreground">
                            {bidding.type}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tipo de licitação</p>
                    </CardContent>
                </Card>
           </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
            <Card className="shadow-sm h-full border-l-4 border-l-warning">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Linha do Tempo</CardTitle>
                    <CardDescription>Acompanhe o status do processo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l border-muted ml-3 space-y-8 pb-2">
                        {["Em Análise", "Habilitação", "Proposta Enviada", "Ganha"].map((step, i) => {
                            const isCompleted = ["Ganha", "Em Execução"].includes(bidding.status) || (bidding.status === step);
                            const isCurrent = bidding.status === step;
                            
                            return (
                                <div key={step} className="relative pl-6">
                                    <span className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 ${isCompleted ? "bg-primary border-primary" : "bg-background border-muted"}`} />
                                    <p className={`text-sm font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{step}</p>
                                    {isCurrent && <p className="text-xs text-primary mt-0.5 font-medium">Status Atual</p>}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>

      {/* Suppliers Section */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <SuppliersSection 
                biddingId={bidding.id} 
                contractId={contract?.id}
                currentSupplierId={contract?.supplier_id}
            />
          </div>
          <div>
            <NotesSection biddingId={bidding.id} />
          </div>
      </div>
    </div>
  );
}
