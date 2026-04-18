import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, FileDown } from "lucide-react";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { generateContractPdf } from "@/lib/documentPdf";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/contrato/assinar/$token")({
  head: () => ({ meta: [{ title: "Assinar contrato — Daina Flow" }] }),
  component: SignContract,
});

interface Contract {
  id: string; title: string; body: string; total: number; status: string;
  signature_data: string | null; signer_name: string | null; signed_at: string | null;
  signer_email: string | null;
  clients?: { full_name: string; email: string } | null;
}

function SignContract() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [c, setC] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("contracts")
        .select("*, clients(full_name, email)")
        .eq("sign_token", token)
        .maybeSingle();
      if (data) {
        setC(data as Contract);
        setSignerName((data as any).clients?.full_name ?? "");
        setSignerEmail((data as any).clients?.email ?? "");
      }
      setLoading(false);
    })();
  }, [token]);

  function downloadPdf() {
    if (!c) return;
    generateContractPdf({
      title: c.title, body_markdown: c.body, total: c.total,
      client_name: c.clients?.full_name ?? "Cliente",
      client_email: c.clients?.email,
      signature_data: c.signature_data, signer_name: c.signer_name, signed_at: c.signed_at,
    });
  }

  async function sign() {
    if (!c) return;
    if (!signerName.trim()) { toast.error("Informe seu nome"); return; }
    if (sigRef.current?.isEmpty()) { toast.error("Assine no quadro"); return; }
    setSubmitting(true);
    const sig = sigRef.current!.getCanvas().toDataURL("image/png");
    const signed_at = new Date().toISOString();
    const { error } = await supabase.from("contracts").update({
      status: "assinado", signature_data: sig, signer_name: signerName,
      signer_email: signerEmail, signed_at,
    }).eq("sign_token", token);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contrato assinado! 💙");
    setC({ ...c, status: "assinado", signature_data: sig, signer_name: signerName, signer_email: signerEmail, signed_at });
  }

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!c) return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Link inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground">Este contrato não existe ou foi removido.</p>
        <button onClick={() => navigate({ to: "/" })} className="mt-6 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground">Início</button>
      </div>
    </div>
  );

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
  const signed = c.status === "assinado";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center px-4">
          <BrandLogo size="md" />
        </div>
      </header>

      <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <article className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Contrato de prestação de serviços</p>
          <h1 className="mt-2 font-display text-2xl md:text-3xl font-bold">{c.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contratante: <strong>{c.clients?.full_name}</strong> · Valor: <strong>{fmt(c.total)}</strong>
          </p>

          <div className="prose prose-sm mt-6 max-w-none whitespace-pre-line text-sm leading-relaxed text-foreground">
            {c.body}
          </div>

          {signed && (
            <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-4">
              <p className="font-semibold text-green-700">✓ Você assinou este contrato</p>
              <p className="text-xs text-muted-foreground">{c.signer_name} · {c.signed_at && new Date(c.signed_at).toLocaleString("pt-BR")}</p>
              {c.signature_data && <img src={c.signature_data} alt="Assinatura" className="mt-3 max-h-24 rounded-lg border border-border bg-white p-2" />}
            </div>
          )}
        </article>

        <div className="flex flex-wrap gap-2">
          <button onClick={downloadPdf} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold">
            <FileDown className="h-4 w-4" /> Baixar PDF
          </button>
        </div>

        {!signed && (
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card">
            <h2 className="font-display text-xl font-bold">Assinar digitalmente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Confirme seus dados e assine no quadro. Isso vale como aceite formal do contrato.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Seu nome completo" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" />
              <input value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} placeholder="Seu e-mail" type="email" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" />
            </div>
            <div className="mt-3 rounded-xl border border-border bg-white">
              <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-44 rounded-xl" }} penColor="#0ea5e9" />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button onClick={() => sigRef.current?.clear()} className="text-sm text-muted-foreground hover:text-foreground">Limpar</button>
              <button onClick={sign} disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirmar assinatura
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
