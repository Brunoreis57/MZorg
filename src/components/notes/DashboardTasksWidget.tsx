import { CheckSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useSupabaseData";

const PRIORITY_CONFIG = {
  urgente: { label: "Urgente", class: "bg-destructive/10 text-destructive border-destructive/20", order: 0 },
  alta: { label: "Alta", class: "bg-warning/10 text-warning border-warning/20", order: 1 },
  media: { label: "Média", class: "bg-info/10 text-info border-info/20", order: 2 },
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground border-border", order: 3 },
};

export function DashboardTasksWidget() {
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks();

  const topTasks = tasks
    .filter((t) => !t.completed && !t.archived)
    .sort((a, b) => {
      const pa = PRIORITY_CONFIG[a.priority as keyof typeof PRIORITY_CONFIG]?.order ?? 9;
      const pb = PRIORITY_CONFIG[b.priority as keyof typeof PRIORITY_CONFIG]?.order ?? 9;
      return pa - pb;
    })
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          Tarefas do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>
        )}
        {topTasks.map((task) => {
          const pc = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.media;
          return (
            <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border/50">
              <div className={`h-2 w-2 rounded-full shrink-0 ${pc.class.split(" ")[0].replace("/10", "")}`} />
              <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
              <Badge variant="outline" className={`text-[10px] border ${pc.class}`}>
                {pc.label}
              </Badge>
            </div>
          );
        })}
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
