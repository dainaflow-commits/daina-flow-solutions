import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, DollarSign, Clock, Users, AlertTriangle, Lightbulb, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/orcamento-ia")({
  head: () => ({ meta: [{ title: "Orçamento IA — Admin" }] }),
  component: () => <DashboardLayout><Page /></DashboardLayout>,
});

interface Tier {
  name: string;
  price_min: number;
  price_max: number;
  scope_summary: string;
  justification: string;
  estimated_hours: number;
  ideal_for: string;
}
interface QuoteResult {
  analysis: string;
  recommended_tier: string;
  pricing_strategy: string;
  red_flags?: string[];
  tiers?: Tier[];
  // Alguns modelos retornam estrutura ligeiramente diferente
  Econômico?: Tier;
  Recomendado?: Tier;
  Premium?: Tier;
}

function normalizeTiers(r: QuoteResult): Tier[] {
  if (Array.isArray(r.tiers) && r.tiers.length) return r.tiers;
  const arr: Tier[] = [];
  (["Econômico", "Recomendado", "Premium"] as const).forEach((k) => {
    const t = (r as any)[k];
    if (t) arr.push({ ...t, name: k });
  });
  return arr;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function Page() {
  const [form, setForm] = useState({
    description: "",
    complexity: "Média",
    deadline: "",
    client_profile: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);

  async function generate() {
    if (!form.description.trim()) {
      toast.error("Descreva o serviço primeiro");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("quote-ai", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as QuoteResult);
      toast.success("Orçamento gerado!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar orçamento");
    } finally {
      setLoading(false);
    }
  }

  const tiers = result ? normalizeTiers(result) : [];

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Orçamento com IA</h1>
          <p className="text-sm text-muted-foreground">Descreva o serviço e receba 3 faixas de preço com justificativa.</p>
        </div>
      </header>

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
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Complexidade</label>
              <select
                value={form.complexity}
                onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option>Baixa</option>
                <option>Média</option>
                <option>Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Prazo</label>
              <input
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                placeholder="Ex.: 30 dias"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Perfil do cliente</label>
              <input
                value={form.client_profile}
                onChange={(e) => setForm({ ...form, client_profile: e.target.value })}
                placeholder="Ex.: PME 30 funcionários"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
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
            <h2 className="font-display text-lg font-bold mb-2">Análise</h2>
            <p className="text-sm text-muted-foreground">{result.analysis}</p>
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
                <div
                  key={t.name}
                  className={`relative rounded-2xl border p-6 shadow-card ${
                    isRecommended
                      ? "border-primary bg-gradient-to-b from-primary/5 to-card"
                      : "border-border bg-card"
                  }`}
                >
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
