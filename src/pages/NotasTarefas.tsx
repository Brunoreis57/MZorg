import { useState, useMemo } from "react";
import { Search, Plus, Archive, StickyNote, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksSection, type Task } from "@/components/notes/TasksSection";
import { NotesSection, type Note } from "@/components/notes/NotesSection";
import { Badge } from "@/components/ui/badge";
import { useNotes, useTasks, useCreateNote, useUpdateNote, useDeleteNote, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useSupabaseData";

export default function NotasTarefas() {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const { data: dbTasks = [] } = useTasks();
  const { data: dbNotes = [] } = useNotes();
  const createTaskMut = useCreateTask();
  const updateTaskMut = useUpdateTask();
  const deleteTaskMut = useDeleteTask();
  const createNoteMut = useCreateNote();
  const updateNoteMut = useUpdateNote();
  const deleteNoteMut = useDeleteNote();

  // Map DB to component format
  const tasks: Task[] = dbTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority as Task["priority"],
    completed: t.completed,
    pinned: t.pinned,
    archived: t.archived,
    reminderDate: t.reminder_date || undefined,
    linkedBidding: t.linked_bidding || undefined,
    createdAt: t.created_at,
  }));

  const notes: Note[] = dbNotes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    color: n.color as Note["color"],
    pinned: n.pinned,
    archived: n.archived,
    createdAt: n.created_at,
  }));

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks
      .filter((t) => (showArchived ? t.archived : !t.archived))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.linkedBidding?.toLowerCase().includes(q));
  }, [tasks, search, showArchived]);

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase();
    return notes
      .filter((n) => (showArchived ? n.archived : !n.archived))
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [notes, search, showArchived]);

  const pendingCount = tasks.filter((t) => !t.completed && !t.archived).length;
  const archivedCount = tasks.filter((t) => t.archived).length + notes.filter((n) => n.archived).length;

  // Wrapper setTasks that syncs to Supabase
  const setTasks: React.Dispatch<React.SetStateAction<Task[]>> = (updater) => {
    const currentTasks = tasks;
    const newTasks = typeof updater === "function" ? updater(currentTasks) : updater;

    // Find what changed
    for (const nt of newTasks) {
      const existing = currentTasks.find((t) => t.id === nt.id);
      if (!existing) {
        // New task
        createTaskMut.mutate({ title: nt.title, priority: nt.priority, linked_bidding: nt.linkedBidding, reminder_date: nt.reminderDate });
      } else if (JSON.stringify(existing) !== JSON.stringify(nt)) {
        // Updated
        updateTaskMut.mutate({
          id: nt.id,
          title: nt.title,
          priority: nt.priority,
          completed: nt.completed,
          pinned: nt.pinned,
          archived: nt.archived,
          linked_bidding: nt.linkedBidding || null,
          reminder_date: nt.reminderDate || null,
        });
      }
    }
    // Find deleted
    for (const old of currentTasks) {
      if (!newTasks.find((t) => t.id === old.id)) {
        deleteTaskMut.mutate(old.id);
      }
    }
  };

  const setNotes: React.Dispatch<React.SetStateAction<Note[]>> = (updater) => {
    const currentNotes = notes;
    const newNotes = typeof updater === "function" ? updater(currentNotes) : updater;

    for (const nn of newNotes) {
      const existing = currentNotes.find((n) => n.id === nn.id);
      if (!existing) {
        createNoteMut.mutate({ title: nn.title, content: nn.content, color: nn.color, pinned: nn.pinned });
      } else if (JSON.stringify(existing) !== JSON.stringify(nn)) {
        updateNoteMut.mutate({
          id: nn.id,
          title: nn.title,
          content: nn.content,
          color: nn.color,
          pinned: nn.pinned,
          archived: nn.archived,
        });
      }
    }
    for (const old of currentNotes) {
      if (!newNotes.find((n) => n.id === old.id)) {
        deleteNoteMut.mutate(old.id);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notas & Tarefas</h1>
          <p className="text-sm text-muted-foreground">Organize suas pendências e anotações rápidas</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1"><CheckSquare className="h-3 w-3" /> {pendingCount} pendentes</Badge>
          <Button variant={showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived(!showArchived)} className="gap-1.5">
            <Archive className="h-4 w-4" />Arquivo ({archivedCount})
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar notas e tarefas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tudo</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5"><CheckSquare className="h-3.5 w-3.5" /> Tarefas</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5"><StickyNote className="h-3.5 w-3.5" /> Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          <TasksSection tasks={filteredTasks} setTasks={setTasks} />
          <NotesSection notes={filteredNotes} setNotes={setNotes} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksSection tasks={filteredTasks} setTasks={setTasks} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesSection notes={filteredNotes} setNotes={setNotes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
