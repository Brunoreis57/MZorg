import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/components/LoadingButton";
import { useBiddings, useCreateDailyService, useFornecedores, useUpdateDailyService } from "@/hooks/useSupabaseData";

type ServiceStatus = "agendado" | "em_andamento" | "finalizado" | "faturado";

const statusOptions: { value: ServiceStatus; label: string }[] = [
  { value: "agendado", label: "Agendado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "faturado", label: "Faturado" },
];

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBiddingId?: string;
  defaultFornecedorId?: string;
  initialService?: any | null;
}

export function CreateServiceDialog({
  open,
  onOpenChange,
  defaultBiddingId,
  defaultFornecedorId,
  initialService,
}: CreateServiceDialogProps) {
  const { data: fornecedoresData } = useFornecedores();
  const { data: biddingsData } = useBiddings();
  const createService = useCreateDailyService();
  const updateService = useUpdateDailyService();

  const fornecedores = fornecedoresData || [];
  const biddings = biddingsData || [];

  const [biddingId, setBiddingId] = useState<string>("none");
  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [data, setData] = useState<string>(new Date().toISOString().split("T")[0]);
  const [horaSaida, setHoraSaida] = useState<string>("07:00");
  const [previsaoVolta, setPrevisaoVolta] = useState<string>("17:00");
  const [status, setStatus] = useState<ServiceStatus>("agendado");
  const [observacoes, setObservacoes] = useState<string>("");

  const fornecedorNome = useMemo(() => {
    return fornecedores.find((f: any) => f.id === fornecedorId)?.nome_fantasia || "";
  }, [fornecedores, fornecedorId]);

  useEffect(() => {
    if (!open) return;
    if (initialService) {
      setBiddingId(initialService.bidding_id ? initialService.bidding_id : "none");
      setFornecedorId(initialService.fornecedor_id || "");
      setData(initialService.data || new Date().toISOString().split("T")[0]);
      setHoraSaida(initialService.hora_saida || "07:00");
      setPrevisaoVolta(initialService.previsao_volta || "17:00");
      setStatus((initialService.status as ServiceStatus) || "agendado");
      setObservacoes(initialService.observacoes || "");
      return;
    }
    setBiddingId(defaultBiddingId ? defaultBiddingId : "none");
    setFornecedorId(defaultFornecedorId ? defaultFornecedorId : "");
    setData(new Date().toISOString().split("T")[0]);
    setHoraSaida("07:00");
    setPrevisaoVolta("17:00");
    setStatus("agendado");
    setObservacoes("");
  }, [open, defaultBiddingId, defaultFornecedorId, initialService]);

  const canSubmit = useMemo(() => {
    return !!fornecedorId && !!data;
  }, [fornecedorId, data]);

  const biddingOptions = useMemo(() => {
    return [...biddings].sort((a: any, b: any) => (a.code || "").localeCompare(b.code || ""));
  }, [biddings]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    const payload = {
      bidding_id: biddingId === "none" ? null : biddingId,
      data,
      hora_saida: horaSaida,
      previsao_volta: previsaoVolta,
      fornecedor_id: fornecedorId,
      fornecedor_nome: fornecedorNome,
      status,
      observacoes: observacoes.trim() || null,
    };

    if (initialService?.id) {
      updateService.mutate(
        { id: initialService.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      );
      return;
    }

    createService.mutate(
      { ...payload, items: [] },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialService?.id ? "Editar Serviço" : "Criar Serviço"}</DialogTitle>
          <DialogDescription>{initialService?.id ? "Atualize os dados da OS." : "Registre uma nova OS para um fornecedor."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fornecedor *</Label>
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Licitação (opcional)</Label>
              <Select value={biddingId} onValueChange={setBiddingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {biddingOptions.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Saída</Label>
              <Input type="time" value={horaSaida} onChange={(e) => setHoraSaida(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Volta</Label>
              <Input type="time" value={previsaoVolta} onChange={(e) => setPrevisaoVolta(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ServiceStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <LoadingButton onClick={handleSubmit} disabled={!canSubmit} loading={createService.isPending || updateService.isPending}>
            {initialService?.id ? "Salvar" : "Criar"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
