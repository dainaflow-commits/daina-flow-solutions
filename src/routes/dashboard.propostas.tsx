import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, FileText, Trash2, Send, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AIDocumentWizard, type BriefingResult, type ProposalInsights } from "@/components/admin/AIDocumentWizard";

export const Route = createFileRoute("/dashboard/propostas")({
  head: () => ({ meta: [{ title: "Propostas — Admin" }] }),
  component: ProposalsRoute,
});

function ProposalsRoute() {
  const location = useLocation();
  if (location.pathname !== "/dashboard/propostas") return <Outlet />;
  return <DashboardLayout><AdminProposals /></DashboardLayout>;
}

interface Proposal {
  id: string; title: string; status: string; total: number; valid_until: string | null;
  client_id: string; created_at: string;
  clients?: { full_name: string } | null;
}

interface Client { id: string; full_name: string; email?: string; company?: string | null; }

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", enviada: "Enviada", aceita: "Aceita", recusada: "Recusada", expirada: "Expirada",
};
const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviada: "bg-blue-500/10 text-blue-600",
  aceita: "bg-green-500/10 text-green-600",
  recusada: "bg-destructive/10 text-destructive",
  expirada: "bg-orange-500/10 text-orange-600",
};

function AdminProposals() {
  const [list, setList] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const selectedClient = clients.find((c) => c.id === newClient) ?? null;

  async function load() {
    const [{ data: pr }, { data: cl }] = await Promise.all([
      supabase.from("proposals").select("*, clients(full_name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name, email, company").order("full_name"),
    ]);
    setList((pr as Proposal[]) ?? []);
    setClients((cl as Client[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!newTitle.trim() || !newClient) { toast.error("Selecione um cliente e dê um título."); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("proposals")
      .insert({ title: newTitle, client_id: newClient, status: "rascunho" })
      .select("id").single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Proposta criada");
    setNewTitle(""); setNewClient("");
    window.location.href = `/dashboard/propostas/${data!.id}`;
  }

  function openGuidedProposal() {
    if (!newClient || !selectedClient) { toast.error("Selecione um cliente para gerar a proposta."); return; }
    setShowAI(true);
  }

  async function createFromAI(result: BriefingResult) {
    if (!selectedClient) throw new Error("Selecione um cliente");
    const generatedItems = result.items?.length
      ? result.items
      : result.total > 0
        ? [{ description: "Projeto completo conforme escopo proposto", quantity: 1, unit_price: result.total }]
        : [];
    const total = generatedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0) || Number(result.total || 0);
    const validUntil = result.valid_until_days
      ? (() => { const d = new Date(); d.setDate(d.getDate() + result.valid_until_days!); return d.toISOString().slice(0, 10); })()
      : null;

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        title: result.title || newTitle.trim() || `Proposta Comercial — ${selectedClient.full_name}`,
        client_id: selectedClient.id,
        intro: result.intro ?? null,
        body_markdown: result.body_markdown ?? null,
        valid_until: validUntil,
        total,
        status: "rascunho",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (generatedItems.length > 0) {
      const { error: itemError } = await supabase.from("proposal_items").insert(generatedItems.map((item, index) => ({
        proposal_id: data!.id,
        description: item.description,
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        position: index,
      })));
      if (itemError) throw new Error(itemError.message);
    }
    window.location.href = `/dashboard/propostas/${data!.id}`;
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta proposta?")) return;
    await supabase.from("proposals").delete().eq("id", id);
    setList((p) => p.filter((x) => x.id !== id));
    toast.success("Proposta excluída");
  }

  async function send(id: string) {
    await supabase.from("proposals").update({ status: "enviada" }).eq("id", id);
    setList((p) => p.map((x) => (x.id === id ? { ...x, status: "enviada" } : x)));
    toast.success("Proposta enviada ao cliente");
  }

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Propostas Comerciais</h1>
        <p className="text-sm text-muted-foreground">Crie, envie e acompanhe propostas com aceite digital.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">Nova proposta</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,auto,auto]">
          <select value={newClient} onChange={(e) => setNewClient(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">Selecione o cliente…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título da proposta (opcional para IA)" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" />
          <button onClick={openGuidedProposal} disabled={creating} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
            <Sparkles className="h-4 w-4" /> Criar estruturada
          </button>
          <button onClick={create} disabled={creating} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold disabled:opacity-60">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Em branco
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4"><h2 className="font-display text-lg font-bold">Todas as propostas ({list.length})</h2></div>
        {list.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />
            Nenhuma proposta criada ainda.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.clients?.full_name ?? "—"} · {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className="text-sm font-semibold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p.total) || 0)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                <Link to="/dashboard/propostas/$id" params={{ id: p.id }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Link>
                {p.status === "rascunho" && (
                  <button onClick={() => send(p.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </button>
                )}
                <button onClick={() => remove(p.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showAI && selectedClient && (
        <AIDocumentWizard
          type="proposal"
          clientName={selectedClient.full_name}
          clientEmail={selectedClient.email}
          clientCompany={selectedClient.company ?? undefined}
          initialTitle={newTitle}
          onClose={() => setShowAI(false)}
          onGenerated={createFromAI}
        />
      )}
    </div>
  );
}
