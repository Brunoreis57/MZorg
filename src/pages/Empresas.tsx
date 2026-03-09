import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputWithCopy } from "@/components/ui/input-with-copy";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2, Upload, FileText, AlertTriangle, CheckCircle2, XCircle, Shield, Plus, Save, Pencil, Trash2, Calendar, RefreshCw, Copy
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { LoadingButton } from "@/components/LoadingButton";
import { toast } from "sonner";
import { useEmpresas, useCreateEmpresa, useUpdateEmpresa, useDeleteEmpresa, useCertidoes, useDocumentos, useCreateDocumento, useCreateCertidao } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

function getCertidaoStatus(dataVencimento: string) {
  const hoje = new Date();
  const vencimento = parseISO(dataVencimento);
  const dias = differenceInDays(vencimento, hoje);
  if (dias < 0) return { label: "Vencida", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, dias };
  if (dias <= 15) return { label: "Expirando", color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle, dias };
  return { label: "Válida", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, dias };
}

function EmpresaContent({ empresa }: { empresa: any }) {
    const updateEmpresa = useUpdateEmpresa();
    const deleteEmpresa = useDeleteEmpresa();
    const createDocumento = useCreateDocumento();
    const createCertidao = useCreateCertidao();
    const { data: certidoes = [] } = useCertidoes(empresa.id);
    const { data: documentos = [] } = useDocumentos(empresa.id);

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(empresa);
    
    // Dialogs
    const [docDialogOpen, setDocDialogOpen] = useState(false);
    const [certidaoDialogOpen, setCertidaoDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newItem, setNewItem] = useState<any>({});

    useEffect(() => { setForm(empresa); }, [empresa]);

    const handleSave = () => {
        updateEmpresa.mutate({ id: empresa.id, ...form });
        setIsEditing(false);
    };

    const handleDelete = () => {
        deleteEmpresa.mutate(empresa.id, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                // A lista será atualizada automaticamente pelo invalidateQueries
            }
        });
    };

    const handleCreateDoc = () => {
        if(!newItem.nome) return toast.error("Nome obrigatório");
        createDocumento.mutate({
            empresa_id: empresa.id,
            nome: newItem.nome,
            tipo: "documento",
            // url: ... (upload logic would go here)
        }, { onSuccess: () => { setDocDialogOpen(false); setNewItem({}); } });
    };

    const handleCreateCertidao = () => {
        if(!newItem.nome || !newItem.data_vencimento) return toast.error("Campos obrigatórios faltando");
        createCertidao.mutate({
            empresa_id: empresa.id,
            nome: newItem.nome,
            orgao: newItem.orgao,
            data_emissao: newItem.data_emissao,
            data_vencimento: newItem.data_vencimento
        }, { onSuccess: () => { setCertidaoDialogOpen(false); setNewItem({}); } });
    };

    const handleCopy = () => {
        const text = `*DADOS DA EMPRESA*\n\n` +
            `*Razão Social:* ${empresa.nome}\n` +
            `*CNPJ:* ${empresa.cnpj}\n` +
            `*I.E.:* ${empresa.inscricao_estadual || "N/A"}\n` +
            `*I.M.:* ${empresa.inscricao_municipal || "N/A"}\n\n` +
            `*ENDEREÇO*\n` +
            `${empresa.endereco || ""}\n` +
            `${empresa.cidade || ""} - ${empresa.uf || ""}\n` +
            `CEP: ${empresa.cep || ""}\n\n` +
            `*DADOS BANCÁRIOS*\n` +
            `Banco: ${empresa.banco || ""}\n` +
            `Agência: ${empresa.agencia || ""}  Conta: ${empresa.conta || ""}\n` +
            `PIX: ${empresa.pix_chave || ""}`;
        
        navigator.clipboard.writeText(text);
        toast.success("Dados copiados!");
    };

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {empresa.nome}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">{empresa.cnpj}</p>
                </div>
                {!isEditing ? (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                            <Copy className="h-4 w-4" /> Copiar Dados
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                            <Pencil className="h-4 w-4" /> Editar Dados
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setForm(empresa); }}>Cancelar</Button>
                        <LoadingButton size="sm" onClick={handleSave} loading={updateEmpresa.isPending} className="gap-2">
                            <Save className="h-4 w-4" /> Salvar
                        </LoadingButton>
                    </div>
                )}
            </div>

            <Tabs defaultValue="dados" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger value="dados" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Dados Gerais</TabsTrigger>
                    <TabsTrigger value="certidoes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Certidões ({certidoes.length})</TabsTrigger>
                    <TabsTrigger value="documentos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Documentos ({documentos.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Informações Cadastrais</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1"><Label>Razão Social</Label><InputWithCopy disabled={!isEditing} value={form.nome || ""} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                            <div className="space-y-1"><Label>CNPJ</Label><InputWithCopy disabled={!isEditing} value={form.cnpj || ""} onChange={e => setForm({...form, cnpj: e.target.value})} /></div>
                            <div className="space-y-1"><Label>Inscrição Estadual</Label><InputWithCopy disabled={!isEditing} value={form.inscricao_estadual || ""} onChange={e => setForm({...form, inscricao_estadual: e.target.value})} /></div>
                            <div className="space-y-1"><Label>Inscrição Municipal</Label><InputWithCopy disabled={!isEditing} value={form.inscricao_municipal || ""} onChange={e => setForm({...form, inscricao_municipal: e.target.value})} /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3 space-y-1"><Label>Logradouro</Label><InputWithCopy disabled={!isEditing} value={form.endereco || ""} onChange={e => setForm({...form, endereco: e.target.value})} /></div>
                            <div className="space-y-1"><Label>Cidade</Label><InputWithCopy disabled={!isEditing} value={form.cidade || ""} onChange={e => setForm({...form, cidade: e.target.value})} /></div>
                            <div className="space-y-1"><Label>UF</Label><InputWithCopy disabled={!isEditing} value={form.uf || ""} onChange={e => setForm({...form, uf: e.target.value})} /></div>
                            <div className="space-y-1"><Label>CEP</Label><InputWithCopy disabled={!isEditing} value={form.cep || ""} onChange={e => setForm({...form, cep: e.target.value})} /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Dados Bancários</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1"><Label>Banco</Label><InputWithCopy disabled={!isEditing} value={form.banco || ""} onChange={e => setForm({...form, banco: e.target.value})} /></div>
                            <div className="space-y-1"><Label>Agência</Label><InputWithCopy disabled={!isEditing} value={form.agencia || ""} onChange={e => setForm({...form, agencia: e.target.value})} /></div>
                            <div className="space-y-1"><Label>Conta</Label><InputWithCopy disabled={!isEditing} value={form.conta || ""} onChange={e => setForm({...form, conta: e.target.value})} /></div>
                            <div className="md:col-span-3 space-y-1"><Label>Chave PIX</Label><InputWithCopy disabled={!isEditing} value={form.pix_chave || ""} onChange={e => setForm({...form, pix_chave: e.target.value})} /></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="certidoes" className="mt-6 space-y-4">
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setCertidaoDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4"/> Nova Certidão</Button>
                    </div>
                    {certidoes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed bg-muted/20">Nenhuma certidão cadastrada</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {certidoes.map((c: any) => {
                                const status = getCertidaoStatus(c.data_vencimento);
                                const StatusIcon = status.icon;
                                return (
                                    <Card key={c.id}>
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <Shield className="h-4 w-4 text-primary" />
                                                    {c.nome}
                                                </div>
                                                <Badge variant="outline" className={`${status.color} border gap-1`}>
                                                    <StatusIcon className="h-3 w-3" /> {status.label}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p className="flex justify-between"><span>Emissão:</span> <span>{format(parseISO(c.data_emissao), "dd/MM/yyyy")}</span></p>
                                                <p className="flex justify-between font-medium text-foreground"><span>Vencimento:</span> <span>{format(parseISO(c.data_vencimento), "dd/MM/yyyy")}</span></p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="documentos" className="mt-6 space-y-4">
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setDocDialogOpen(true)} className="gap-2"><Upload className="h-4 w-4"/> Novo Documento</Button>
                    </div>
                    {documentos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed bg-muted/20">Nenhum documento cadastrado</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {documentos.map((d: any) => (
                                 <Card key={d.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                                     <CardContent className="p-4 flex items-center gap-3">
                                         <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                                             <FileText className="h-5 w-5" />
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <p className="font-medium truncate">{d.nome}</p>
                                             <p className="text-xs text-muted-foreground">{format(parseISO(d.created_at), "dd/MM/yyyy HH:mm")}</p>
                                         </div>
                                     </CardContent>
                                 </Card>
                             ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Documento</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2"><Label>Nome do Documento</Label><Input value={newItem.nome || ""} onChange={e => setNewItem({...newItem, nome: e.target.value})} /></div>
                        {/* Upload logic here */}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDocDialogOpen(false)}>Cancelar</Button>
                        <LoadingButton onClick={handleCreateDoc} loading={createDocumento.isPending}>Salvar</LoadingButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={certidaoDialogOpen} onOpenChange={setCertidaoDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Certidão</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2"><Label>Nome</Label><Input value={newItem.nome || ""} onChange={e => setNewItem({...newItem, nome: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Órgão Emissor</Label><Input value={newItem.orgao || ""} onChange={e => setNewItem({...newItem, orgao: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Emissão</Label><Input type="date" value={newItem.data_emissao || ""} onChange={e => setNewItem({...newItem, data_emissao: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={newItem.data_vencimento || ""} onChange={e => setNewItem({...newItem, data_vencimento: e.target.value})} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCertidaoDialogOpen(false)}>Cancelar</Button>
                        <LoadingButton onClick={handleCreateCertidao} loading={createCertidao.isPending}>Salvar</LoadingButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Empresa</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir a empresa <strong>{empresa.nome}</strong>? 
                            Esta ação não pode ser desfeita e removerá todos os documentos e certidões associados.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                        <LoadingButton onClick={handleDelete} loading={deleteEmpresa.isPending} variant="destructive">Excluir</LoadingButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function Empresas() {
  const { data: empresas, isLoading, refetch } = useEmpresas();
  const createEmpresa = useCreateEmpresa();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmpresa, setNewEmpresa] = useState({ nome: "", cnpj: "" });

  // Auto-select first if none selected
  useEffect(() => {
      if (!selectedId && empresas && empresas.length > 0) {
          setSelectedId(empresas[0].id);
      }
  }, [empresas, selectedId]);

  const handleCreate = () => {
      if(!newEmpresa.nome) return toast.error("Nome obrigatório");
      createEmpresa.mutate(newEmpresa, { 
          onSuccess: (data: any) => { 
              setCreateOpen(false); 
              setNewEmpresa({nome:"", cnpj:""});
              if (data && data.id) {
                  setSelectedId(data.id);
              }
          }
      });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minhas Empresas</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus CNPJs e documentos</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4"/> Nova Empresa</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
          {/* Sidebar List */}
          <Card className="h-fit">
              <CardContent className="p-2 space-y-1">
                  <div className="flex justify-between items-center px-3 py-2 border-b mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Lista</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => refetch()} title="Atualizar">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {isLoading ? (
                     Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2">
                           <Skeleton className="h-4 w-4 rounded" />
                           <Skeleton className="h-4 w-32" />
                        </div>
                     ))
                  ) : (empresas || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa</p>
                  ) : (
                      empresas?.map((emp: any) => (
                          <button
                              key={emp.id}
                              onClick={() => setSelectedId(emp.id)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${selectedId === emp.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                          >
                              <Building2 className="h-4 w-4" />
                              <span className="truncate">{emp.nome}</span>
                          </button>
                      ))
                  )}
              </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:min-h-[500px]">
              {isLoading && !selectedId ? (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                       </div>
                       <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="space-y-4">
                       <Skeleton className="h-10 w-full" />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Skeleton className="h-32 w-full" />
                          <Skeleton className="h-32 w-full" />
                       </div>
                    </div>
                 </div>
              ) : selectedId && empresas ? (
                  <EmpresaContent empresa={empresas.find((e: any) => e.id === selectedId)} />
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10 p-12">
                      <Building2 className="h-12 w-12 mb-4 opacity-20" />
                      <p>Selecione ou crie uma empresa para gerenciar</p>
                  </div>
              )}
          </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                  <div className="space-y-2"><Label>Razão Social</Label><Input value={newEmpresa.nome} onChange={e => setNewEmpresa({...newEmpresa, nome: e.target.value})} /></div>
                  <div className="space-y-2"><Label>CNPJ</Label><Input value={newEmpresa.cnpj} onChange={e => setNewEmpresa({...newEmpresa, cnpj: e.target.value})} /></div>
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <LoadingButton onClick={handleCreate} loading={createEmpresa.isPending}>Criar Empresa</LoadingButton>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
