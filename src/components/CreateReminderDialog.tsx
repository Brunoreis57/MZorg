import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useReminders, type ReminderType, type Reminder } from "@/contexts/RemindersContext";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const typeOptions: { value: ReminderType; label: string }[] = [
  { value: "recurso", label: "Recurso" },
  { value: "documento", label: "Entrega de Documento" },
  { value: "certidao", label: "Vencimento de Certidão" },
  { value: "pregao", label: "Pregão / Sessão" },
  { value: "outro", label: "Outro" },
];

interface CreateReminderDialogProps {
  trigger?: React.ReactNode;
  initialData?: Reminder;
  mode?: "create" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateReminderDialog({ trigger, initialData, mode = "create", open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateReminderDialogProps) {
  const { addReminder, updateReminder } = useReminders();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [type, setType] = useState<ReminderType>(initialData?.type || "outro");
  const [date, setDate] = useState(initialData?.date || "");
  const [time, setTime] = useState(initialData?.time || "");

  useEffect(() => {
    if (open && initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setType(initialData.type);
        setDate(initialData.date);
        setTime(initialData.time);
    } else if (open && !initialData) {
        setTitle("");
        setDescription("");
        setType("outro");
        setDate("");
        setTime("");
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Preencha o título e a data.");
      return;
    }

    if (mode === "edit" && initialData) {
        updateReminder(initialData.id, { title: title.trim(), description: description.trim(), type, date, time });
        toast.success("Lembrete atualizado!");
    } else {
        addReminder({ title: title.trim(), description: description.trim(), type, date, time });
        toast.success("Lembrete criado com sucesso!");
    }
    
    if (setOpen) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Lembrete
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar Lembrete" : "Criar Lembrete"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">Título *</Label>
            <Input
              id="reminder-title"
              placeholder="Ex: Entregar atestado de capacidade técnica"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-desc">Descrição</Label>
            <Textarea
              id="reminder-desc"
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reminder-date">Data *</Label>
              <Input
                id="reminder-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Hora</Label>
              <Input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Lembrete</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
