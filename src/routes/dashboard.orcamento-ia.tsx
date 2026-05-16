import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Loader2, DollarSign, Clock, Users, AlertTriangle,
  Lightbulb, Star, History, FileDown, Trash2, Save, Search, Activity, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { generateQuotePdf, type QuoteTier, type QuotePdfData } from "@/lib/quotePdf";

export const Route = createFileRoute("/dashboard/orcamento-ia")({
  head: () => ({ meta: [{ title: "Orçamento IA — Admin" }] }),
  component: () => <DashboardLayout><Page /></DashboardLayout>,
});

interface QuoteResult {
  analysis: string;
  recommended_tier: string;
  pricing_strategy: string;
  red_flags?: string[];
  tiers?: QuoteTier[];
  Econômico?: QuoteTier;
  Recomendado?: QuoteTier;
  Premium?: QuoteTier;
}

interface QuoteForm {
  description: string;
  complexity: string;
  deadline: string;
  urgency: string;
  client_profile: string;
  pricing_style: string;
}

interface HistoryRow {
  id: string;
  description: string;
  complexity: string | null;
  deadline: string | null;
  urgency: string | null;
  client_profile: string | null;
  pricing_style: string | null;
  result: QuoteResult;
  status: string | null;
  notes: string | null;
  created_at: string;
}

const STATUSES = ["rascunho", "enviado", "aprovado", "faturado"] as const;
type QuoteStatus = (typeof STATUSES)[number];

const STATUS_STYLES: Record<QuoteStatus, string> = {
  rascunho: "bg-secondary text-muted-foreground",
  enviado: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  aprovado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  faturado: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
};

interface AuditEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by_email: string | null;
  created_at: string;
}

function normalizeTiers(r: QuoteResult): QuoteTier[] {
  if (Array.isArray(r.tiers) && r.tiers.length) return r.tiers;
  const arr: QuoteTier[] = [];
  (["Econômico", "Recomendado", "Premium"] as const).forEach((k) => {
    const t = (r as any)[k];
    if (t) arr.push({ ...t, name: k });
  });
  return arr;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function Page() {
  const [form, setForm] = useState<QuoteForm>({
    description: "",
    complexity: "Média",
    deadline: "",
    urgency: "Normal",
    client_profile: "",
    pricing_style: "Equilibrado",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState("");
  const [searchProfile, setSearchProfile] = useState("");
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<Record<string, AuditEntry[]>>({});

  async function loadHistory() {
    const { data, error } = await supabase
      .from("ai_quotes").select("*")
      .order("created_at", { ascending: false }).limit(50);
    if (!error && data) setHistory(data as any);
  }
  useEffect(() => { loadHistory(); }, []);

  async function generate() {
    if (!form.description.trim()) { toast.error("Descreva o serviço primeiro"); return; }
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("quote-ai", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const res = data as QuoteResult;
      setResult(res);

      // Save in history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ai_quotes").insert({
          user_id: user.id,
          description: form.description,
          complexity: form.complexity,
          deadline: form.deadline,
          urgency: form.urgency,
          client_profile: form.client_profile,
          pricing_style: form.pricing_style,
          result: res as any,
        });
        loadHistory();
      }
      toast.success("Orçamento gerado e salvo no histórico!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar orçamento");
    } finally { setLoading(false); }
  }

  async function exportPdf(
    r: QuoteResult,
    f: Partial<QuoteForm>,
    createdAt?: string,
    extra?: { status?: string | null; notes?: string | null },
  ) {
    const tiers = normalizeTiers(r);
    if (!tiers.length) { toast.error("Sem faixas para exportar"); return; }
    const data: QuotePdfData = {
      description: f.description || "",
      complexity: f.complexity, deadline: f.deadline, urgency: f.urgency,
      client_profile: f.client_profile, pricing_style: f.pricing_style,
      analysis: r.analysis, pricing_strategy: r.pricing_strategy,
      recommended_tier: r.recommended_tier, red_flags: r.red_flags,
      tiers, created_at: createdAt,
      status: extra?.status ?? undefined,
      notes: extra?.notes ?? undefined,
    };
    await generateQuotePdf(data);
  }

  async function deleteHistoryItem(id: string) {
    if (!confirm("Excluir este orçamento do histórico?")) return;
    const { error } = await supabase.from("ai_quotes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido");
    loadHistory();
  }

  async function updateStatus(id: string, status: QuoteStatus) {
    const { error } = await supabase.from("ai_quotes").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h)));
    toast.success("Status atualizado");
  }

  async function saveNotes(id: string, notes: string) {
    const { error } = await supabase.from("ai_quotes").update({ notes }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, notes } : h)));
    toast.success("Observações salvas");
  }

  function loadFromHistory(h: HistoryRow) {
    setForm({
      description: h.description,
      complexity: h.complexity || "Média",
      deadline: h.deadline || "",
      urgency: h.urgency || "Normal",
      client_profile: h.client_profile || "",
      pricing_style: h.pricing_style || "Equilibrado",
    });
    setResult(h.result);
    setShowHistory(false);
    toast.success("Orçamento carregado");
  }

  const tiers = result ? normalizeTiers(result) : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Orçamento com IA</h1>
            <p className="text-sm text-muted-foreground">Descreva o serviço e receba 3 faixas de preço com justificativa.</p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"
        >
          <History className="h-4 w-4" /> Histórico ({history.length})
        </button>
      </header>

      {showHistory && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold mb-4">Histórico de orçamentos</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum orçamento salvo ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((h) => {
                const ts = normalizeTiers(h.result);
                const min = Math.min(...ts.map((t) => t.price_min));
                const max = Math.max(...ts.map((t) => t.price_max || t.price_min));
                return (
                  <li key={h.id} className="flex flex-col gap-3 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[(h.status as QuoteStatus) || "rascunho"]}`}>
                            {h.status || "rascunho"}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.created_at).toLocaleString("pt-BR")} · {h.complexity} · {h.urgency}
                          </p>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">{h.description}</p>
                        <p className="text-xs text-muted-foreground">{fmt(min)} — {fmt(max)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={(h.status as QuoteStatus) || "rascunho"}
                          onChange={(e) => updateStatus(h.id, e.target.value as QuoteStatus)}
                          className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold capitalize"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => loadFromHistory(h)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/70">Abrir</button>
                        <button onClick={() => exportPdf(h.result, {
                          description: h.description,
                          complexity: h.complexity ?? undefined,
                          deadline: h.deadline ?? undefined,
                          urgency: h.urgency ?? undefined,
                          client_profile: h.client_profile ?? undefined,
                          pricing_style: h.pricing_style ?? undefined,
                        }, h.created_at, { status: h.status, notes: h.notes })} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/70">
                          <FileDown className="h-3 w-3" /> PDF
                        </button>
                        <button onClick={() => deleteHistoryItem(h.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <NotesEditor initial={h.notes ?? ""} onSave={(v) => saveNotes(h.id, v)} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Descrição do serviço</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex.: Implementar dashboard de RH no Looker Studio com 3 painéis (turnover, absenteísmo, headcount), conectado a planilha do Google Sheets, com treinamento de 2h para o time."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Complexidade</label>
              <select value={form.complexity} onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option>Baixa</option><option>Média</option><option>Alta</option><option>Muito Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Prazo</label>
              <input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                placeholder="Ex.: 30 dias"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Urgência</label>
              <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente (fim de semana / 24h)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Perfil do cliente</label>
              <input value={form.client_profile} onChange={(e) => setForm({ ...form, client_profile: e.target.value })}
                placeholder="Ex.: PME 30 funcionários"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-2">Estilo de cobrança</label>
              <select value={form.pricing_style} onChange={(e) => setForm({ ...form, pricing_style: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option>Conservador (entrar com preço acessível)</option>
                <option>Equilibrado</option>
                <option>Premium (posicionamento de valor alto)</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">A IA usa este estilo para calibrar as 3 faixas ao seu posicionamento.</p>
            </div>
          </div>
          <button
            onClick={generate} disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Calculando…" : "Gerar orçamento com IA"}
          </button>
        </div>
      </section>

      {result && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Análise</h2>
                <p className="mt-1 text-sm text-muted-foreground">{result.analysis}</p>
              </div>
              <button
                onClick={() => exportPdf(result, form)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant"
              >
                <FileDown className="h-4 w-4" /> Exportar PDF
              </button>
            </div>
            {result.pricing_strategy && (
              <div className="mt-4 flex gap-3 rounded-xl bg-secondary/50 p-4">
                <Lightbulb className="h-5 w-5 shrink-0 text-[color:var(--accent-violet)]" />
                <p className="text-sm"><strong>Estratégia:</strong> {result.pricing_strategy}</p>
              </div>
            )}
            {result.red_flags && result.red_flags.length > 0 && (
              <div className="mt-3 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="text-sm">
                  <strong>Atenção:</strong>
                  <ul className="mt-1 list-disc pl-5">
                    {result.red_flags.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {tiers.map((t) => {
              const isRecommended = result.recommended_tier === t.name;
              return (
                <div key={t.name}
                  className={`relative rounded-2xl border p-6 shadow-card ${
                    isRecommended ? "border-primary bg-gradient-to-b from-primary/5 to-card" : "border-border bg-card"
                  }`}>
                  {isRecommended && (
                    <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <Star className="h-3 w-3" /> Recomendado
                    </span>
                  )}
                  <h3 className="font-display text-lg font-bold">{t.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold">{fmt(t.price_min)}</span>
                    {t.price_max > t.price_min && (
                      <span className="text-sm text-muted-foreground">— {fmt(t.price_max)}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t.estimated_hours}h</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{t.ideal_for}</span>
                  </div>
                  <p className="mt-4 text-sm">{t.scope_summary}</p>
                  <div className="mt-4 rounded-xl bg-secondary/50 p-3">
                    <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold">
                      <DollarSign className="h-3 w-3" /> Por que esse valor?
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.justification}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function NotesEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(initial);
  const dirty = val !== initial;
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary/40 p-3 md:flex-row md:items-start">
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={2}
        placeholder="Observações do ciclo de vendas (ex.: enviado por e-mail, aguardando retorno, cliente pediu desconto…)"
        className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs"
      />
      <button
        onClick={() => onSave(val)}
        disabled={!dirty}
        className="inline-flex h-8 shrink-0 items-center gap-1 self-end rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
      >
        <Save className="h-3 w-3" /> Salvar
      </button>
    </div>
  );
}
