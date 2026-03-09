import { useState, useMemo } from "react";
import {
  Users, Building2, Plus, Phone, Mail, MapPin, DollarSign,
  Search, LinkIcon, Edit, Trash2, CheckCircle2, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/LoadingButton";
import { useFornecedores, useCreateFornecedor, useUpdateContract } from "@/hooks/useSupabaseData";
import { toast } from "sonner";

interface SuppliersSectionProps {
  biddingId: string;
  contractId?: string;
  currentSupplierId?: string;
  onSupplierChange?: (supplierId: string, supplierName: string) => void;
}

const categoriaColors: Record<string, string> = {
  "Van": "bg-info/15 text-info border-info/30",
  "Ônibus": "bg-warning/15 text-warning border-warning/30",
  "Micro": "bg-primary/15 text-primary border-primary/30",
  "Máquinas": "bg-success/15 text-success border-success/30",
};

const veiculoOptions = ["Van", "Ônibus", "Micro", "Máquina"];

export function SuppliersSection({ biddingId, contractId, currentSupplierId, onSupplierChange }: SuppliersSectionProps) {
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const createFornecedor = useCreateFornecedor();
  const updateContract = useUpdateContract();

  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(currentSupplierId || null);
  
  // New Supplier Form State
  const [newSupplier, setNewSupplier] = useState({
    nomeFantasia: "", razaoSocial: "", cnpj: "", categoria: "Van",
    cidade: "", uf: "", contatoWhatsapp: "", email: "",
    veiculo: "Van", valor: "", tipoCobranca: "mensal"
  });

  const filteredSuppliers = useMemo(() => {
    return fornecedores.filter(f => 
      f.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || 
      f.cnpj.includes(search)
    );
  }, [fornecedores, search]);

  const handleCreateSupplier = async () => {
    if (!newSupplier.nomeFantasia || !newSupplier.cnpj) {
        toast.error("Preencha os campos obrigatórios");
        return;
    }

    const precos = newSupplier.valor ? [{
        veiculo: newSupplier.veiculo,
        tipo_cobranca: newSupplier.tipoCobranca,
        valor: parseFloat(newSupplier.valor)
    }] : [];

    createFornecedor.mutate({
        nome_fantasia: newSupplier.nomeFantasia,
        razao_social: newSupplier.razaoSocial,
        cnpj: newSupplier.cnpj,
        categoria: newSupplier.categoria,
        cidade: newSupplier.cidade,
        uf: newSupplier.uf,
        contato_whatsapp: newSupplier.contatoWhatsapp,
        email: newSupplier.email,
        ativo: true,
        precos
    }, {
        onSuccess: (data: any) => { // Supabase returns the created object or null depending on implementation
             setShowCreateDialog(false);
             // Se o backend retornar o ID, ja selecionamos. Senao o usuario busca na lista.
             setNewSupplier({
                nomeFantasia: "", razaoSocial: "", cnpj: "", categoria: "Van",
                cidade: "", uf: "", contatoWhatsapp: "", email: "",
                veiculo: "Van", valor: "", tipoCobranca: "mensal"
             });
        }
    });
  };

  const handleLinkSupplier = (supplierId: string, supplierName: string) => {
      setSelectedSupplier(supplierId);
      if (contractId) {
          updateContract.mutate({
              id: contractId,
              supplier_id: supplierId,
              supplier_name: supplierName
          });
      }
      onSupplierChange?.(supplierId, supplierName);
      toast.success(`Fornecedor ${supplierName} vinculado!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestão de Fornecedores
        </h3>
        <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <div className="flex gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Buscar fornecedor para vincular..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
              />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
              const isLinked = selectedSupplier === supplier.id;
              return (
                  <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-md ${isLinked ? "border-primary bg-primary/5 ring-1 ring-primary" : ""}`} onClick={() => handleLinkSupplier(supplier.id, supplier.nome_fantasia)}>
                      <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isLinked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                      <Building2 className="h-5 w-5" />
                                  </div>
                                  <div>
                                      <p className="font-semibold text-sm">{supplier.nome_fantasia}</p>
                                      <p className="text-xs text-muted-foreground">{supplier.cnpj}</p>
                                  </div>
                              </div>
                              {isLinked && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className={categoriaColors[supplier.categoria] || "bg-muted"}>{supplier.categoria}</Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {supplier.cidade}/{supplier.uf}
                              </div>
                          </div>

                          {(supplier.fornecedor_precos || []).length > 0 && (
                              <div className="pt-2 border-t border-border/50">
                                  <p className="text-xs font-medium mb-1">Preços Cadastrados:</p>
                                  <div className="space-y-1">
                                      {supplier.fornecedor_precos.slice(0, 2).map((p: any) => (
                                          <div key={p.id} className="text-xs flex justify-between text-muted-foreground">
                                              <span>{p.veiculo}</span>
                                              <span className="font-mono text-foreground">R$ {p.valor}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </CardContent>
                  </Card>
              );
          })}
          {filteredSuppliers.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <p>Nenhum fornecedor encontrado.</p>
                  <Button variant="link" onClick={() => setShowCreateDialog(true)}>Cadastrar novo</Button>
              </div>
          )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Novo Fornecedor</DialogTitle>
                <DialogDescription>Cadastre um fornecedor para vincular a esta licitação.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                    <Label>Nome Fantasia *</Label>
                    <Input value={newSupplier.nomeFantasia} onChange={e => setNewSupplier({...newSupplier, nomeFantasia: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>CNPJ *</Label>
                    <Input value={newSupplier.cnpj} onChange={e => setNewSupplier({...newSupplier, cnpj: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={newSupplier.categoria} onValueChange={v => setNewSupplier({...newSupplier, categoria: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {veiculoOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={newSupplier.cidade} onChange={e => setNewSupplier({...newSupplier, cidade: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={newSupplier.contatoWhatsapp} onChange={e => setNewSupplier({...newSupplier, contatoWhatsapp: e.target.value})} />
                </div>
                
                <div className="col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold mb-3">Preço Inicial (Opcional)</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label>Veículo</Label>
                            <Select value={newSupplier.veiculo} onValueChange={v => setNewSupplier({...newSupplier, veiculo: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {veiculoOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo Cobrança</Label>
                            <Select value={newSupplier.tipoCobranca} onValueChange={v => setNewSupplier({...newSupplier, tipoCobranca: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mensal">Mensal</SelectItem>
                                    <SelectItem value="por_km">Por KM</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input type="number" placeholder="0.00" value={newSupplier.valor} onChange={e => setNewSupplier({...newSupplier, valor: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                <LoadingButton loading={createFornecedor.isPending} onClick={handleCreateSupplier}>Cadastrar e Vincular</LoadingButton>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
