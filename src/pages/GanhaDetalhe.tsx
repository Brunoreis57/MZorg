import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, Receipt, Calculator, ScrollText,
  Users, DollarSign, Fuel, Truck, TrendingUp, TrendingDown, FileDown, RefreshCw, Wrench, Upload, Save, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { ContractTab } from "@/components/ContractTab";
import { BudgetTab } from "@/components/BudgetTab";
import { DailyServicesTab } from "@/components/DailyServicesTab";
import { WonItemsSection } from "@/components/WonItemsSection";
import { toast } from "sonner";
import { useBiddings, useWonItems, useCreatePricingScenario } from "@/hooks/useSupabaseData";
import type { WonItemsData } from "@/components/WonItemsSection";

interface PricingInputs {
  salarioMotorista: number; encargosSociais: number; beneficios: number;
  seguroAnual: number; depreciacao: number; custoAdm: number;
  precoDiesel: number; consumoKmL: number; custoPneusKm: number;
  custoManutencaoKm: number; kmDiario: number; diasMensais: number;
  prazoContratoMeses: number; qtdVeiculos: number;
  impostos: number; margemLiquida: number; comissoes: number; valorMaximoEdital: number;
}

const defaultInputs: PricingInputs = {
  salarioMotorista: 2800, encargosSociais: 68.5, beneficios: 950,
  seguroAnual: 4800, depreciacao: 1200, custoAdm: 800,
  precoDiesel: 6.25, consumoKmL: 7.5, custoPneusKm: 0.12,
  custoManutencaoKm: 0.35, kmDiario: 180, diasMensais: 22,
  prazoContratoMeses: 12, qtdVeiculos: 5,
  impostos: 14.25, margemLiquida: 8, comissoes: 2, valorMaximoEdital: 45000,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatPercent(value: number) { return `${value.toFixed(2)}%`; }

export default function GanhaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: biddings } = useBiddings();
  const { data: wonItemsData } = useWonItems(id || "");
  const createScenario = useCreatePricingScenario();
  const [inputs, setInputs] = useState<PricingInputs>(defaultInputs);
  const [wonData, setWonData] = useState<WonItemsData | null>(null);

  const bidding = biddings?.find((b) => b.id === id);

  const updateInput = useCallback((key: keyof PricingInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }, []);

  const calc = useMemo(() => {
    const kmMensal = inputs.kmDiario * inputs.diasMensais;
    const custoPessoal = inputs.salarioMotorista * (1 + inputs.encargosSociais / 100) + inputs.beneficios;
    const custoCombustivel = (kmMensal / inputs.consumoKmL) * inputs.precoDiesel;
    const custoManutencao = (inputs.custoManutencaoKm + inputs.custoPneusKm) * kmMensal;
    const custosFixos = inputs.seguroAnual / 12 + inputs.depreciacao + inputs.custoAdm;
    const com = custoPessoal + custoCombustivel + custoManutencao + custosFixos;
    const divisor = 1 - (inputs.impostos + inputs.margemLiquida + inputs.comissoes) / 100;
    const precoMensalUnitario = com / divisor;
    const precoMensalTotal = precoMensalUnitario * inputs.qtdVeiculos;
    const precoTotalContrato = precoMensalTotal * inputs.prazoContratoMeses;
    const diferencaEdital = inputs.valorMaximoEdital > 0
      ? ((precoMensalUnitario - inputs.valorMaximoEdital) / inputs.valorMaximoEdital) * 100 : 0;
    const margemReais = precoMensalUnitario - com;
    return { kmMensal, custoPessoal, custoCombustivel, custoManutencao, custosFixos, com, divisor, precoMensalUnitario, precoMensalTotal, precoTotalContrato, diferencaEdital, margemReais };
  }, [inputs]);

  const handleSaveScenario = () => {
    if (!id) return;
    createScenario.mutate({
      bidding_id: id,
      name: `Cenário ${new Date().toLocaleDateString("pt-BR")}`,
      inputs: inputs as any,
      results: calc as any,
    });
  };

  const InputField = ({ label, field, prefix, suffix }: { label: string; field: keyof PricingInputs; prefix?: string; suffix?: string }) => {
    const isCurrency = prefix === "R$";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="relative">
          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
          {isCurrency ? (
            <CurrencyInput
              value={inputs[field]}
              onChange={(val) => updateInput(field, val.toString())}
              className={`text-sm ${prefix ? "pl-9" : ""} ${suffix ? "pr-9" : ""}`}
            />
          ) : (
            <Input
              type="number"
              value={inputs[field]}
              onChange={(e) => updateInput(field, e.target.value)}
              className={`font-mono text-sm ${prefix ? "pl-9" : ""} ${suffix ? "pr-9" : ""}`}
            />
          )}
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </div>
    );
  };

  if (!bidding) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{bidding.code}</h1>
          <p className="text-sm text-muted-foreground">{bidding.object}</p>
        </div>
        <span className="status-badge border bg-success/10 text-success border-success/20 ml-auto">{bidding.status}</span>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="geral" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Geral</TabsTrigger>
          <TabsTrigger value="orcamentos" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Orçamentos</TabsTrigger>
          <TabsTrigger value="precificacao-tecnica" className="gap-1.5"><Wrench className="h-3.5 w-3.5" />Prec. Técnica</TabsTrigger>
          <TabsTrigger value="contrato" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" />Contrato</TabsTrigger>
          <TabsTrigger value="servicos" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Serviços / Diário</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Informações Gerais</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Órgão", value: bidding.entity },
                  { label: "Modalidade", value: bidding.type },
                  { label: "Cidade/UF", value: `${bidding.city}/${bidding.uf}` },
                  { label: "Portal", value: bidding.portal },
                  { label: "Valor Estimado", value: formatCurrency(Number(bidding.estimated_value)) },
                  { label: "Data do Pregão", value: new Date(bidding.date).toLocaleDateString("pt-BR") },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Edital (PDF)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{bidding.edital_url ? "Edital disponível" : "Nenhum PDF carregado"}</p>
                    {bidding.edital_url && (
                      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => window.open(bidding.edital_url!, "_blank")}>
                        <FileText className="h-3.5 w-3.5" />Ver Edital
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <WonItemsSection biddingId={id!} onSave={setWonData} initialData={wonItemsData} />
        </TabsContent>

        <TabsContent value="orcamentos">
          <BudgetTab biddingId={id!} />
        </TabsContent>

        <TabsContent value="precificacao-tecnica">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />Engine de Precificação Técnica
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setInputs(defaultInputs)}>
                  <RefreshCw className="h-3.5 w-3.5" />Resetar
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveScenario}>
                  <Save className="h-3.5 w-3.5" />Gerar Cenário
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
              <div className="space-y-4">
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Custos de Pessoal</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><InputField label="Salário Motorista" field="salarioMotorista" prefix="R$" /><InputField label="Encargos Sociais" field="encargosSociais" suffix="%" /><InputField label="Benefícios (VT, VR, etc)" field="beneficios" prefix="R$" /></div></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Custos Fixos Mensais</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><InputField label="Seguro (Anual)" field="seguroAnual" prefix="R$" /><InputField label="Depreciação Mensal" field="depreciacao" prefix="R$" /><InputField label="Custo Administrativo" field="custoAdm" prefix="R$" /></div></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Fuel className="h-4 w-4 text-primary" />Custos Variáveis</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><InputField label="Preço Diesel (R$/L)" field="precoDiesel" prefix="R$" /><InputField label="Consumo (KM/L)" field="consumoKmL" suffix="km/l" /><InputField label="Pneus (R$/KM)" field="custoPneusKm" prefix="R$" /><InputField label="Manutenção (R$/KM)" field="custoManutencaoKm" prefix="R$" /></div></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />Parâmetros do Edital</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><InputField label="KM Diário" field="kmDiario" suffix="km" /><InputField label="Dias Mensais" field="diasMensais" suffix="dias" /><InputField label="Prazo Contrato" field="prazoContratoMeses" suffix="meses" /><InputField label="Qtd. Veículos" field="qtdVeiculos" suffix="un" /></div></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Mark-up & Referência</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><InputField label="Impostos" field="impostos" suffix="%" /><InputField label="Margem Líquida" field="margemLiquida" suffix="%" /><InputField label="Comissões" field="comissoes" suffix="%" /><InputField label="Valor Máx. Edital (mensal/veíc.)" field="valorMaximoEdital" prefix="R$" /></div></CardContent></Card>
              </div>
              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-primary">Composição de Custos (Mensal / Veículo)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Pessoal + Encargos", value: calc.custoPessoal },
                      { label: "Combustível", value: calc.custoCombustivel },
                      { label: "Manutenção + Pneus", value: calc.custoManutencao },
                      { label: "Fixos (Seguro + Depr. + Adm)", value: calc.custosFixos },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-mono font-medium text-foreground">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">COM (Custo Operacional)</span>
                      <span className="text-base font-mono font-bold text-foreground">{formatCurrency(calc.com)}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Mark-up</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Divisor</span><span className="text-sm font-mono text-foreground">{calc.divisor.toFixed(4)}</span></div><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Margem em R$</span><span className="text-sm font-mono text-foreground">{formatCurrency(calc.margemReais)}</span></div></CardContent></Card>
                <Card className="bg-primary/5 border-primary/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-primary">Preço Final</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><p className="text-xs text-muted-foreground mb-1">Mensal / Veículo</p><p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(calc.precoMensalUnitario)}</p></div>
                    <Separator />
                    <div className="flex justify-between">
                      <div><p className="text-xs text-muted-foreground">Mensal Total ({inputs.qtdVeiculos} veíc.)</p><p className="text-lg font-mono font-bold text-foreground">{formatCurrency(calc.precoMensalTotal)}</p></div>
                      <div className="text-right"><p className="text-xs text-muted-foreground">Total Contrato ({inputs.prazoContratoMeses}m)</p><p className="text-lg font-mono font-bold text-foreground">{formatCurrency(calc.precoTotalContrato)}</p></div>
                    </div>
                  </CardContent>
                </Card>
                {inputs.valorMaximoEdital > 0 && (
                  <Card className={`border ${calc.diferencaEdital <= 0 ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div><p className="text-xs text-muted-foreground">vs. Valor Máx. Edital</p><p className="text-sm font-medium text-foreground">{formatCurrency(inputs.valorMaximoEdital)}</p></div>
                        <div className="text-right flex items-center gap-2">
                          {calc.diferencaEdital <= 0 ? <TrendingDown className="h-5 w-5 text-success" /> : <TrendingUp className="h-5 w-5 text-destructive" />}
                          <div>
                            <p className={`text-lg font-mono font-bold ${calc.diferencaEdital <= 0 ? "text-success" : "text-destructive"}`}>{calc.diferencaEdital > 0 ? "+" : ""}{formatPercent(calc.diferencaEdital)}</p>
                            <p className="text-[10px] text-muted-foreground">{calc.diferencaEdital <= 0 ? "Abaixo do máximo" : "Acima do máximo"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card><CardContent className="p-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground">KM Mensal</span><span className="font-mono font-medium text-foreground">{calc.kmMensal.toLocaleString("pt-BR")} km</span></div></CardContent></Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contrato">
          <ContractTab biddingId={id!} />
        </TabsContent>

        <TabsContent value="servicos">
          <DailyServicesTab biddingId={id!} wonData={wonData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
