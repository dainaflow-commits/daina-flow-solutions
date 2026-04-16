import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-elegant">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span>Daina <span className="text-gradient-brand">Flow</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          <a href="#sobre" className="text-muted-foreground transition-smooth hover:text-foreground">Sobre</a>
          <a href="#servicos" className="text-muted-foreground transition-smooth hover:text-foreground">Serviços</a>
          <a href="#diferencial" className="text-muted-foreground transition-smooth hover:text-foreground">Diferencial</a>
          <a href="#resultados" className="text-muted-foreground transition-smooth hover:text-foreground">Resultados</a>
          <a href="#contato" className="text-muted-foreground transition-smooth hover:text-foreground">Contato</a>
        </nav>
        <a
          href="#contato"
          className="hidden md:inline-flex h-10 items-center rounded-full bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-90"
        >
          Agendar conversa
        </a>
      </div>
    </header>
  );
}
