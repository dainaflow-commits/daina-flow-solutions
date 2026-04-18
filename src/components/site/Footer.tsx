import { BrandLogo } from "@/components/BrandLogo";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center">
          <BrandLogo size="md" />
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Daina Flow — Larissa Daina dos Santos Quirino
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Transformando dados em decisões inteligentes · Igarapé-MG e região
        </p>
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <Link to="/legal/$slug" params={{ slug: "privacidade" }} className="text-muted-foreground hover:text-foreground hover:underline">
            Política de Privacidade (LGPD)
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link to="/legal/$slug" params={{ slug: "termos" }} className="text-muted-foreground hover:text-foreground hover:underline">
            Termos de Uso
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link to="/legal/$slug" params={{ slug: "transparencia" }} className="text-muted-foreground hover:text-foreground hover:underline">
            Transparência
          </Link>
        </nav>
      </div>
    </footer>
  );
}
