import { useState } from "react";
import {
  Search, Filter, Plus, LayoutGrid, List, MoreHorizontal, MapPin, Building2, Calendar, Edit, Trash2, Eye, Upload, FileText, Download, Loader2, Link as LinkIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingButton } from "@/components/LoadingButton";
import { useNavigate } from "react-router-dom";
import { useBiddings, useCreateBidding, useUpdateBidding, useDeleteBidding } from "@/hooks/useSupabaseData";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ViewMode = "table" | "kanban";

const kanbanColumns = [
  { id: "Em Análise", label: "Em Análise", color: "bg-warning" },
  { id: "Habilitação", label: "Habilitação", color: "bg-primary" },
  { id: "Proposta Enviada", label: "Proposta Enviada", color: "bg-info" },
  { id: "Recurso", label: "Em Recurso", color: "bg-orange-500" },
  { id: "Ganha", label: "Ganha", color: "bg-success" },
  { id: "Perdida", label: "Perdida", color: "bg-destructive" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "Ganha": return "bg-success/10 text-success border-success/20";
    case "Perdida": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Em Análise": return "bg-warning/10 text-warning border-warning/20";
    case "Proposta Enviada": return "bg-info/10 text-info border-info/20";
    case "Habilitação": return "bg-primary/10 text-primary border-primary/20";
    case "Recurso": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

const emptyForm = {
  code: "", object: "", entity: "", city: "", uf: "", portal: "ComprasNet",
  estimated_value: 0, won_value: 0, date: "", time: "09:00", status: "Em Análise", type: "Pregão Eletrônico",
  attachment_url: "",
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatCurrencyInput(value: number): string {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function parseCurrencyInput(raw: string): number {
  // Remove everything except digits
  const digits = raw.replace(/\D/g, "");
  return parseInt(digits || "0", 10) / 100;
}

export default function Licitacoes() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const { data: biddings = [], isLoading } = useBiddings();
  const createBidding = useCreateBidding();
  const updateBidding = useUpdateBidding();
  const deleteBidding = useDeleteBidding();

  const filtered = biddings.filter((b) => {
    const matchSearch =
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.object.toLowerCase().includes(search.toLowerCase()) ||
      b.entity.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(e: React.MouseEvent, bid: typeof biddings[0]) {
    e.stopPropagation();
    setEditingId(bid.id);
    setForm({
      code: bid.code, object: bid.object, entity: bid.entity, city: bid.city, uf: bid.uf,
      portal: bid.portal, estimated_value: bid.estimated_value, won_value: (bid as any).won_value || 0, date: bid.date,
      time: bid.time, status: bid.status, type: bid.type,
      attachment_url: (bid as any).attachment_url || "",
    });
    setDialogOpen(true);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('editais')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('editais').getPublicUrl(filePath);
      updateForm("attachment_url", data.publicUrl);
      toast.success("Edital anexado!");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao fazer upload. Verifique se o bucket 'editais' existe.");
    } finally {
      setUploading(false);
    }
  };

  function handleDelete(e: React.MouseEvent, bid: typeof biddings[0]) {
    e.stopPropagation();
    setDeleteTarget({ id: bid.id, code: bid.code });
  }

  function handleSave() {
    if (editingId) {
      updateBidding.mutate({ id: editingId, ...form });
    } else {
      createBidding.mutate(form);
    }
    setDialogOpen(false);
  }

  // Used by ConfirmDialog at the bottom
  function confirmDelete() {
    if (deleteTarget) {
      deleteBidding.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  const updateForm = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Licitações</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus processos licitatórios</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-muted p-1 rounded-md flex">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              title="Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Licitação
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, objeto ou órgão..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Em Análise">Em Análise</SelectItem>
            <SelectItem value="Habilitação">Habilitação</SelectItem>
            <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
            <SelectItem value="Ganha">Ganha</SelectItem>
            <SelectItem value="Perdida">Perdida</SelectItem>
            <SelectItem value="Recurso">Recurso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="table-header text-left pl-4">Código / Objeto</th>
                    <th className="table-header text-left">Órgão / Local</th>
                    <th className="table-header text-left">Data</th>
                    <th className="table-header text-left">Valor Est.</th>
                    <th className="table-header text-left">Valor Ganho</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-center w-12">PDF</th>
                    <th className="table-header text-right pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhuma licitação encontrada
                      </td>
                    </tr>
                  )}
                  {filtered.map((bid) => (
                    <tr key={bid.id} className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => navigate(`/licitacoes/${bid.id}`)}>
                      <td className="py-3 pl-4 max-w-[300px]">
                        <div className="font-medium text-foreground truncate" title={bid.code}>{bid.code}</div>
                        <div className="text-xs text-muted-foreground truncate" title={bid.object}>{bid.object}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-foreground flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {bid.entity}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><MapPin className="h-3 w-3" /> {(bid.city || "").toUpperCase()}/{(bid.uf || "").toUpperCase()}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {format(parseISO(bid.date), "dd/MM/yy")}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 pl-5">{bid.time}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-mono text-sm font-medium text-foreground">{formatBRL(Number(bid.estimated_value))}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-mono text-sm font-medium text-success">{(bid as any).won_value ? formatBRL(Number((bid as any).won_value)) : "-"}</div>
                      </td>
                      <td className="py-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                              <Badge variant="outline" className={`font-medium border cursor-pointer hover:opacity-80 ${getStatusColor(bid.status)}`}>
                                {bid.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {["Em Análise", "Habilitação", "Proposta Enviada", "Recurso", "Ganha", "Em Execução", "Perdida"].map((s) => (
                                <DropdownMenuItem key={s} onClick={() => updateBidding.mutate({ id: bid.id, status: s })}>
                                  <span className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(s).split(" ")[0].replace("/10", "")}`} />
                                  {s}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {(bid as any).attachment_url && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary" 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open((bid as any).attachment_url, '_blank');
                              }}
                              title="Ver Edital"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => openEdit(e, bid)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, bid)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (

        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[calc(100vh-14rem)]">
          {kanbanColumns.map((col) => {
            const items = filtered.filter((b) => b.status === col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[280px] bg-muted/30 rounded-lg border border-border flex flex-col max-h-full">
                <div className={`p-3 border-b border-border flex items-center justify-between ${col.color.replace("bg-", "border-t-4 border-t-").replace("text-", "")}/20`}>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.color}`} />
                    {col.label}
                  </h3>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-[1.25rem] justify-center">{items.length}</Badge>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                  {items.map((bid) => (
                    <Card key={bid.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: `var(--${col.color.replace("bg-", "")})` }} onClick={() => navigate(`/licitacoes/${bid.id}`)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{bid.code}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => openEdit(e, bid)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleDelete(e, bid)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm font-medium line-clamp-2 leading-tight" title={bid.object}>{bid.object}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" /> <span className="truncate">{bid.entity}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> <span className="truncate">{(bid.city || "").toUpperCase()}/{(bid.uf || "").toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> {format(parseISO(bid.date), "dd/MM")}
                          </div>
                          <span className="text-xs font-bold text-foreground">{formatBRL(Number(bid.estimated_value))}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Vazio</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Licitação" : "Nova Licitação"}</DialogTitle>
            <DialogDescription>{editingId ? "Atualize os dados da licitação." : "Preencha os dados para cadastrar uma nova licitação."}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Código *</Label>
              <Input value={form.code} onChange={(e) => updateForm("code", e.target.value)} placeholder="PE 001/2026" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Modalidade</Label>
              <Select value={form.type} onValueChange={(v) => updateForm("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pregão Eletrônico">Pregão Eletrônico</SelectItem>
                  <SelectItem value="Tomada de Preços">Tomada de Preços</SelectItem>
                  <SelectItem value="Concorrência">Concorrência</SelectItem>
                  <SelectItem value="Convite">Convite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Objeto *</Label>
              <Input value={form.object} onChange={(e) => updateForm("object", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Órgão *</Label>
              <Input value={form.entity} onChange={(e) => updateForm("entity", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Portal</Label>
              <Select value={form.portal} onValueChange={(v) => updateForm("portal", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ComprasNet">ComprasNet</SelectItem>
                  <SelectItem value="BLL">BLL</SelectItem>
                  <SelectItem value="Licitações-e">Licitações-e</SelectItem>
                  <SelectItem value="Portal de Compras">Portal de Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cidade</Label>
              <Input value={form.city} onChange={(e) => updateForm("city", e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">UF</Label>
              <Input value={form.uf} onChange={(e) => updateForm("uf", e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor Estimado (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <Input
                    value={formatCurrencyInput(form.estimated_value)}
                    onChange={(e) => updateForm("estimated_value", parseCurrencyInput(e.target.value))}
                    className="pl-9 font-mono text-sm"
                    placeholder="0,00"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor Ganho (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <Input
                    value={formatCurrencyInput((form as any).won_value)}
                    onChange={(e) => updateForm("won_value", parseCurrencyInput(e.target.value))}
                    className="pl-9 font-mono text-sm"
                    placeholder="0,00"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Habilitação">Habilitação</SelectItem>
                  <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                  <SelectItem value="Recurso">Recurso</SelectItem>
                  <SelectItem value="Ganha">Ganha</SelectItem>
                  <SelectItem value="Em Execução">Em Execução</SelectItem>
                  <SelectItem value="Perdida">Perdida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hora</Label>
              <Input value={form.time} onChange={(e) => updateForm("time", e.target.value)} placeholder="09:00" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Edital (URL ou Upload)</Label>
              <div className="flex gap-2">
                <Input 
                  value={form.attachment_url} 
                  onChange={(e) => updateForm("attachment_url", e.target.value)} 
                  placeholder="Cole o link ou faça upload..." 
                  className="flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    id="edital-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Label 
                    htmlFor="edital-upload" 
                    className={`inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                    title="Fazer upload"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Label>
                </div>
                {form.attachment_url && (
                  <Button variant="outline" size="icon" asChild title="Visualizar">
                    <a href={form.attachment_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <LoadingButton loading={createBidding.isPending || updateBidding.isPending} onClick={handleSave}>
              {editingId ? "Salvar" : "Criar"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Licitação"
        description={`Tem certeza que deseja excluir a licitação ${deleteTarget?.code}?`}
        onConfirm={confirmDelete}
        loading={deleteBidding.isPending}
      />
    </div>
  );
}
