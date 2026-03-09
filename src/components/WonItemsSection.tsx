import { useState, useEffect } from "react";
import { Plus, Trash2, Package, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertWonItems } from "@/hooks/useSupabaseData";
import { LoadingButton } from "@/components/LoadingButton";

interface WonItem {
  id: string; numero: number; descricao: string; valorTotal: number; valorKm: number; objeto: string;
}

type WonType = "total" | "itens";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export interface WonItemsData {
  wonType: WonType; valorTotalEdital: number; valorKmTotal: number; items: WonItem[];
}

interface WonItemsSectionProps {
  biddingId: string;
  onSave?: (data: WonItemsData) => void;
  initialData?: { won_type: string; valor_total_edital: number; valor_km_total: number; items: any } | null;
}

const vehicleOptions = ["Van", "Ônibus", "Micro", "Máquina"];

export function WonItemsSection({ biddingId, onSave, initialData }: WonItemsSectionProps) {
  const upsert = useUpsertWonItems();
  const [wonType, setWonType] = useState<WonType>("total");
  const [valorTotalEdital, setValorTotalEdital] = useState(0);
  const [valorKmTotal, setValorKmTotal] = useState(0);
  const [items, setItems] = useState<WonItem[]>([{ id: "1", numero: 1, descricao: "", valorTotal: 0, valorKm: 0, objeto: "Van" }]);
  const [totalItems, setTotalItems] = useState<{ id: string; objeto: string; valorKm: number }[]>([{ id: "1", objeto: "Van", valorKm: 0 }]);

  useEffect(() => {
    if (initialData) {
      setWonType(initialData.won_type as WonType);
      setValorTotalEdital(initialData.valor_total_edital);
      setValorKmTotal(initialData.valor_km_total);
      if (Array.isArray(initialData.items) && initialData.items.length > 0) {
        if (initialData.won_type === "itens") {
            setItems(initialData.items.map((i: any) => ({ ...i, objeto: i.objeto || "Van" })));
        } else {
             // Se for total, tenta recuperar os objetos salvos em items (se houver estrutura compativel) ou inicia padrao
             // O banco salva em 'items' JSONB independente do tipo.
             // Vamos assumir que se won_type=total, o JSON em items pode guardar essa lista de objetos/km
             setTotalItems(initialData.items.length > 0 ? initialData.items.map((i:any) => ({id: i.id || crypto.randomUUID(), objeto: i.objeto || "Van", valorKm: i.valorKm || 0})) : [{ id: "1", objeto: "Van", valorKm: 0 }]);
        }
      }
    }
  }, [initialData]);

  const addItem = () => {
    const nextNum = items.length > 0 ? Math.max(...items.map((i) => i.numero)) + 1 : 1;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), numero: nextNum, descricao: "", valorTotal: 0, valorKm: 0, objeto: "Van" }]);
  };

  const addTotalItem = () => {
    setTotalItems((prev) => [...prev, { id: crypto.randomUUID(), objeto: "Van", valorKm: 0 }]);
  }
  const removeTotalItem = (id: string) => {
    if (totalItems.length <= 1) return;
    setTotalItems(prev => prev.filter(i => i.id !== id));
  }
  const updateTotalItem = (id: string, field: "objeto" | "valorKm", value: string | number) => {
    setTotalItems(prev => prev.map(i => i.id === id ? { ...i, [field]: field === "objeto" ? value : parseFloat(value as string) || 0 } : i));
  }

  const removeItem = (id: string) => { if (items.length <= 1) return; setItems((prev) => prev.filter((i) => i.id !== id)); };
  const updateItem = (id: string, field: keyof WonItem, value: string | number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: field === "descricao" || field === "objeto" ? value : parseFloat(value as string) || 0 } : i)));
  };

  const totalGanho = wonType === "total" ? valorTotalEdital : items.reduce((sum, i) => sum + i.valorTotal, 0);

  const handleSave = () => {
    // Se for total, salvamos a lista de objetos no campo items para persistencia, mas com estrutura simplificada se necessario
    // O backend espera um JSONB em items.
    const itemsToSave = wonType === "total" 
        ? totalItems.map(i => ({ ...i, numero: 0, descricao: "Edital Completo - " + i.objeto, valorTotal: 0 })) 
        : items;

    upsert.mutate({
      bidding_id: biddingId,
      won_type: wonType,
      valor_total_edital: valorTotalEdital,
      valor_km_total: valorKmTotal,
      items: itemsToSave,
    });
    onSave?.({ wonType, valorTotalEdital, valorKmTotal, items: itemsToSave as any });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />Itens Ganhos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tipo de adjudicação</Label>
          <RadioGroup value={wonType} onValueChange={(v) => setWonType(v as WonType)} className="flex gap-4">
            <div className="flex items-center gap-2"><RadioGroupItem value="total" id="won-total" /><Label htmlFor="won-total" className="text-sm cursor-pointer">Edital completo</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="itens" id="won-itens" /><Label htmlFor="won-itens" className="text-sm cursor-pointer">Itens específicos</Label></div>
          </RadioGroup>
        </div>
        <Separator />
        {wonType === "total" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Valor Total Ganho</Label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><CurrencyInput value={valorTotalEdital} onChange={setValorTotalEdital} className="pl-9 text-sm" /></div>
            </div>
            
            <div className="space-y-2">
               <Label className="text-xs font-semibold text-muted-foreground">Veículos e Valores por KM</Label>
               {totalItems.map((item) => (
                   <div key={item.id} className="flex items-end gap-2 p-2 rounded border bg-muted/10">
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs text-muted-foreground">Objeto</Label>
                            <Select value={item.objeto} onValueChange={(v) => updateTotalItem(item.id, "objeto", v)}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {vehicleOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1 flex-1">
                             <Label className="text-xs text-muted-foreground">Valor KM (R$/km)</Label>
                             <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><CurrencyInput value={item.valorKm} onChange={(val) => updateTotalItem(item.id, "valorKm", val)} className="pl-9 text-sm h-9" /></div>
                        </div>
                        {totalItems.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeTotalItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                   </div>
               ))}
               <Button variant="outline" size="sm" onClick={addTotalItem} className="w-full gap-2"><Plus className="h-3.5 w-3.5"/> Adicionar Veículo</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">Item {item.numero}</Badge>
                  {items.length > 1 && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-1"><Label className="text-xs text-muted-foreground">Nº Item</Label><Input type="number" value={item.numero} onChange={(e) => updateItem(item.id, "numero", e.target.value)} className="font-mono text-sm" /></div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">Objeto</Label>
                    <Select value={item.objeto} onValueChange={(v) => updateItem(item.id, "objeto", v)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {vehicleOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2"><Label className="text-xs text-muted-foreground">Descrição</Label><Input value={item.descricao} onChange={(e) => updateItem(item.id, "descricao", e.target.value)} placeholder="Ex: Rota 01 - Centro / Zona Sul" className="text-sm" /></div>
                  <div className="space-y-1 sm:col-span-2"><Label className="text-xs text-muted-foreground">Valor Total Ganho</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><CurrencyInput value={item.valorTotal} onChange={(val) => updateItem(item.id, "valorTotal", val)} className="pl-9 text-sm" /></div></div>
                  <div className="space-y-1 sm:col-span-2"><Label className="text-xs text-muted-foreground">Valor por KM (R$/km)</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><CurrencyInput value={item.valorKm} onChange={(val) => updateItem(item.id, "valorKm", val)} className="pl-9 text-sm" /></div></div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 w-full" onClick={addItem}><Plus className="h-3.5 w-3.5" />Adicionar Item</Button>
          </div>
        )}
        <Separator />
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Total Ganho</p><p className="text-lg font-mono font-bold text-foreground">{formatCurrency(totalGanho)}</p></div>
          {wonType === "itens" && <Badge variant="secondary" className="text-xs">{items.length} {items.length === 1 ? "item" : "itens"}</Badge>}
        </div>
        <LoadingButton size="sm" className="gap-2" onClick={handleSave} loading={upsert.isPending}>
          <CheckCircle2 className="h-3.5 w-3.5" />Salvar
        </LoadingButton>
      </CardContent>
    </Card>
  );
}
