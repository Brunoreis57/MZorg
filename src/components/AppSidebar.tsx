import {
  LayoutDashboard,
  FileText,
  Trophy,
  Settings,
  Gavel,
  Building2,
  Users,
  Truck,
  Plus,
  Banknote,
  ClipboardList,
  Moon,
  Sun,
  LogOut,
  BarChart2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const principalItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Licitações", url: "/licitacoes", icon: FileText },
  { title: "Ganhas", url: "/ganhas", icon: Trophy },
];

const ferramentasItems = [
  { title: "Relatórios", url: "/relatorios", icon: BarChart2 },
  { title: "Financeiro", url: "/financeiro", icon: Banknote },
  { title: "Notas & Tarefas", url: "/notas-tarefas", icon: ClipboardList },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Fornecedores", url: "/fornecedores", icon: Users },
  { title: "Serviços", url: "/servicos", icon: Truck },
  { title: "Editais +", url: "/editais", icon: Plus },
];

const sistemaItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDark(true);
    else if (saved === "light") setDark(false);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setDark(true);
  }, []);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "??";
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
  const financeAllowed = ["bruno.g.reis@gmail.com", "mtzilmann@gmail.com", "vitorferrari_@hotmail.com"].includes(user?.email || "");

  const renderGroup = (label: string, items: { title: string; url: string; icon: any }[]) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-muted">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
              >
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between p-4 pb-2">
          {!collapsed && <h1 className="text-xl font-bold text-primary">MZ Licitações</h1>}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} title={dark ? "Modo Claro" : "Modo Escuro"}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="px-4 pb-4 border-b border-sidebar-border/50">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{userName}</p>
                <p className="text-xs text-sidebar-muted truncate">Online</p>
              </div>
            </div>
          ) : (
             <div className="h-8 w-8 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {userInitials}
             </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Principal", principalItems)}
        {renderGroup("Ferramentas", ferramentasItems.filter((i) => i.url !== "/financeiro" || financeAllowed))}
        {renderGroup("Sistema", sistemaItems)}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
