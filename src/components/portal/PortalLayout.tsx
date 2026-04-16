import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FolderKanban, MessageSquare, User, LogOut, Loader2 } from "lucide-react";
import logo from "@/assets/dainaflow-logo-login.png";
import { toast } from "sonner";

const NAV = [
  { to: "/portal", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/portal/projetos", label: "Meus projetos", icon: FolderKanban },
  { to: "/portal/chat", label: "Chat com a Larissa", icon: MessageSquare },
  { to: "/portal/perfil", label: "Meu perfil", icon: User },
];

export function PortalLayout({ children }: { children?: ReactNode }) {
  const { session, loading, isAdmin, fullName, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/login" });
    else if (isAdmin) navigate({ to: "/dashboard" });
  }, [session, loading, isAdmin, navigate]);

  if (loading || !session || isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <Link to="/portal" className="flex h-16 items-center gap-2 border-b border-border px-5">
          <img src={logo} alt="Daina Flow" className="h-9 w-auto" />
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
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
            <p className="truncate font-semibold">{fullName ?? "Cliente"}</p>
            <p className="truncate text-muted-foreground">{user?.email}</p>
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
          <img src={logo} alt="Daina Flow" className="h-7 w-auto" />
          <button onClick={handleLogout} className="text-sm text-muted-foreground"><LogOut className="h-4 w-4" /></button>
        </div>
        <div className="md:hidden mb-4 grid grid-cols-4 gap-2">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
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
