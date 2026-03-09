import { useState } from "react";
import {
  Plus, Pin, PinOff, Archive, Trash2, Palette, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { NoteEditor } from "./NoteEditor";

export interface Note {
  id: string;
  title: string;
  content: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple" | "neutral";
  pinned: boolean;
  archived: boolean;
  createdAt: string;
}

const COLOR_MAP: Record<Note["color"], { bg: string; border: string; dot: string }> = {
  yellow:  { bg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-200 dark:border-amber-800",   dot: "bg-amber-400" },
  blue:    { bg: "bg-sky-50 dark:bg-sky-950/30",       border: "border-sky-200 dark:border-sky-800",       dot: "bg-sky-400" },
  green:   { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-400" },
  pink:    { bg: "bg-pink-50 dark:bg-pink-950/30",     border: "border-pink-200 dark:border-pink-800",     dot: "bg-pink-400" },
  purple:  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-400" },
  neutral: { bg: "bg-card",                            border: "border-border",                            dot: "bg-muted-foreground" },
};

interface Props {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

export function NotesSection({ notes, setNotes }: Props) {
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const openNew = () => {
    setEditNote({
      id: crypto.randomUUID(),
      title: "",
      content: "",
      color: "yellow",
      pinned: false,
      archived: false,
      createdAt: new Date().toISOString(),
    });
    setDialogOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditNote({ ...note });
    setDialogOpen(true);
  };

  const saveNote = () => {
    if (!editNote || !editNote.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setNotes((prev) => {
      const exists = prev.find((n) => n.id === editNote.id);
      if (exists) return prev.map((n) => (n.id === editNote.id ? editNote : n));
      return [editNote, ...prev];
    });
    setDialogOpen(false);
    toast.success("Nota salva");
  };

  const update = (id: string, patch: Partial<Note>) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const remove = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast("Nota removida");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Notas Rápidas</h2>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Nota
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((note) => {
          const c = COLOR_MAP[note.color];
          return (
            <Card
              key={note.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${c.bg} ${c.border} ${note.pinned ? "ring-2 ring-primary/20" : ""}`}
              onClick={() => openEdit(note)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">
                  {note.title}
                </h3>
                {note.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
              </div>
              <div
                className="text-xs text-muted-foreground line-clamp-4 prose-sm"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
                <div className={`h-2 w-2 rounded-full ${c.dot}`} />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Card>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 col-span-full">
            Nenhuma nota encontrada.
          </p>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editNote && notes.find((n) => n.id === editNote.id) ? "Editar Nota" : "Nova Nota"}</DialogTitle>
          </DialogHeader>
          {editNote && (
            <div className="space-y-4">
              <Input
                placeholder="Título da nota"
                value={editNote.title}
                onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
              />

              {/* Color picker */}
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mr-1">Cor:</span>
                {(Object.keys(COLOR_MAP) as Note["color"][]).map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditNote({ ...editNote, color })}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${COLOR_MAP[color].dot} ${editNote.color === color ? "border-foreground scale-110" : "border-transparent"}`}
                  />
                ))}
              </div>

              {/* Rich text editor */}
              <NoteEditor
                content={editNote.content}
                onChange={(content) => setEditNote({ ...editNote, content })}
              />

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs"
                  onClick={() => setEditNote({ ...editNote, pinned: !editNote.pinned })}
                >
                  {editNote.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  {editNote.pinned ? "Desafixar" : "Fixar no Topo"}
                </Button>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs"
                  onClick={() => {
                    update(editNote.id, { archived: true });
                    setDialogOpen(false);
                    toast("Nota arquivada");
                  }}
                >
                  <Archive className="h-3 w-3" /> Arquivar
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => { remove(editNote.id); setDialogOpen(false); }}
                >
                  <Trash2 className="h-3 w-3" /> Excluir
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveNote}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
