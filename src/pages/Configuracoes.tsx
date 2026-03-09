import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/LoadingButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminTab } from "@/components/settings/AdminTab";
import { useBiddings, useEmpresas } from "@/hooks/useSupabaseData";
import {
  User,
  Palette,
  Building2,
  Save,
  Camera,
  Lock,
  Mail,
  Bell,
  FileText,
  Users,
  Shield,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
} from "lucide-react";

// ── Types ──
interface NotificationPrefs {
  emailCertidao: boolean;
  emailOrgao: boolean;
  emailFornecedor: boolean;
  pushCertidao: boolean;
  pushOrgao: boolean;
  pushFornecedor: boolean;
}

type ThemeOption = "light" | "dark" | "system";

function getStoredConfig<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export default function Configuracoes() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { data: biddings = [] } = useBiddings();
  const { data: empresas = [] } = useEmpresas();

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Theme
  const [theme, setTheme] = useState<ThemeOption>(() =>
    (localStorage.getItem("theme") as ThemeOption) || "light"
  );

  // Notifications
  const [notifs, setNotifs] = useState<NotificationPrefs>(() =>
    getStoredConfig("config_notifs", {
      emailCertidao: true,
      emailOrgao: true,
      emailFornecedor: false,
      pushCertidao: true,
      pushOrgao: false,
      pushFornecedor: false,
    })
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load profile from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, email, role_label")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.name || "");
          setProfileEmail(data.email || user.email || "");
          setProfileRole(data.role_label || "Membro");
        } else {
          setProfileEmail(user.email || "");
        }
      });
  }, [user]);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save profile
  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    // Update profile in DB
    await supabase
      .from("profiles")
      .update({ name: profileName, email: profileEmail, role_label: profileRole })
      .eq("user_id", user.id);

    // Update password if provided
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast({ title: "As senhas não coincidem", variant: "destructive" });
        setSavingProfile(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
        setSavingProfile(false);
        return;
      }
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSavingProfile(false);
    toast({ title: "Perfil atualizado", description: "Suas informações foram salvas com sucesso." });
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    await new Promise((r) => setTimeout(r, 400));
    localStorage.setItem("config_notifs", JSON.stringify(notifs));
    setSavingPrefs(false);
    toast({ title: "Preferências salvas", description: "Suas preferências de notificação foram atualizadas." });
  };

  const tabCount = isAdmin ? 4 : 3;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie preferências de conta, segurança e aparência.
        </p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className={`grid w-full lg:w-auto lg:inline-grid`} style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4 hidden sm:inline" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:inline" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="organizacao" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:inline" />
            Organização
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="gap-2">
              <ShieldCheck className="h-4 w-4 hidden sm:inline" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══ PERFIL ═══ */}
        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize seus dados de perfil e informações de contato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                  {profileName ? profileName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??"}
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Alterar Foto
                </Button>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Nome Completo</Label>
                  <Input id="profileName" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="profileEmail" type="email" className="pl-9" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileRole">Cargo / Função</Label>
                  <Input id="profileRole" value={profileRole} onChange={(e) => setProfileRole(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Segurança
              </CardTitle>
              <CardDescription>Altere sua senha de acesso ao sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <LoadingButton loading={savingProfile} onClick={saveProfile} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Perfil
            </LoadingButton>
          </div>
        </TabsContent>

        {/* ═══ PREFERÊNCIAS ═══ */}
        <TabsContent value="preferencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-primary" />
                Aparência
              </CardTitle>
              <CardDescription>Escolha o tema visual do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[
                  { value: "light" as ThemeOption, label: "Claro", icon: Sun },
                  { value: "dark" as ThemeOption, label: "Escuro", icon: Moon },
                  { value: "system" as ThemeOption, label: "Sistema", icon: Monitor },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      theme === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    <opt.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notificações
              </CardTitle>
              <CardDescription>Configure quais alertas você deseja receber por e-mail ou push.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Vencimento de Certidões", emailKey: "emailCertidao" as const, pushKey: "pushCertidao" as const, icon: FileText },
                { label: "Novas solicitações do Órgão", emailKey: "emailOrgao" as const, pushKey: "pushOrgao" as const, icon: Building2 },
                { label: "Solicitações de Antecipação (Fornecedores)", emailKey: "emailFornecedor" as const, pushKey: "pushFornecedor" as const, icon: Users },
              ].map((item) => (
                <div key={item.emailKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={notifs[item.emailKey]} onCheckedChange={(v) => setNotifs((p) => ({ ...p, [item.emailKey]: v }))} />
                      <Label className="text-xs text-muted-foreground">E-mail</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={notifs[item.pushKey]} onCheckedChange={(v) => setNotifs((p) => ({ ...p, [item.pushKey]: v }))} />
                      <Label className="text-xs text-muted-foreground">Push</Label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <LoadingButton loading={savingPrefs} onClick={savePreferences} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Preferências
            </LoadingButton>
          </div>
        </TabsContent>

        {/* ═══ ORGANIZAÇÃO ═══ */}
        <TabsContent value="organizacao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Membros da Equipe
              </CardTitle>
              <CardDescription>Gerencie os usuários vinculados à sua organização.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para gerenciar usuários, acesse a aba <strong>Admin</strong> (disponível para administradores).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Limites do Plano
              </CardTitle>
              <CardDescription>Visualize o uso atual dos recursos da sua organização.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Empresas Cadastradas", used: empresas.length, max: 50 },
                { label: "Licitações Ativas", used: biddings.filter((b: any) => !["Ganha", "Perdida", "Cancelada"].includes(b.status)).length, max: 200 },
                { label: "Licitações Totais", used: biddings.length, max: 500 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.used} de {item.max}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((item.used / item.max) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ADMIN ═══ */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <AdminTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
