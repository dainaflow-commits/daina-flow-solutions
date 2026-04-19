import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

interface PendingDoc {
  slug: string;
  title: string;
  version: string;
  current_version: string | null;
}

const SLUGS = ["privacidade", "termos", "transparencia"] as const;
const SLUG_LABEL: Record<string, string> = {
  privacidade: "Política de Privacidade (LGPD)",
  termos: "Termos de Uso",
  transparencia: "Política de Transparência",
};

export function ReconsentGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [pending, setPending] = useState<PendingDoc[] | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading || !user) { setChecked(true); return; }
    (async () => {
      const [docsRes, consentRes] = await Promise.all([
        supabase.from("legal_documents").select("slug, title, version").in("slug", SLUGS as unknown as string[]),
        supabase.from("legal_consent_tracking").select("slug, version, accepted_at").eq("user_id", user.id),
      ]);
      const docs = docsRes.data ?? [];
      const consents = consentRes.data ?? [];
      // Latest accepted version per slug
      const latest = new Map<string, string>();
      consents.forEach((c: any) => {
        const prev = latest.get(c.slug);
        if (!prev || prev < c.version) latest.set(c.slug, c.version);
      });
      const needs = docs
        .map((d: any) => ({ ...d, current_version: latest.get(d.slug) ?? null }))
        .filter((d) => d.current_version !== d.version);
      setPending(needs);
      setChecked(true);
    })();
  }, [user, loading]);

  async function acceptAll() {
    if (!user || !pending) return;
    setAccepting(true);
    const rows = pending.map((d) => ({
      user_id: user.id,
      slug: d.slug,
      version: d.version,
      user_agent: navigator.userAgent,
    }));
    const { error } = await supabase.from("legal_consent_tracking").insert(rows);
    setAccepting(false);
    if (error) { toast.error("Erro ao registrar aceite: " + error.message); return; }
    toast.success("Termos aceitos. Obrigada!");
    setPending([]);
  }

  if (!checked) return <>{children}</>;
  if (!pending || pending.length === 0) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Atualização dos termos</h2>
            <p className="text-xs text-muted-foreground">Revise e aceite para continuar</p>
          </div>
        </div>

        <p className="mb-3 text-sm text-foreground/90">
          Atualizamos {pending.length === 1 ? "um documento" : `${pending.length} documentos`} legais.
          Para continuar usando o portal, leia e confirme o aceite das novas versões:
        </p>

        <ul className="mb-5 space-y-2">
          {pending.map((d) => (
            <li key={d.slug} className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{SLUG_LABEL[d.slug] ?? d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {d.current_version ? `v${d.current_version} → v${d.version}` : `nova versão v${d.version}`}
                </p>
              </div>
              <Link to="/legal/$slug" params={{ slug: d.slug }} target="_blank"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Ler <ExternalLink className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>

        <button onClick={acceptAll} disabled={accepting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
          {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
          Li e aceito as novas versões
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          O aceite fica registrado com data e hora conforme a LGPD.
        </p>
      </div>
    </div>
  );
}
