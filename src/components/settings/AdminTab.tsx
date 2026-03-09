import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js"; // Importar createClient
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/LoadingButton";
import {
  Shield,
  UserPlus,
  Activity,
  Mail,
  Lock,
  LogIn,
  Edit,
  Plus,
  Trash2,
  Clock,
  User,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface ActivityEntry {
  id: string;
  user_email: string;
  action: string;
  entity_type: string | null;
  description: string | null;
  created_at: string;
}

interface ProfileEntry {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role_label: string;
  created_at: string;
}

function actionIcon(action: string) {
  switch (action) {
    case "login": return LogIn;
    case "create": return Plus;
    case "edit": return Edit;
    case "delete": return Trash2;
    default: return Activity;
  }
}

function actionColor(action: string) {
  switch (action) {
    case "login": return "text-blue-500";
    case "create": return "text-green-500";
    case "edit": return "text-amber-500";
    case "delete": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

function actionLabel(action: string) {
  switch (action) {
    case "login": return "Login";
    case "create": return "Criou";
    case "edit": return "Editou";
    case "delete": return "Excluiu";
    default: return action;
  }
}

export function AdminTab() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [users, setUsers] = useState<ProfileEntry[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoadingActivities(true);
    const [actRes, usersRes] = await Promise.all([
      supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

    if (actRes.data) setActivities(actRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    setLoadingActivities(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: "Preencha e-mail e senha", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setCreating(true);

    try {
        // Create temporary client without session persistence to avoid logging out the admin
        const tempClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        const { data, error } = await tempClient.auth.signUp({
            email: newEmail,
            password: newPassword,
            options: {
                data: {
                    name: newName,
                    role: "membro"
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            // Manually ensure profile exists if triggers fail or don't exist
            await supabase.from('profiles').upsert({
                user_id: data.user.id,
                email: newEmail,
                name: newName,
                role_label: "Membro"
            }, { onConflict: 'user_id' });
        }

        toast({ title: "Usuário criado com sucesso", description: `${newEmail} pode acessar o sistema (verifique email).` });
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        fetchData();
    } catch (error: any) {
        console.error(error);
        toast({
            title: "Erro ao criar usuário",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Criar Novo Usuário
          </CardTitle>
          <CardDescription>Crie contas de acesso para membros da equipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome do usuário"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  className="pl-9"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Mín. 6 caracteres"
                  className="pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
          <LoadingButton loading={creating} onClick={handleCreateUser} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Criar Usuário
          </LoadingButton>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Usuários Cadastrados
          </CardTitle>
          <CardDescription>Todos os usuários que possuem acesso ao sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {u.role_label}
                </Badge>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado.</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Log de Atividades
          </CardTitle>
          <CardDescription>Histórico de ações dos usuários: logins, criações, edições e exclusões.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActivities ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activities.map((a) => {
                const Icon = actionIcon(a.action);
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${actionColor(a.action)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {actionLabel(a.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{a.user_email}</span>
                      </div>
                      {a.description && (
                        <p className="text-sm text-foreground mt-1">{a.description}</p>
                      )}
                      {a.entity_type && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Entidade: {a.entity_type}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(a.created_at), "dd/MM/yy HH:mm", { locale: pt })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
