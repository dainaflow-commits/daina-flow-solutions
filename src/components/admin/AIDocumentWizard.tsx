import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BriefingResult {
  title: string;
  intro?: string;
  body_markdown?: string;
  total: number;
  valid_until_days?: number;
  payment_terms?: string;
  items?: { description: string; quantity: number; unit_price: number }[];
}

interface Props {
  type: "proposal" | "contract";
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  onClose: () => void;
  onGenerated: (data: BriefingResult) => void;
}

export function AIDocumentWizard({ type, clientName, clientEmail, clientCompany, onClose, onGenerated }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    service_focus: "",
    scope_summary: "",
    deadline: "",
    total_value: "",
    payment_terms: "50% no início, 50% na entrega",
    extra_notes: "",
  });

  const isProposal = type === "proposal";
  const total = 4;

  function next() { setStep((s) => Math.min(s + 1, total - 1)); }
  function prev() { setStep((s) => Math.max(s - 1, 0)); }

  async function generate() {
    if (!form.service_focus || !form.scope_summary) {
      toast.error("Preencha o foco do serviço e o escopo");
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
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onGenerated(data as BriefingResult);
      toast.success(isProposal ? "Proposta gerada!" : "Contrato gerado!");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar com IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">
                Gerar {isProposal ? "proposta" : "contrato"} com IA
              </h2>
              <p className="text-xs text-muted-foreground">Para: {clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gradient-brand" : "bg-muted"}`} />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-3">
              <Label>Qual o foco do {isProposal ? "serviço a ofertar" : "objeto do contrato"}?</Label>
              <input
                value={form.service_focus}
                onChange={(e) => setForm({ ...form, service_focus: e.target.value })}
                placeholder="Ex.: Implementação de dashboard de People Analytics"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Seja específico — quanto melhor o briefing, melhor o documento.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Label>Escopo / o que será entregue</Label>
              <textarea
                rows={6}
                value={form.scope_summary}
                onChange={(e) => setForm({ ...form, scope_summary: e.target.value })}
                placeholder="Ex.: Diagnóstico inicial, modelagem de dados (turnover, absenteísmo), 3 dashboards no Looker Studio, treinamento de 4h."
                className="w-full rounded-xl border border-input bg-background p-3 text-sm"
              />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prazo</Label>
                <input
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  placeholder="Ex.: 30 dias"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <input
                  value={form.total_value}
                  onChange={(e) => setForm({ ...form, total_value: e.target.value })}
                  placeholder="Ex.: R$ 4500 ou A partir de R$ 2000"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Condições de pagamento</Label>
                <input
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Label>Observações extras (opcional)</Label>
              <textarea
                rows={5}
                value={form.extra_notes}
                onChange={(e) => setForm({ ...form, extra_notes: e.target.value })}
                placeholder="Algo específico que a IA deve considerar?"
                className="w-full rounded-xl border border-input bg-background p-3 text-sm"
              />
              <div className="rounded-xl bg-secondary/50 p-4 text-xs text-muted-foreground">
                Pronto! Clique em <strong>Gerar com IA</strong>. Você poderá editar tudo depois.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-5">
          <button
            onClick={prev}
            disabled={step === 0 || loading}
            className="h-10 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-40"
          >
            Voltar
          </button>
          {step < total - 1 ? (
            <button
              onClick={next}
              className="h-10 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Gerando…" : "Gerar com IA"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-foreground">{children}</label>;
}
