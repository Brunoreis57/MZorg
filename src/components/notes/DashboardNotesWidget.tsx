import { StickyNote, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useNotes } from "@/hooks/useSupabaseData";
import { format } from "date-fns";

export function DashboardNotesWidget() {
  const navigate = useNavigate();
  const { data: notes = [] } = useNotes();

  const recentNotes = notes.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          Notas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentNotes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma nota recente</p>
        )}
        {recentNotes.map((note) => (
          <div key={note.id} className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => note.bidding_id && navigate(`/ganhas/${note.bidding_id}`)}>
            <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{note.content}</p>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                <span>{format(new Date(note.created_at), "dd/MM/yyyy HH:mm")}</span>
                {note.bidding_id && <span className="text-primary font-medium">Ver Licitação</span>}
            </div>
          </div>
        ))}
        <Button
          variant="ghost" size="sm" className="w-full mt-2 gap-1.5 text-xs text-muted-foreground"
          onClick={() => navigate("/notas-tarefas")}
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
