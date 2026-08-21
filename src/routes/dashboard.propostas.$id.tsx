import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Save, ArrowLeft, FileDown, Send, Sparkles, FileText, Lightbulb, HelpCircle, TrendingUp, Target, Repeat } from "lucide-react";
import { toast } from "sonner";
import { generateProposalPdf } from "@/lib/documentPdf";
import { downloadEditableDoc } from "@/lib/editableDoc";
import { AIDocumentWizard, type BriefingResult, type ProposalInsights } from "@/components/admin/AIDocumentWizard";

export const Route = createFileRoute("/dashboard/propostas/$id")({
  head: () => ({ meta: [{ title: "Editar Proposta — Admin" }] }),
  component: () => <DashboardLayout><EditProposal /></DashboardLayout>,
});

interface Item { id?: string; description: string; quantity: number; unit_price: number; position: number; }
interface Proposal {
  id: string; title: string; intro: string | null; body_markdown: string | null;
  valid_until: string | null;
  total: number; status: string; client_id: string; signature_data: string | null;
  signer_name: string | null; signed_at: string | null;
  ai_insights: ProposalInsights | null;
  clients?: { full_name: string; email?: string; company?: string | null } | null;
}

function EditProposal() {
  const { id } = Route.useParams();
  const [p, setP] = useState<Proposal | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);

  async function load() {
    const [{ data: prop }, { data: its }] = await Promise.all([
      supabase.from("proposals").select("*, clients(full_name, email, company)").eq("id", id).single(),
      supabase.from("proposal_items").select("*").eq("proposal_id", id).order("position"),
    ]);
    setP(prop as Proposal);
    setItems((its as Item[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  function addItem() {
    setItems((arr) => [...arr, { description: "", quantity: 1, unit_price: 0, position: arr.length }]);
  }
  function updateItem(i: number, patch: Partial<Item>) {
    setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);

  async function save() {
    if (!p) return;
    setSaving(true);
    const { error: proposalError } = await supabase.from("proposals").update({
      title: p.title, intro: p.intro, body_markdown: p.body_markdown,
      valid_until: p.valid_until || null, total, ai_insights: p.ai_insights ?? null,
    }).eq("id", id);
    if (proposalError) { setSaving(false); toast.error(proposalError.message); return; }

    const { error: deleteError } = await supabase.from("proposal_items").delete().eq("proposal_id", id);
    if (deleteError) { setSaving(false); toast.error(deleteError.message); return; }

    if (items.length > 0) {
      const { error: itemError } = await supabase.from("proposal_items").insert(items.map((it, idx) => ({
        proposal_id: id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, position: idx,
      })));
      if (itemError) { setSaving(false); toast.error(itemError.message); return; }
    }
    setSaving(false);
    toast.success("Proposta salva");
    load();
  }

  async function send() {
    await save();
    await supabase.from("proposals").update({ status: "enviada" }).eq("id", id);
    toast.success("Proposta enviada ao cliente");
    load();
  }

  function downloadPdf() {
    if (!p) return;
    generateProposalPdf({
      title: p.title, intro: p.intro, body_markdown: p.body_markdown,
      valid_until: p.valid_until, total,
      client_name: p.clients?.full_name ?? "Cliente",
      signature_data: p.signature_data, signer_name: p.signer_name, signed_at: p.signed_at,
      items: items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })),
    });
  }

  function downloadDoc() {
    if (!p) return;
    downloadEditableDoc({
      title: p.title,
      subtitle: "Proposta Comercial · Daina Flow",
      meta: [
        { label: "Cliente", value: p.clients?.full_name ?? "—" },
        ...(p.valid_until ? [{ label: "Validade", value: new Date(p.valid_until).toLocaleDateString("pt-BR") }] : []),
        { label: "Emissão", value: new Date().toLocaleDateString("pt-BR") },
      ],
      intro: p.intro,
      body_markdown: p.body_markdown,
      items: items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })),
      total,
    }, `proposta-${p.title.replace(/\s+/g, "-").toLowerCase().slice(0, 60)}`);
  }

  async function applyAI(r: BriefingResult) {
    if (!p) return;
    const generatedItems = r.items?.length
      ? r.items
      : r.total > 0
        ? [{ description: "Projeto completo conforme escopo proposto", quantity: 1, unit_price: r.total }]
        : [];
    const nextItems = generatedItems.map((it, idx) => ({ description: it.description, quantity: it.quantity || 1, unit_price: it.unit_price || 0, position: idx }));
    const nextTotal = nextItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) || Number(r.total || 0);
    let nextValidUntil = p.valid_until;
    if (r.valid_until_days && !p.valid_until) {
      const d = new Date(); d.setDate(d.getDate() + r.valid_until_days);
      nextValidUntil = d.toISOString().slice(0, 10);
    }
    const insights: ProposalInsights = {
      hipoteses_a_confirmar: r.hipoteses_a_confirmar,
      oportunidades_adicionais: r.oportunidades_adicionais,
      perguntas_estrategicas: r.perguntas_estrategicas,
      impacto_financeiro: r.impacto_financeiro,
      caminho_recorrente: r.caminho_recorrente,
      suggested_price_range: r.suggested_price_range,
      pricing_note: r.pricing_note,
    };
    const nextProposal = { ...p, title: r.title || p.title, intro: r.intro ?? p.intro, body_markdown: r.body_markdown ?? p.body_markdown, valid_until: nextValidUntil, ai_insights: insights };
    setP(nextProposal);
    setItems(nextItems);

    const { error: proposalError } = await supabase.from("proposals").update({
      title: nextProposal.title,
      intro: nextProposal.intro,
      body_markdown: nextProposal.body_markdown,
      valid_until: nextProposal.valid_until || null,
      total: nextTotal,
      ai_insights: insights,
    }).eq("id", id);
    if (proposalError) throw new Error(proposalError.message);
    const { error: deleteError } = await supabase.from("proposal_items").delete().eq("proposal_id", id);
    if (deleteError) throw new Error(deleteError.message);
    if (nextItems.length > 0) {
      const { error: itemError } = await supabase.from("proposal_items").insert(nextItems.map((it, idx) => ({
        proposal_id: id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        position: idx,
      })));
      if (itemError) throw new Error(itemError.message);
    }
  }

  if (loading || !p) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Link to="/dashboard/propostas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Cliente: {p.clients?.full_name}</p>
          <h1 className="font-display text-3xl font-bold">Editar proposta</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAI(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant">
            <Sparkles className="h-4 w-4" /> Gerar com IA
          </button>
          <button onClick={downloadPdf} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold">
            <FileDown className="h-4 w-4" /> PDF
          </button>
          <button onClick={downloadDoc} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold" title="Baixar arquivo editável (.doc) — abre no Word e Google Docs">
            <FileText className="h-4 w-4" /> Word
          </button>
          <button onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </button>
          {p.status === "rascunho" && (
            <button onClick={send} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              <Send className="h-4 w-4" /> Enviar
            </button>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Field label="Título"><input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></Field>
        <Field label="Resumo executivo"><textarea rows={4} value={p.intro ?? ""} onChange={(e) => setP({ ...p, intro: e.target.value })} className="w-full rounded-xl border border-input bg-background p-3 text-sm" placeholder="Apresente o escopo, objetivos e benefícios…" /></Field>
        <Field label="Detalhamento (markdown — entra no PDF a partir da página 2)">
          <textarea rows={12} value={p.body_markdown ?? ""} onChange={(e) => setP({ ...p, body_markdown: e.target.value })} className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs" placeholder="## Contexto&#10;...&#10;## Solução proposta&#10;..." />
        </Field>
        <Field label="Validade"><input type="date" value={p.valid_until ?? ""} onChange={(e) => setP({ ...p, valid_until: e.target.value })} className="h-11 w-full max-w-xs rounded-xl border border-input bg-background px-3 text-sm" /></Field>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Itens</h2>
          <button onClick={addItem} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold"><Plus className="h-3.5 w-3.5" /> Adicionar item</button>
        </div>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>}
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="Descrição" className="col-span-12 md:col-span-6 h-10 rounded-lg border border-input bg-background px-3 text-sm" />
              <input type="number" min={0} step="0.01" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} placeholder="Qtd" className="col-span-4 md:col-span-2 h-10 rounded-lg border border-input bg-background px-3 text-sm" />
              <input type="number" min={0} step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} placeholder="R$ unit." className="col-span-6 md:col-span-3 h-10 rounded-lg border border-input bg-background px-3 text-sm" />
              <button onClick={() => removeItem(i)} className="col-span-2 md:col-span-1 grid place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm font-semibold">Total</span>
          <span className="font-display text-2xl font-bold text-gradient-brand">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
          </span>
        </div>
      </section>

      {p.signature_data && (
        <section className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
          <h2 className="font-display text-lg font-bold text-green-700">✓ Aceita pelo cliente</h2>
          <p className="text-sm text-muted-foreground">Por {p.signer_name} em {p.signed_at && new Date(p.signed_at).toLocaleString("pt-BR")}</p>
          <img src={p.signature_data} alt="Assinatura" className="mt-3 max-h-32 rounded-lg border border-border bg-white p-2" />
        </section>
      )}

      {showAI && p.clients && (
        <AIDocumentWizard
          type="proposal"
          clientName={p.clients.full_name}
          clientEmail={p.clients.email}
          clientCompany={p.clients.company ?? undefined}
          initialTitle={p.title}
          onClose={() => setShowAI(false)}
          onGenerated={applyAI}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
