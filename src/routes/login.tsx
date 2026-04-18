import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/dainaflow-logo-login.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Acessar — Daina Flow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !session) return;
    navigate({ to: isAdmin ? "/dashboard" : "/portal" });
  }, [session, isAdmin, authLoading, navigate]);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/login",
      });
      if (result.error) {
        toast.error("Não foi possível entrar com o Google.");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      // Sessão criada — redirect via useEffect
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao autenticar com Google");
      setGoogleLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !acceptedTerms) {
      toast.error("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: { full_name: name, terms_accepted_at: new Date().toISOString() },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode acessar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo(a) de volta!");
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
        <Link to="/" className="relative z-10 inline-block">
          <img src={logo} alt="Daina Flow" className="h-14 w-auto" />
        </Link>
        <div className="relative z-10 space-y-4">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Bem-vindo(a) à <br /> Daina Flow.
          </h2>
          <p className="max-w-sm text-base opacity-90">
            Acesse seu portal para acompanhar projetos, conversar comigo e ver o andamento de tudo em tempo real.
          </p>
        </div>
        <p className="relative z-10 text-xs opacity-70">© 2026 Daina Flow</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center">
            <img src={logo} alt="Daina Flow" className="h-12 w-auto" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {mode === "signin" ? "Acessar conta" : "Criar conta"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? "Entre com suas credenciais." : "Preencha para criar seu acesso."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold transition-smooth hover:bg-secondary disabled:opacity-60"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
            )}
            Continuar com Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou com e-mail</span></div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <Input label="Nome completo" value={name} onChange={setName} />
            )}
            <Input label="E-mail" type="email" value={email} onChange={setEmail} />
            <Input label="Senha" type="password" value={password} onChange={setPassword} />
            {mode === "signup" && (
              <label className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                />
                <span>
                  Li e aceito os{" "}
                  <Link to="/legal/$slug" params={{ slug: "termos" }} target="_blank" className="font-semibold text-primary hover:underline">Termos de Uso</Link>
                  {", a "}
                  <Link to="/legal/$slug" params={{ slug: "privacidade" }} target="_blank" className="font-semibold text-primary hover:underline">Política de Privacidade (LGPD)</Link>
                  {" e a "}
                  <Link to="/legal/$slug" params={{ slug: "transparencia" }} target="_blank" className="font-semibold text-primary hover:underline">Política de Transparência</Link>
                  .
                </span>
              </label>
            )}
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
