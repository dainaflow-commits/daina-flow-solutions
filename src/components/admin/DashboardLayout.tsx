import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Briefcase, MessageSquareQuote, Inbox, BarChart3,
  Settings, LogOut, Sparkles, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/dashboard/servicos", label: "Serviços", icon: Briefcase },
  { to: "/dashboard/depoimentos", label: "Depoimentos", icon: MessageSquareQuote },
  { to: "/dashboard/leads", label: "Leads", icon: Inbox },
  { to: "/dashboard/resultados", label: "Resultados", icon: BarChart3 },
  { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { session, loading, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/login" });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ({user?.email}) ainda não tem permissão para acessar esta área.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-sm font-semibold"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta");
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen w-full bg-secondary/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Link to="/dashboard" className="flex h-16 items-center gap-2 border-b border-border px-5 font-display font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          Daina <span className="text-gradient-brand">Flow</span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to ||
              (to !== "/dashboard" && location.pathname.startsWith(to));
            return (
              <Link
                key={to} to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
                  active
                    ? "bg-gradient-brand text-primary-foreground shadow-elegant"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-3 px-2 text-xs">
            <p className="truncate font-medium">{user?.email}</p>
            <p className="text-muted-foreground">Sessão ativa</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="md:hidden mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3">
          <span className="font-display font-bold">Daina Flow</span>
          <button onClick={handleLogout} className="text-sm text-muted-foreground"><LogOut className="h-4 w-4" /></button>
        </div>
        <div className="md:hidden mb-4 grid grid-cols-3 gap-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} className={`flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
                {label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
