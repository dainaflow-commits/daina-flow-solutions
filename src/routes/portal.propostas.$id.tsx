import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, FileDown, Check, X } from "lucide-react";
import { toast } from "sonner";
import { generateProposalPdf } from "@/lib/proposalPdf";
import SignatureCanvas from "react-signature-canvas";

export const Route = createFileRoute("/portal/propostas/$id")({
  head: () => ({ meta: [{ title: "Proposta — Daina Flow" }] }),
  component: () => <PortalLayout><ViewProposal /></PortalLayout>,
});

interface Proposal {
  id: string; title: string; intro: string | null; valid_until: string | null; total: number;
  status: string; signature_data: string | null; signer_name: string | null; signed_at: string | null;
  clients?: { full_name: string } | null;
}
interface Item { description: string; quantity: number; unit_price: number; }

function ViewProposal() {
  const { id } = Route.useParams();
  const { fullName } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<Proposal | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSign, setShowSign] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    (async () => {
      const [{ data: prop }, { data: its }] = await Promise.all([
        supabase.from("proposals").select("*, clients(full_name)").eq("id", id).single(),
        supabase.from("proposal_items").select("description, quantity, unit_price").eq("proposal_id", id).order("position"),
      ]);
      setP(prop as Proposal);
      setItems((its as Item[]) ?? []);
      setSignerName(fullName ?? "");
      setLoading(false);
    })();
  }, [id, fullName]);

  function downloadPdf() {
    if (!p) return;
    generateProposalPdf({
      title: p.title, intro: p.intro, valid_until: p.valid_until, total: p.total,
      client_name: p.clients?.full_name ?? "Cliente",
      signature_data: p.signature_data, signer_name: p.signer_name, signed_at: p.signed_at,
      items,
    });
  }

  async function accept() {
    if (!p) return;
    if (!signerName.trim()) { toast.error("Informe seu nome"); return; }
    if (sigRef.current?.isEmpty()) { toast.error("Assine no quadro abaixo"); return; }
    setSubmitting(true);
    const sig = sigRef.current!.getCanvas().toDataURL("image/png");
    const { error } = await supabase
      .from("proposals")
      .update({ status: "aceita", signature_data: sig, signer_name: signerName, signed_at: new Date().toISOString() })
      .eq("id", id);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Proposta aceita! Obrigada 💙");
    setShowSign(false);
    setP({ ...p, status: "aceita", signature_data: sig, signer_name: signerName, signed_at: new Date().toISOString() });
  }

  async function decline() {
    if (!confirm("Deseja recusar esta proposta?")) return;
    await supabase.from("proposals").update({ status: "recusada" }).eq("id", id);
    toast("Proposta recusada");
    navigate({ to: "/portal/propostas" });
  }

  if (loading || !p) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
  const accepted = p.status === "aceita";

  return (
    <div className="space-y-6">
      <Link to="/portal/propostas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <article className="rounded-3xl border border-border bg-card p-8 shadow-card">
        <header className="border-b border-border pb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Proposta Comercial</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Para: <strong>{p.clients?.full_name}</strong>
            {p.valid_until && <> · Válida até {new Date(p.valid_until).toLocaleDateString("pt-BR")}</>}
          </p>
        </header>

        {p.intro && <p className="whitespace-pre-line py-6 text-sm leading-relaxed">{p.intro}</p>}

        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr><th className="py-2">Descrição</th><th className="py-2 text-right w-16">Qtd</th><th className="py-2 text-right w-28">Unitário</th><th className="py-2 text-right w-28">Total</th></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-3">{it.description}</td>
                <td className="py-3 text-right">{it.quantity}</td>
                <td className="py-3 text-right">{fmt(it.unit_price)}</td>
                <td className="py-3 text-right font-semibold">{fmt(it.quantity * it.unit_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="pt-4 text-right font-semibold">Total</td><td className="pt-4 text-right font-display text-2xl font-bold text-gradient-brand">{fmt(p.total)}</td></tr>
          </tfoot>
        </table>

        {accepted && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-4">
            <p className="font-semibold text-green-700">✓ Você aceitou esta proposta</p>
            <p className="text-xs text-muted-foreground">{p.signer_name} · {p.signed_at && new Date(p.signed_at).toLocaleString("pt-BR")}</p>
            {p.signature_data && <img src={p.signature_data} alt="Sua assinatura" className="mt-3 max-h-24 rounded-lg border border-border bg-white p-2" />}
          </div>
        )}
      </article>

      <div className="flex flex-wrap gap-2">
        <button onClick={downloadPdf} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold">
          <FileDown className="h-4 w-4" /> Baixar PDF
        </button>
        {!accepted && p.status !== "recusada" && (
          <>
            <button onClick={() => setShowSign(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant">
              <Check className="h-4 w-4" /> Aceitar e assinar
            </button>
            <button onClick={decline} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold text-destructive">
              <X className="h-4 w-4" /> Recusar
            </button>
          </>
        )}
      </div>

      {showSign && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowSign(false)}>
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-elegant" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold">Aceite digital</h2>
            <p className="text-sm text-muted-foreground">Confirme seu nome e assine no quadro abaixo. Isso vale como aceite formal.</p>
            <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Seu nome completo" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            <div className="rounded-xl border border-border bg-white">
              <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-40 rounded-xl" }} penColor="#0ea5e9" />
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <button onClick={() => sigRef.current?.clear()} className="text-sm text-muted-foreground hover:text-foreground">Limpar</button>
              <div className="flex gap-2">
                <button onClick={() => setShowSign(false)} className="h-10 rounded-xl border border-border px-4 text-sm">Cancelar</button>
                <button onClick={accept} disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
