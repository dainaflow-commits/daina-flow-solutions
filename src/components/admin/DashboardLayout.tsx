import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Briefcase, MessageSquareQuote, Inbox, BarChart3,
  Settings, LogOut, Loader2, Users, FolderKanban, FileText, DollarSign,
  Image as ImageIcon, History, Calendar, Menu, FileSignature, Bell, Scale, Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { NotificationBell } from "@/components/NotificationBell";

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Visão geral",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Comercial",
    items: [
      { to: "/dashboard/leads", label: "Leads", icon: Inbox },
      { to: "/dashboard/propostas", label: "Propostas", icon: FileText },
      { to: "/dashboard/contratos", label: "Contratos", icon: FileSignature },
    ],
  },
  {
    label: "Entregas",
    items: [
      { to: "/dashboard/projetos", label: "Projetos", icon: FolderKanban },
      { to: "/dashboard/clientes", label: "Clientes", icon: Users },
      { to: "/dashboard/calendario", label: "Calendário", icon: Calendar },
    ],
  },
  {
    label: "Financeiro",
    items: [{ to: "/dashboard/fluxo-caixa", label: "Fluxo de Caixa", icon: DollarSign }],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/dashboard/servicos", label: "Serviços", icon: Briefcase },
      { to: "/dashboard/portfolio", label: "Portfólio", icon: ImageIcon },
      { to: "/dashboard/depoimentos", label: "Depoimentos", icon: MessageSquareQuote },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { to: "/dashboard/tickets", label: "Tickets", icon: Ticket },
      { to: "/dashboard/notificacoes", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/dashboard/auditoria", label: "Auditoria", icon: History },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/dashboard/legal", label: "Documentos legais", icon: Scale },
      { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const { session, loading, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/portal" });
  }, [session, loading, isAdmin, navigate]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

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

  const SidebarContent = (
    <>
      <Link to="/dashboard" className="flex h-16 items-center border-b border-border px-5">
        <BrandLogo size="md" />
      </Link>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, exact }) => {
                const active = exact ? location.pathname === to : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to} to={to} preload="intent"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-smooth ${
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
            </div>
          </div>
        ))}
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
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-secondary/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" />
          <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card md:hidden animate-in slide-in-from-left">
            {SidebarContent}
          </aside>
        </>
      )}

      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3 md:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="grid h-9 w-9 place-items-center rounded-lg border border-border">
            <Menu className="h-4 w-4" />
          </button>
          <BrandLogo size="sm" />
          <NotificationBell />
        </div>
        <div className="mb-4 hidden items-center justify-end gap-2 md:flex">
          <NotificationBell />
        </div>
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
