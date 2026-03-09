import { useState } from "react";
import {
  Plus, Pin, PinOff, Archive, Trash2, Calendar, Link2, GripVertical,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Task {
  id: string;
  title: string;
  priority: "urgente" | "alta" | "media" | "baixa";
  completed: boolean;
  pinned: boolean;
  archived: boolean;
  reminderDate?: string;
  linkedBidding?: string;
  createdAt: string;
}

const PRIORITY_CONFIG = {
  urgente: { label: "Urgente", class: "bg-destructive/10 text-destructive border-destructive/20" },
  alta: { label: "Alta", class: "bg-warning/10 text-warning border-warning/20" },
  media: { label: "Média", class: "bg-info/10 text-info border-info/20" },
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground border-border" },
};

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function TasksSection({ tasks, setTasks }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("media");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const sorted = [...tasks].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 };
    return pOrder[a.priority] - pOrder[b.priority];
  });

  const addTask = () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      priority: newPriority,
      completed: false,
      pinned: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle("");
    toast.success("Tarefa adicionada");
  };

  const update = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const remove = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast("Tarefa removida");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        Tarefas
        <Badge variant="secondary" className="text-xs">{tasks.filter((t) => !t.completed).length}</Badge>
      </h2>

      {/* Quick add */}
      <div className="flex gap-2">
        <Input
          placeholder="Adicionar tarefa rápida..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="flex-1"
        />
        <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Task["priority"])}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addTask} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {sorted.map((task) => {
          const expanded = expandedTask === task.id;
          const pc = PRIORITY_CONFIG[task.priority];
          return (
            <Card
              key={task.id}
              className={`p-3 transition-all ${task.completed ? "opacity-60" : ""} ${task.pinned ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => {
                    update(task.id, { completed: !!checked });
                    if (checked) toast.success("Tarefa concluída! 🎉");
                  }}
                />
                <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </span>
                <Badge variant="outline" className={`text-[10px] border ${pc.class}`}>
                  {pc.label}
                </Badge>
                {task.reminderDate && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.reminderDate), "dd/MM", { locale: ptBR })}
                  </span>
                )}
                {task.linkedBidding && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {task.linkedBidding}
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedTask(expanded ? null : task.id)}>
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                  <Button
                    variant="outline" size="sm" className="gap-1.5 text-xs"
                    onClick={() => update(task.id, { pinned: !task.pinned })}
                  >
                    {task.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    {task.pinned ? "Desafixar" : "Fixar"}
                  </Button>
                  <Button
                    variant="outline" size="sm" className="gap-1.5 text-xs"
                    onClick={() => { update(task.id, { archived: true }); toast("Tarefa arquivada"); }}
                  >
                    <Archive className="h-3 w-3" /> Arquivar
                  </Button>

                  {/* Reminder date */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Calendar className="h-3 w-3" /> Lembrete
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={task.reminderDate ? new Date(task.reminderDate) : undefined}
                        onSelect={(d) => {
                          update(task.id, { reminderDate: d?.toISOString() });
                          toast.success("Lembrete definido");
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Link to bidding */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Link2 className="h-3 w-3" /> Vincular
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60" align="start">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground">Vincular a licitação</p>
                        <Input
                          placeholder="Ex: PE 045/2026"
                          defaultValue={task.linkedBidding || ""}
                          onBlur={(e) => update(task.id, { linkedBidding: e.target.value || undefined })}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => remove(task.id)}>
                    <Trash2 className="h-3 w-3" /> Excluir
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa encontrada.</p>
        )}
      </div>
    </div>
  );
}
