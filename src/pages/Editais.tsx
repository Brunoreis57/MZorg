import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/LoadingButton";
import {
  useCreateBidding,
  useCreateEditalAnalise,
  useDeleteEditalAnalise,
  useEditaisAnalise,
  useUpdateEditalAnalise,
} from "@/hooks/useSupabaseData";
import { ExternalLink, FileText, Plus, RefreshCw, Send, Trash2, Upload, Building2, MapPin, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

type EditalAnaliseRow = {
  id: string;
  created_at: string;
  texto_capturado?: string | null;
  url_origem?: string | null;
  code?: string | null;
  object?: string | null;
  entity?: string | null;
  city?: string | null;
  uf?: string | null;
  date?: string | null;
  time?: string | null;
  estimated_value?: number | null;
  pdf_url?: string | null;
  status?: string | null;
  sent_bidding_id?: string | null;
  manual?: boolean | null;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20" },
  enviado: { label: "Enviado", className: "bg-success/10 text-success border-success/20" },
  descartado: { label: "Descartado", className: "bg-muted text-muted-foreground border-border" },
};

const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Editais() {
  const navigate = useNavigate();
  const { data: editaisData = [], isLoading, refetch, isFetching } = useEditaisAnalise();
  const createEdital = useCreateEditalAnalise();
  const updateEdital = useUpdateEditalAnalise();
  const deleteEdital = useDeleteEditalAnalise();
  const createBidding = useCreateBidding();

  const items = useMemo(() => editaisData as EditalAnaliseRow[], [editaisData]);

  const [openCreate, setOpenCreate] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [form, setForm] = useState({
    code: "",
    object: "",
    entity: "",
    city: "",
    uf: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    estimated_value: 0,
    pdf_url: "",
    url_origem: "",
    texto_capturado: "",
  });

  const resetForm = () => {
    setForm({
      code: "",
      object: "",
      entity: "",
      city: "",
      uf: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      estimated_value: 0,
      pdf_url: "",
      url_origem: "",
      texto_capturado: "",
    });
  };

  const canCreate = useMemo(() => {
    return !!form.code.trim() && !!form.object.trim() && !!form.entity.trim() && !!form.city.trim() && !!form.uf.trim() && !!form.date;
  }, [form]);

  const handleUploadPdf = async (file: File) => {
    setPdfUploading(true);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const name = `editais/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(name, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("documents").getPublicUrl(name);
      setForm((prev) => ({ ...prev, pdf_url: data.publicUrl }));
    } finally {
      setPdfUploading(false);
    }
  };

  const handleCreate = () => {
    if (!canCreate) return;
    createEdital.mutate(
      {
        manual: true,
        status: "pendente",
        code: form.code.trim(),
        object: form.object.trim(),
        entity: form.entity.trim(),
        city: form.city.trim(),
        uf: form.uf.trim().toUpperCase(),
        date: form.date,
        time: form.time || null,
        estimated_value: Number(form.estimated_value || 0),
        pdf_url: form.pdf_url || null,
        url_origem: form.url_origem || null,
        texto_capturado: form.texto_capturado || null,
      },
      {
        onSuccess: () => {
          setOpenCreate(false);
          resetForm();
        },
      }
    );
  };

  const handleSendToLicitacoes = (edital: EditalAnaliseRow) => {
    if (!edital.code || !edital.object || !edital.entity || !edital.city || !edital.uf || !edital.date) return;
    createBidding.mutate(
      {
        code: edital.code,
        object: edital.object,
        entity: edital.entity,
        city: edital.city,
        uf: edital.uf,
        portal: "Editais+",
        type: "Pregão Eletrônico",
        date: edital.date,
        time: edital.time || "00:00",
        estimated_value: Number(edital.estimated_value || 0),
        status: "Em Análise",
        edital_url: edital.pdf_url || null,
      },
      {
        onSuccess: (data: any) => {
          updateEdital.mutate({
            id: edital.id,
            status: "enviado",
            sent_bidding_id: data?.id || null,
          });
          if (data?.id) navigate(`/licitacoes/${data.id}`);
          else navigate("/licitacoes");
        },
      }
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Editais para Análise
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} registro(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setOpenCreate(true)}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="table-header text-left pl-4">Código / Objeto</th>
                  <th className="table-header text-left">Órgão / Local</th>
                  <th className="table-header text-left">Data</th>
                  <th className="table-header text-left">Valor Est.</th>
                  <th className="table-header text-center w-12">PDF</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-right pr-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(isLoading || isFetching) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Carregando...
                    </td>
                  </tr>
                )}

                {!isLoading && !isFetching && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum edital encontrado
                    </td>
                  </tr>
                )}

                {!isLoading && !isFetching && items.map((edital) => {
                  const statusKey = (edital.status || "pendente").toLowerCase();
                  const st = statusConfig[statusKey] || { label: edital.status || "Pendente", className: "bg-muted text-muted-foreground border-border" };
                  const dateStr = edital.date || edital.created_at;
                  const dateLabel = (() => {
                    try {
                      return format(parseISO(dateStr), "dd/MM/yy");
                    } catch {
                      return new Date(dateStr).toLocaleDateString("pt-BR");
                    }
                  })();
                  const canSend = (statusKey !== "enviado")
                    && !!edital.code && !!edital.object && !!edital.entity && !!edital.city && !!edital.uf && !!edital.date;

                  return (
                    <tr key={edital.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 pl-4 max-w-[300px]">
                        <div className="font-medium text-foreground truncate" title={edital.code || ""}>{edital.code || "-"}</div>
                        <div className="text-xs text-muted-foreground truncate" title={edital.object || ""}>{edital.object || "-"}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {edital.entity || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {(edital.city || "").toUpperCase()}/{(edital.uf || "").toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {dateLabel}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 pl-5">{edital.time || ""}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-mono text-sm font-medium text-foreground">{fmtBRL(Number(edital.estimated_value || 0))}</div>
                      </td>
                      <td className="py-3 text-center">
                        {edital.pdf_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => window.open(edital.pdf_url!, "_blank")}
                            title="Ver PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={`font-medium border ${st.className}`}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          {edital.url_origem && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => window.open(edital.url_origem!, "_blank")}
                              title="Ver site"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${canSend ? "text-muted-foreground hover:text-primary" : "text-muted-foreground/40"}`}
                            disabled={!canSend}
                            onClick={() => handleSendToLicitacoes(edital)}
                            title="Enviar p/ Licitações"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEdital.mutate(edital.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Adicionar Edital</DialogTitle>
            <DialogDescription>Preencha os campos e salve para analisar depois.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objeto *</Label>
              <Input value={form.object} onChange={(e) => setForm((p) => ({ ...p, object: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Órgão *</Label>
                <Input value={form.entity} onChange={(e) => setForm((p) => ({ ...p, entity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor Est.</Label>
                <CurrencyInput value={form.estimated_value} onChange={(val) => setForm((p) => ({ ...p, estimated_value: Number(val || 0) }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Local (Cidade) *</Label>
                <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>UF *</Label>
                <Input maxLength={2} value={form.uf} onChange={(e) => setForm((p) => ({ ...p, uf: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Hora (opcional)</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>PDF (URL)</Label>
                <Input value={form.pdf_url} onChange={(e) => setForm((p) => ({ ...p, pdf_url: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>PDF (Upload)</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  disabled={pdfUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadPdf(file);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Site (URL)</Label>
                <Input value={form.url_origem} onChange={(e) => setForm((p) => ({ ...p, url_origem: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observação / Captura</Label>
              <Input value={form.texto_capturado} onChange={(e) => setForm((p) => ({ ...p, texto_capturado: e.target.value }))} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancelar
            </Button>
            <LoadingButton
              onClick={handleCreate}
              disabled={!canCreate || pdfUploading}
              loading={createEdital.isPending || pdfUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Salvar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
