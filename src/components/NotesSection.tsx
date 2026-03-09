import { useState } from "react";
import { Plus, Trash2, Calendar, CheckSquare, StickyNote, Clock, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useNotes, useCreateNote, useDeleteNote, useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useSupabaseData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingButton } from "@/components/LoadingButton";

interface NotesSectionProps {
  biddingId: string;
}

export function NotesSection({ biddingId }: NotesSectionProps) {
  const { data: notes = [] } = useNotes(biddingId);
  const { data: tasks = [] } = useTasks(biddingId);
  
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [noteText, setNoteText] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", date: "", time: "09:00", priority: "media" });

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    createNote.mutate({
      content: noteText,
      bidding_id: biddingId,
      title: "Nota Rápida"
    }, {
      onSuccess: () => setNoteText("")
    });
  };

  const handleSaveTask = () => {
    if (!newTask.title) return;

    const taskData = {
      title: newTask.title,
      due_date: newTask.date ? `${newTask.date}T${newTask.time}:00` : null,
      priority: newTask.priority,
      bidding_id: biddingId,
    };

    if (editingTask) {
      updateTask.mutate({ id: editingTask, ...taskData }, {
        onSuccess: () => {
          setTaskDialogOpen(false);
          setEditingTask(null);
          setNewTask({ title: "", date: "", time: "09:00", priority: "media" });
        }
      });
    } else {
      createTask.mutate({
        ...taskData,
        completed: false
      }, {
        onSuccess: () => {
          setTaskDialogOpen(false);
          setNewTask({ title: "", date: "", time: "09:00", priority: "media" });
        }
      });
    }
  };

  const openEditTask = (task: any) => {
    setEditingTask(task.id);
    const date = task.due_date ? new Date(task.due_date) : null;
    setNewTask({
        title: task.title,
        date: date ? format(date, "yyyy-MM-dd") : "",
        time: date ? format(date, "HH:mm") : "09:00",
        priority: task.priority || "media"
    });
    setTaskDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" />
          Anotações & Lembretes
        </h3>
      </div>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-4">
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
            Notas ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
            Tarefas ({tasks.filter((t: any) => !t.completed).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex gap-2">
            <Textarea 
              placeholder="Escreva uma anotação sobre esta licitação..." 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[80px]"
            />
            <Button className="h-auto self-end" onClick={handleAddNote} disabled={!noteText.trim() || createNote.isPending}>
              Adicionar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note: any) => (
              <Card key={note.id} className="bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground hover:text-destructive" onClick={() => deleteNote.mutate(note.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">
                    {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            ))}
            {notes.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-4">Nenhuma nota adicionada.</p>}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
             <Button size="sm" onClick={() => { setEditingTask(null); setNewTask({ title: "", date: "", time: "09:00", priority: "media" }); setTaskDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Novo Lembrete
             </Button>
          </div>

          <div className="space-y-2">
            {tasks.map((task: any) => (
              <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.completed ? "bg-muted opacity-60" : "bg-card hover:shadow-sm"}`}>
                <Checkbox 
                  checked={task.completed} 
                  onCheckedChange={(checked) => updateTask.mutate({ id: task.id, completed: !!checked })}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {format(new Date(task.due_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditTask(task)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente.</p>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Lembrete" : "Novo Lembrete"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} placeholder="Ex: Enviar documentação..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newTask.date} onChange={(e) => setNewTask({...newTask, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={newTask.time} onChange={(e) => setNewTask({...newTask, time: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
            <LoadingButton onClick={handleSaveTask} loading={createTask.isPending || updateTask.isPending}>Salvar</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
