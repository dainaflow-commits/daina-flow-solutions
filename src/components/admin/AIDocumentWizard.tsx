import { useMemo, useState } from "react";
import { Loader2, Sparkles, X, ChevronRight, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BriefingResult {
  title: string;
  intro?: string;
  body_markdown?: string;
  total: number;
  pricing_note?: string;
  suggested_price_range?: string;
  valid_until_days?: number;
  payment_terms?: string;
  items?: { description: string; quantity: number; unit_price: number }[];
}

interface Props {
  type: "proposal" | "contract";
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  initialTitle?: string;
  onClose: () => void;
  onGenerated: (data: BriefingResult) => void | Promise<void>;
}

// Faixas de referência (R$) para sugestão em tempo real
const PRICE_MATRIX: Record<string, [number, number]> = {
  "simples|conservador": [1500, 3000],
  "simples|equilibrado": [2500, 5000],
  "simples|premium": [4000, 7000],
  "intermediária|conservador": [3000, 6000],
  "intermediária|equilibrado": [5000, 10000],
  "intermediária|premium": [8000, 15000],
  "alta|conservador": [7000, 12000],
  "alta|equilibrado": [10000, 20000],
  "alta|premium": [15000, 30000],
  "estratégica|conservador": [12000, 20000],
  "estratégica|equilibrado": [20000, 40000],
  "estratégica|premium": [35000, 80000],
};

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export function AIDocumentWizard({ type, clientName, clientEmail, clientCompany, initialTitle, onClose, onGenerated }: Props) {
  const isProposal = type === "proposal";
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title_hint: initialTitle ?? "",
    service_focus: "",
    client_goal: "",
    current_challenge: "",
    scope_summary: "",
    client_profile: "Pequena/média empresa",
    complexity: "intermediária",
    urgency: "normal",
    deadline: "",
    total_value: "",
    pricing_style: "equilibrado",
    payment_terms: "50% no início, 50% na entrega",
    extra_notes: "",
  });

  const totalSteps = isProposal ? 3 : 3;

  const suggestion = useMemo(() => {
    const key = `${form.complexity}|${form.pricing_style}`;
    const range = PRICE_MATRIX[key];
    if (!range) return null;
    let [lo, hi] = range;
    if (form.urgency === "urgente") { lo = Math.round(lo * 1.2); hi = Math.round(hi * 1.3); }
    if (form.urgency === "muito urgente") { lo = Math.round(lo * 1.3); hi = Math.round(hi * 1.5); }
    return { lo, hi };
  }, [form.complexity, form.pricing_style, form.urgency]);

  function canGenerate() {
    return form.service_focus.trim().length > 3;
  }

  async function generate() {
    if (!canGenerate()) {
      toast.error("Descreva em uma linha a ideia ou serviço.");
      setStep(0);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-document", {
        body: {
          type,
          client_name: clientName,
          client_company: clientCompany,
          client_email: clientEmail,
          ...form,
          // se o usuário não colocou escopo, usamos a ideia como escopo mínimo
          scope_summary: form.scope_summary.trim() || form.service_focus,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await onGenerated(data as BriefingResult);
      toast.success(isProposal ? "Proposta gerada!" : "Contrato gerado!");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar com IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">
                {isProposal ? "Nova proposta com IA" : "Novo contrato com IA"}
              </h2>
              <p className="text-xs text-muted-foreground">Para: {clientName} · Preencha só o essencial</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gradient-brand" : "bg-muted"}`} />
            ))}
          </div>

          {/* Passo 1 — o essencial */}
          {step === 0 && (
            <div className="space-y-3">
              <Field label="Ideia ou serviço (obrigatório)">
                <input
                  autoFocus
                  value={form.service_focus}
                  onChange={(e) => setForm({ ...form, service_focus: e.target.value })}
                  placeholder="Ex.: Dashboard de vendas + automação de planilhas"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </Field>
              <Field label="Título da oportunidade (opcional)">
                <input
                  value={form.title_hint}
                  onChange={(e) => setForm({ ...form, title_hint: e.target.value })}
                  placeholder="A IA cria um se você deixar em branco"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </Field>
              {isProposal && (
                <Field label="Resultado esperado pelo cliente (opcional)">
                  <textarea
                    rows={2}
                    value={form.client_goal}
                    onChange={(e) => setForm({ ...form, client_goal: e.target.value })}
                    placeholder="Ex.: Enxergar vendas por loja em tempo real"
                    className="w-full rounded-xl border border-input bg-background p-3 text-sm"
                  />
                </Field>
              )}
              <p className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
                💡 Já dá para gerar agora só com a ideia. Os próximos passos apenas refinam o resultado.
              </p>
            </div>
          )}

          {/* Passo 2 — refinamento (tudo opcional) */}
          {step === 1 && (
            <div className="space-y-3">
              <Field label="Escopo / entregáveis (opcional)">
                <textarea
                  rows={4}
                  value={form.scope_summary}
                  onChange={(e) => setForm({ ...form, scope_summary: e.target.value })}
                  placeholder="Liste rapidamente: diagnóstico, dashboards, automações, treinamento…"
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm"
                />
              </Field>
              {isProposal && (
                <Field label="Problema atual (opcional)">
                  <textarea
                    rows={2}
                    value={form.current_challenge}
                    onChange={(e) => setForm({ ...form, current_challenge: e.target.value })}
                    placeholder="Ex.: dados espalhados, retrabalho manual…"
                    className="w-full rounded-xl border border-input bg-background p-3 text-sm"
                  />
                </Field>
              )}
              {isProposal && (
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Perfil">
                    <select value={form.client_profile} onChange={(e) => setForm({ ...form, client_profile: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                      <option>Micro/pequena empresa</option>
                      <option>Pequena/média empresa</option>
                      <option>Empresa em crescimento</option>
                      <option>Cliente premium/estratégico</option>
                    </select>
                  </Field>
                  <Field label="Complexidade">
                    <select value={form.complexity} onChange={(e) => setForm({ ...form, complexity: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                      <option>simples</option>
                      <option>intermediária</option>
                      <option>alta</option>
                      <option>estratégica</option>
                    </select>
                  </Field>
                  <Field label="Urgência">
                    <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                      <option>normal</option>
                      <option>urgente</option>
                      <option>muito urgente</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* Passo 3 — preço */}
          {step === 2 && (
            <div className="space-y-3">
              {isProposal && (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Estratégia de preço">
                    <select value={form.pricing_style} onChange={(e) => setForm({ ...form, pricing_style: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                      <option value="conservador">Conservador (fechar rápido)</option>
                      <option value="equilibrado">Equilibrado (mercado)</option>
                      <option value="premium">Premium (posicionamento alto)</option>
                    </select>
                  </Field>
                  <Field label="Valor fixo (opcional)">
                    <input value={form.total_value} onChange={(e) => setForm({ ...form, total_value: e.target.value })} placeholder="Deixe em branco para a IA sugerir" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                  </Field>
                </div>
              )}
              {isProposal && suggestion && !form.total_value.trim() && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Faixa sugerida</p>
                  <p className="mt-1 font-display text-xl font-bold text-gradient-brand">
                    {fmtBRL(suggestion.lo)} – {fmtBRL(suggestion.hi)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Referência de mercado brasileiro para complexidade <b>{form.complexity}</b>, estratégia <b>{form.pricing_style}</b>{form.urgency !== "normal" ? <> e urgência <b>{form.urgency}</b></> : null}. A IA vai detalhar itens dentro desta faixa.
                  </p>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Prazo (opcional)">
                  <input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="Ex.: 30 dias" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                </Field>
                <Field label="Pagamento">
                  <input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                </Field>
              </div>
              <Field label="Observações extras (opcional)">
                <textarea
                  rows={3}
                  value={form.extra_notes}
                  onChange={(e) => setForm({ ...form, extra_notes: e.target.value })}
                  placeholder="Algo específico que a IA deve considerar?"
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm"
                />
              </Field>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-5">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || loading}
            className="h-10 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-40"
          >
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={generate}
              disabled={loading || !canGenerate()}
              title={!canGenerate() ? "Descreva a ideia primeiro" : "Gerar agora com o que já foi informado"}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Gerar agora
            </button>
            {step < totalSteps - 1 ? (
              <button
                onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
                className="inline-flex h-10 items-center gap-1 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant"
              >
                Próximo <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={loading || !canGenerate()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Gerando…" : "Gerar proposta"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}
