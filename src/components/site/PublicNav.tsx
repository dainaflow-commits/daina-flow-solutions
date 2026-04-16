import { Link } from "@tanstack/react-router";
import logo from "@/assets/dainaflow-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PublicNav() {
  const { session, isAdmin, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Daina Flow" className="h-9 object-contain" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          <a href="#sobre" className="text-muted-foreground transition-smooth hover:text-foreground">Sobre</a>
          <a href="#servicos" className="text-muted-foreground transition-smooth hover:text-foreground">Serviços</a>
          <a href="#diferencial" className="text-muted-foreground transition-smooth hover:text-foreground">Diferencial</a>
          <a href="#contato" className="text-muted-foreground transition-smooth hover:text-foreground">Contato</a>
        </nav>
        <div className="flex items-center gap-2">
          {!loading && session && isAdmin && (
            <Link
              to="/dashboard"
              className="hidden md:inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-90"
            >
              <LayoutDashboard className="h-4 w-4" /> Painel
            </Link>
          )}
          {!loading && session ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold transition-smooth hover:border-primary/40"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold transition-smooth hover:border-primary/40"
            >
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
