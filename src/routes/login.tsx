import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Acessar — Daina Flow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) navigate({ to: "/dashboard" });
  }, [session, authLoading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode acessar.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda de volta!");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-brand p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 -z-0 bg-mesh opacity-30" />
        <Link to="/" className="relative z-10 flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </span>
          Daina Flow
        </Link>
        <div className="relative z-10 space-y-4">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Bem-vinda à área <br /> de gestão.
          </h2>
          <p className="max-w-sm text-base opacity-90">
            Gerencie serviços, leads, depoimentos e acompanhe o desempenho do site Daina Flow.
          </p>
        </div>
        <p className="relative z-10 text-xs opacity-70">© 2026 Daina Flow</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-2 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            Daina Flow
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {mode === "signin" ? "Acessar conta" : "Criar conta"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? "Entre com suas credenciais." : "Preencha para criar seu acesso."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <Input label="Nome completo" value={name} onChange={setName} />
            )}
            <Input label="E-mail" type="email" value={email} onChange={setEmail} />
            <Input label="Senha" type="password" value={password} onChange={setPassword} />
            <button
              type="submit" disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Ainda não tem conta? " : "Já tem conta? "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </button>
          </p>

          <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-ring focus:ring-2"
        required
      />
    </div>
  );
}
