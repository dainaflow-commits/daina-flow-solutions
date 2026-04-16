import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#diferencial", label: "Diferencial" },
  { href: "#contato", label: "Contato" },
];

export function PublicNav() {
  const { session, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" onClick={() => setOpen(false)}>
          <BrandLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-muted-foreground transition-smooth hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!loading && session && isAdmin && (
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-90"
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
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-90"
            >
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>

        <button
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card md:hidden"
        >
          <motion.span
            animate={{ rotate: open ? 90 : 0, scale: open ? 0.9 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="grid place-items-center"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container mx-auto flex flex-col gap-1 px-4 py-4 text-sm font-medium">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl px-3 py-3 text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </motion.a>
              ))}

              <div className="mt-2 grid gap-2 border-t border-border/60 pt-3">
                {!loading && session && isAdmin && (
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Painel
                  </Link>
                )}
                {!loading && session ? (
                  <button
                    onClick={() => { supabase.auth.signOut(); setOpen(false); }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant"
                  >
                    <LogIn className="h-4 w-4" /> Entrar
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
