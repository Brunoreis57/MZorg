import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, Plus, Phone, Mail, MapPin, Building2, LinkIcon, FileText, User, List, LayoutGrid, Edit, Trash2, DollarSign,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingButton } from "@/components/LoadingButton";
import { toast } from "sonner";
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor } from "@/hooks/useSupabaseData";

type Categoria = "Van" | "Ônibus" | "Micro" | "Máquinas";
type TipoCobranca = "mensal" | "por_km";
type ViewMode = "cards" | "list";

const categoriaColors: Record<string, string> = {
  "Van": "bg-info/15 text-info border-info/30",
  "Ônibus": "bg-warning/15 text-warning border-warning/30",
  "Micro": "bg-primary/15 text-primary border-primary/30",
  "Máquinas": "bg-success/15 text-success border-success/30",
};

const veiculoOptions = ["Van", "Ônibus", "Micro", "Máquina"];

interface PrecoForm {
  veiculo: string;
  tipoCobranca: TipoCobranca;
  valor: string;
  nomeMaquina: string;
}

const emptyPreco: PrecoForm = { veiculo: "Van", tipoCobranca: "mensal", valor: "", nomeMaquina: "" };

const emptyFornecedor = {
  nomeFantasia: "", razaoSocial: "", cnpj: "", categoria: "Van" as Categoria,
  cidade: "", uf: "", contatoWhatsapp: "", email: "", ativo: true,
};

export default function Fornecedores() {
  const { data: fornecedoresData, isLoading } = useFornecedores();
  const createFornecedor = useCreateFornecedor();
  const updateFornecedor = useUpdateFornecedor();
  const deleteFornecedor = useDeleteFornecedor();

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroCidade, setFiltroCidade] = useState<string>("todas");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [detailOpen, setDetailOpen] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
  const [form, setForm] = useState(emptyFornecedor);
  const [precosForm, setPrecosForm] = useState<PrecoForm[]>([{ ...emptyPreco }]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fornecedores = fornecedoresData || [];

  const cidades = useMemo(() => [...new Set(fornecedores.map((f) => f.cidade).filter(Boolean))], [fornecedores]);

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((f) => {
      const matchBusca = f.nome_fantasia.toLowerCase().includes(busca.toLowerCase()) || f.cnpj.includes(busca);
      const matchCategoria = filtroCategoria === "todas" || f.categoria === filtroCategoria;
      const matchCidade = filtroCidade === "todas" || f.cidade === filtroCidade;
      return matchBusca && matchCategoria && matchCidade;
    });
  }, [busca, filtroCategoria, filtroCidade, fornecedores]);

  function openCreate() {
    setEditingFornecedor(null);
    setForm(emptyFornecedor);
    setPrecosForm([{ ...emptyPreco }]);
    setFormOpen(true);
  }

  function openEdit(f: any) {
    setEditingFornecedor(f);
    setForm({
      nomeFantasia: f.nome_fantasia, razaoSocial: f.razao_social || "", cnpj: f.cnpj,
      categoria: f.categoria as Categoria, cidade: f.cidade || "", uf: f.uf || "",
      contatoWhatsapp: f.contato_whatsapp || "", email: f.email || "", ativo: f.ativo,
    });
    setPrecosForm(
      (f.fornecedor_precos || []).length > 0
        ? f.fornecedor_precos.map((p: any) => ({
            veiculo: p.nome_maquina ? "Máquina" : p.veiculo,
            tipoCobranca: p.tipo_cobranca as TipoCobranca,
            valor: p.valor.toString(),
            nomeMaquina: p.nome_maquina || "",
          }))
        : [{ ...emptyPreco }]
    );
    setDetailOpen(null);
    setFormOpen(true);
  }

  function addPrecoRow() { setPrecosForm((prev) => [...prev, { ...emptyPreco }]); }
  function removePrecoRow(index: number) { setPrecosForm((prev) => prev.filter((_, i) => i !== index)); }
  function updatePrecoRow(index: number, key: keyof PrecoForm, value: string) {
    setPrecosForm((prev) => prev.map((p, i) => i === index ? { ...p, [key]: value } : p));
  }

  async function handleSave() {
    if (!form.nomeFantasia || !form.cnpj) { toast.error("Preencha Nome Fantasia e CNPJ."); return; }

    const precos = precosForm
      .filter((p) => p.valor && parseFloat(p.valor) > 0)
      .map((p) => ({
        veiculo: p.veiculo === "Máquina" ? "Máquina" : p.veiculo,
        tipo_cobranca: p.tipoCobranca,
        valor: parseFloat(p.valor),
        ...(p.veiculo === "Máquina" && p.nomeMaquina ? { nome_maquina: p.nomeMaquina } : {}),
      }));

    if (editingFornecedor) {
      updateFornecedor.mutate({
        id: editingFornecedor.id,
        nome_fantasia: form.nomeFantasia, razao_social: form.razaoSocial,
        cnpj: form.cnpj, categoria: form.categoria,
        cidade: form.cidade, uf: form.uf,
        contato_whatsapp: form.contatoWhatsapp, email: form.email,
        ativo: form.ativo, precos,
      });
    } else {
      createFornecedor.mutate({
        nome_fantasia: form.nomeFantasia, razao_social: form.razaoSocial,
        cnpj: form.cnpj, categoria: form.categoria,
        cidade: form.cidade, uf: form.uf,
        contato_whatsapp: form.contatoWhatsapp, email: form.email,
        ativo: form.ativo, precos,
      });
    }
    setFormOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteFornecedor.mutate({ id: deleteTarget.id, nome: deleteTarget.nome_fantasia });
    setDeleteTarget(null);
    setDetailOpen(null);
  }

  const updateForm = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  function formatPrecoLabel(p: any) {
    const label = p.nome_maquina || p.veiculo;
    const tipo = p.tipo_cobranca === "mensal" ? "/mês" : "/km";
    return `${label}: R$ ${Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${tipo}`;
  }

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
          <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">CRM de compras e parceiros</p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />Novo Fornecedor
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Categorias</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Ônibus">Ônibus</SelectItem>
                <SelectItem value="Micro">Micro</SelectItem>
                <SelectItem value="Máquinas">Máquinas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroCidade} onValueChange={setFiltroCidade}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Cidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Cidades</SelectItem>
                {cidades.map((c) => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
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
        </CardContent>
      </Card>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {fornecedoresFiltrados.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailOpen(f)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{f.nome_fantasia}</p>
                      <p className="text-xs text-muted-foreground">{f.cnpj}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={f.ativo ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                    {f.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <Badge variant="outline" className={`${categoriaColors[f.categoria] || "bg-muted"} mb-3`}>{f.categoria}</Badge>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /><span>{f.cidade} - {f.uf}</span></div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{f.contato_whatsapp}</span></div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{f.email}</span></div>
                </div>
                {(f.fornecedor_precos || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />Valores ({f.fornecedor_precos.length})
                    </p>
                    {f.fornecedor_precos.slice(0, 2).map((p: any) => (
                      <div key={p.id} className="text-xs text-foreground/80 truncate">• {formatPrecoLabel(p)}</div>
                    ))}
                    {f.fornecedor_precos.length > 2 && <div className="text-xs text-muted-foreground">+{f.fornecedor_precos.length - 2} mais</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Fornecedor</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">CNPJ</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Cidade/UF</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedoresFiltrados.map((f) => (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setDetailOpen(f)}>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-foreground">{f.nome_fantasia}</p>
                        <p className="text-xs text-muted-foreground">{f.razao_social}</p>
                      </td>
                      <td className="p-4"><span className="text-sm font-mono text-muted-foreground">{f.cnpj}</span></td>
                      <td className="p-4"><Badge variant="outline" className={categoriaColors[f.categoria] || "bg-muted"}>{f.categoria}</Badge></td>
                      <td className="p-4"><span className="text-sm text-muted-foreground">{f.cidade}/{f.uf}</span></td>
                      <td className="p-4">
                        <Badge variant="outline" className={f.ativo ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                          {f.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(f); }}>
                          <Edit className="h-4 w-4" />
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

      {fornecedoresFiltrados.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum fornecedor encontrado</p>
          <p className="text-sm">Ajuste os filtros ou cadastre um novo fornecedor</p>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailOpen} onOpenChange={(open) => !open && setDetailOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailOpen && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span>{detailOpen.nome_fantasia}</span>
                    <p className="text-sm font-normal text-muted-foreground">{detailOpen.razao_social}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(detailOpen)}>
                    <Edit className="h-3.5 w-3.5" />Editar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(detailOpen)}>
                    <Trash2 className="h-3.5 w-3.5" />Excluir
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">CNPJ</Label><p className="text-sm font-medium">{detailOpen.cnpj}</p></div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Categoria</Label><div><Badge variant="outline" className={categoriaColors[detailOpen.categoria] || "bg-muted"}>{detailOpen.categoria}</Badge></div></div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">WhatsApp</Label><p className="text-sm">{detailOpen.contato_whatsapp}</p></div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">E-mail</Label><p className="text-sm">{detailOpen.email}</p></div>
                  <div className="space-y-1 col-span-2"><Label className="text-xs text-muted-foreground">Localização</Label><p className="text-sm">{detailOpen.cidade} - {detailOpen.uf}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-primary" />Tabela de Preços</h4>
                  {(detailOpen.fornecedor_precos || []).length > 0 ? (
                    <div className="space-y-2">
                      {detailOpen.fornecedor_precos.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.nome_maquina || p.veiculo}</p>
                            <p className="text-xs text-muted-foreground">{p.tipo_cobranca === "mensal" ? "Valor Mensal" : "Valor por KM"}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground font-mono">
                            R$ {Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{p.tipo_cobranca === "por_km" ? "/km" : "/mês"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Nenhum preço cadastrado</p>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            <DialogDescription>{editingFornecedor ? "Atualize os dados do fornecedor." : "Preencha os dados para cadastrar."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nome Fantasia *</Label><Input value={form.nomeFantasia} onChange={(e) => updateForm("nomeFantasia", e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">CNPJ *</Label><Input value={form.cnpj} onChange={(e) => updateForm("cnpj", e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs text-muted-foreground">Razão Social</Label><Input value={form.razaoSocial} onChange={(e) => updateForm("razaoSocial", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => updateForm("categoria", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Ônibus">Ônibus</SelectItem>
                    <SelectItem value="Micro">Micro</SelectItem>
                    <SelectItem value="Máquinas">Máquinas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Cidade</Label><Input value={form.cidade} onChange={(e) => updateForm("cidade", e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">UF</Label><Input value={form.uf} onChange={(e) => updateForm("uf", e.target.value)} maxLength={2} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">WhatsApp</Label><Input value={form.contatoWhatsapp} onChange={(e) => updateForm("contatoWhatsapp", e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">E-mail</Label><Input value={form.email} onChange={(e) => updateForm("email", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.ativo ? "ativo" : "inativo"} onValueChange={(v) => updateForm("ativo", v === "ativo")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-primary" />Valores Cobrados
                </h4>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addPrecoRow}>
                  <Plus className="h-3.5 w-3.5" />Adicionar
                </Button>
              </div>
              <div className="space-y-3">
                {precosForm.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Veículo/Tipo</Label>
                        <Select value={p.veiculo} onValueChange={(v) => updatePrecoRow(i, "veiculo", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {veiculoOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Cobrança</Label>
                        <Select value={p.tipoCobranca} onValueChange={(v) => updatePrecoRow(i, "tipoCobranca", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="por_km">Por KM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                        <Input type="number" placeholder="0,00" value={p.valor} onChange={(e) => updatePrecoRow(i, "valor", e.target.value)} />
                      </div>
                      {precosForm.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="mt-5 text-destructive hover:text-destructive" onClick={() => removePrecoRow(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {p.veiculo === "Máquina" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Nome da Máquina</Label>
                        <Input placeholder="Ex: Escavadeira CAT 320" value={p.nomeMaquina} onChange={(e) => updatePrecoRow(i, "nomeMaquina", e.target.value)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <LoadingButton loading={createFornecedor.isPending || updateFornecedor.isPending} onClick={handleSave}>
              {editingFornecedor ? "Salvar Alterações" : "Cadastrar"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir ${deleteTarget?.nome_fantasia}? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        loading={deleteFornecedor.isPending}
      />
    </div>
  );
}
