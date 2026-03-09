import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Clock, FileText, AlertTriangle, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReminders, type ReminderType } from "@/contexts/RemindersContext";
import { CreateReminderDialog } from "@/components/CreateReminderDialog";
import { Plus } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { pt } from "date-fns/locale";
import { FloatingChat } from "@/components/FloatingChat";

function getReminderIcon(type: ReminderType) {
  switch (type) {
    case "recurso": return AlertTriangle;
    case "documento": return Send;
    case "certidao": return Clock;
    case "pregao": return FileText;
    default: return Bell;
  }
}

function formatTimeAgo(iso: string) {
  const diff = differenceInDays(new Date(), parseISO(iso));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return `Há ${diff} dias`;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { reminders, markAsRead, markAllAsRead, unreadCount } = useReminders();

  // Sort by date ascending (soonest first)
  const sorted = [...reminders].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                MZ Licitações
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreateReminderDialog
                trigger={
                  <Button variant="ghost" size="icon" title="Novo lembrete">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">
                      Notificações
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {sorted.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
                    )}
                    {sorted.map((n) => {
                      const Icon = getReminderIcon(n.type);
                      const daysLeft = differenceInDays(parseISO(n.date), new Date());
                      return (
                        <button
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                        >
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {n.description}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {format(parseISO(n.date), "dd MMM yyyy", { locale: pt })}
                              {n.time && ` • ${n.time}`}
                              {daysLeft >= 0 && ` — ${daysLeft === 0 ? "Hoje" : `em ${daysLeft}d`}`}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
          <FloatingChat />
        </div>
      </div>
    </SidebarProvider>
  );
}
