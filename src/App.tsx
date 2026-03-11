import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RemindersProvider } from "@/contexts/RemindersContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Licitacoes from "./pages/Licitacoes";
import LicitacaoDetalhe from "./pages/LicitacaoDetalhe";
import Ganhas from "./pages/Ganhas";
import GanhaDetalhe from "./pages/GanhaDetalhe";
import Empresas from "./pages/Empresas";
import Fornecedores from "./pages/Fornecedores";
import Financeiro from "./pages/Financeiro";
import NotasTarefas from "./pages/NotasTarefas";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Relatorios from "./pages/Relatorios";
import Servicos from "./pages/Servicos";
import Editais from "./pages/Editais";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const financeAllowed = ["bruno.g.reis@gmail.com", "mtzilmann@gmail.com", "vitorferrari_@hotmail.com"].includes(user?.email || "");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/licitacoes" element={<Licitacoes />} />
        <Route path="/licitacoes/:id" element={<LicitacaoDetalhe />} />
        <Route path="/ganhas" element={<Ganhas />} />
        <Route path="/ganhas/:id" element={<GanhaDetalhe />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/financeiro" element={financeAllowed ? <Financeiro /> : <Navigate to="/" replace />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/notas-tarefas" element={<NotasTarefas />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/editais" element={<Editais />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RemindersProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </RemindersProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
