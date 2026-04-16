import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center gap-2 font-display font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          Daina <span className="text-gradient-brand">Flow</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Daina Flow — Larissa Daina dos Santos Quirino
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Transformando dados em decisões inteligentes · Igarapé-MG e região
        </p>
      </div>
    </footer>
  );
}
