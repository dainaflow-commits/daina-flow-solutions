import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, ArrowLeft, FileDown, Sparkles, Send, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import { generateContractPdf } from "@/lib/documentPdf";
import { downloadEditableDoc } from "@/lib/editableDoc";
import { AIDocumentWizard, type BriefingResult } from "@/components/admin/AIDocumentWizard";

export const Route = createFileRoute("/dashboard/contratos/$id")({
  head: () => ({ meta: [{ title: "Editar Contrato — Admin" }] }),
  component: () => <DashboardLayout><EditContract /></DashboardLayout>,
});

interface Contract {
  id: string; title: string; body: string; total: number; status: string;
  client_id: string; sign_token: string | null; sent_at: string | null;
  signature_data: string | null; signer_name: string | null; signed_at: string | null;
  signer_email: string | null;
  clients?: { full_name: string; email: string; company: string | null } | null;
}

function EditContract() {
  const { id } = Route.useParams();
  const [c, setC] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAI, setShowAI] = useState(false);

  async function load() {
    const { data } = await supabase.from("contracts").select("*, clients(full_name, email, company)").eq("id", id).single();
    setC(data as Contract);
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    if (!c) return;
    setSaving(true);
    await supabase.from("contracts").update({
      title: c.title, body: c.body, total: c.total,
    }).eq("id", id);
    setSaving(false);
    toast.success("Contrato salvo");
  }

  function downloadPdf() {
    if (!c) return;
    generateContractPdf({
      title: c.title, body_markdown: c.body, total: c.total,
      client_name: c.clients?.full_name ?? "Cliente",
      client_email: c.clients?.email,
      signature_data: c.signature_data, signer_name: c.signer_name, signed_at: c.signed_at,
    });
  }

  function downloadDoc() {
    if (!c) return;
    downloadEditableDoc({
      title: c.title,
      subtitle: "Contrato de Prestação de Serviços · Daina Flow",
      meta: [
        { label: "Contratante", value: c.clients?.full_name ?? "—" },
        ...(c.clients?.email ? [{ label: "E-mail", value: c.clients.email }] : []),
        { label: "Valor", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c.total || 0) },
        { label: "Emissão", value: new Date().toLocaleDateString("pt-BR") },
      ],
      body_markdown: c.body,
    }, `contrato-${c.title.replace(/\s+/g, "-").toLowerCase().slice(0, 60)}`);
  }

  function applyAI(r: BriefingResult) {
    if (!c) return;
    setC({ ...c, title: r.title || c.title, body: r.body_markdown ?? c.body, total: r.total ?? c.total });
  }

  async function sendForSignature() {
    if (!c) return;
    if (!c.body.trim()) { toast.error("Adicione conteúdo ao contrato"); return; }
    if (!c.clients?.email) { toast.error("Cliente sem e-mail cadastrado"); return; }
    setSending(true);
    await save();
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error: upErr } = await supabase.from("contracts").update({
      sign_token: token, status: "enviado", sent_at: new Date().toISOString(),
    }).eq("id", id);
    if (upErr) { setSending(false); toast.error(upErr.message); return; }

    const sign_url = `${window.location.origin}/contrato/assinar/${token}`;

    const pdfRes = generateContractPdf({
      title: c.title, body_markdown: c.body, total: c.total,
      client_name: c.clients.full_name, client_email: c.clients.email,
    }, { returnDataUrl: true });

    try {
      await supabase.functions.invoke("send-contract-email", {
        body: {
          to: c.clients.email,
          client_name: c.clients.full_name,
          contract_title: c.title,
          sign_url,
          pdf_data_url: pdfRes?.dataUrl,
          pdf_filename: pdfRes?.filename,
        },
      });
      toast.success("Contrato enviado por e-mail!");
    } catch {
      await navigator.clipboard.writeText(sign_url).catch(() => {});
      toast("E-mail não enviado — link copiado para você compartilhar");
    } finally {
      setSending(false);
      load();
    }
  }

  async function copyLink() {
    if (!c?.sign_token) return;
    const url = `${window.location.origin}/contrato/assinar/${c.sign_token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  if (loading || !c) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  return (
    <div className="space-y-6">
      <Link to="/dashboard/contratos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Cliente: {c.clients?.full_name}</p>
          <h1 className="font-display text-3xl font-bold">Editar contrato</h1>
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
          {c.status === "rascunho" && (
            <button onClick={sendForSignature} disabled={sending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar para assinatura
            </button>
          )}
          {c.sign_token && c.status !== "assinado" && (
            <button onClick={copyLink} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold">
              <Copy className="h-4 w-4" /> Copiar link
            </button>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Field label="Título"><input value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Valor (R$)">
            <input type="number" min={0} step="0.01" value={c.total} onChange={(e) => setC({ ...c, total: Number(e.target.value) })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
          </Field>
          <div className="self-end pb-1 text-sm font-semibold text-muted-foreground">{fmt(c.total)}</div>
        </div>
        <Field label="Conteúdo (markdown — vire as cláusulas)">
          <textarea rows={20} value={c.body} onChange={(e) => setC({ ...c, body: e.target.value })} className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs" placeholder="## CLÁUSULA 1ª — DAS PARTES&#10;...&#10;## CLÁUSULA 2ª — DO OBJETO&#10;..." />
        </Field>
      </section>

      {c.signature_data && (
        <section className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
          <h2 className="font-display text-lg font-bold text-green-700">✓ Assinado pelo cliente</h2>
          <p className="text-sm text-muted-foreground">Por {c.signer_name} ({c.signer_email}) em {c.signed_at && new Date(c.signed_at).toLocaleString("pt-BR")}</p>
          <img src={c.signature_data} alt="Assinatura" className="mt-3 max-h-32 rounded-lg border border-border bg-white p-2" />
        </section>
      )}

      {showAI && c.clients && (
        <AIDocumentWizard
          type="contract"
          clientName={c.clients.full_name}
          clientEmail={c.clients.email}
          clientCompany={c.clients.company ?? undefined}
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
