import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/legal")({
  head: () => ({ meta: [{ title: "Documentos legais — Admin" }] }),
  component: () => <DashboardLayout><AdminLegal /></DashboardLayout>,
});

interface Doc { slug: string; title: string; content_markdown: string; updated_at: string }

const SLUG_LABEL: Record<string, string> = {
  privacidade: "Política de Privacidade (LGPD)",
  termos: "Termos de Uso",
  transparencia: "Política de Transparência",
};

function AdminLegal() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [active, setActive] = useState<string>("privacidade");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("legal_documents").select("*").order("slug");
    setDocs((data as Doc[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const current = docs.find((d) => d.slug === active);

  async function save() {
    if (!current) return;
    setSaving(true);
    const { error } = await supabase
      .from("legal_documents")
      .update({ title: current.title, content_markdown: current.content_markdown })
      .eq("slug", current.slug);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Documento salvo"); load(); }
  }

  function update(patch: Partial<Doc>) {
    setDocs((p) => p.map((d) => (d.slug === active ? { ...d, ...patch } : d)));
  }

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Documentos legais</h1>
          <p className="text-sm text-muted-foreground">Edite LGPD, Termos de Uso e Transparência. Aparecem no rodapé, no cadastro, em propostas e contratos.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {docs.map((d) => (
          <button key={d.slug} onClick={() => setActive(d.slug)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active === d.slug ? "bg-gradient-brand text-primary-foreground shadow-elegant" : "bg-secondary hover:bg-accent"}`}>
            {SLUG_LABEL[d.slug] ?? d.title}
          </button>
        ))}
      </div>

      {current && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              value={current.title}
              onChange={(e) => update({ title: e.target.value })}
              className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
            />
            <Link to="/legal/$slug" params={{ slug: current.slug }} target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold hover:bg-secondary">
              <ExternalLink className="h-3.5 w-3.5" /> Ver página pública
            </Link>
            <button onClick={save} disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
            </button>
          </div>

          <textarea
            value={current.content_markdown}
            onChange={(e) => update({ content_markdown: e.target.value })}
            rows={28}
            className="w-full rounded-xl border border-input bg-background p-4 font-mono text-sm leading-relaxed"
            placeholder="Conteúdo em Markdown (# título, ## subtítulo, - listas, **negrito**)"
          />
          <p className="text-xs text-muted-foreground">
            Use Markdown: <code className="rounded bg-secondary px-1"># título</code>{" "}
            <code className="rounded bg-secondary px-1">## seção</code>{" "}
            <code className="rounded bg-secondary px-1">- lista</code>{" "}
            <code className="rounded bg-secondary px-1">**negrito**</code>
          </p>
        </div>
      )}
    </div>
  );
}
