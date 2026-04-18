import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, FileSignature, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/contratos")({
  head: () => ({ meta: [{ title: "Contratos — Admin" }] }),
  component: () => <DashboardLayout><AdminContracts /></DashboardLayout>,
});

interface Contract {
  id: string; title: string; status: string; total: number; client_id: string;
  created_at: string; signed_at: string | null;
  clients?: { full_name: string } | null;
}
interface Client { id: string; full_name: string; }

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Enviado", assinado: "Assinado", recusado: "Recusado",
};
const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-blue-500/10 text-blue-600",
  assinado: "bg-green-500/10 text-green-600",
  recusado: "bg-destructive/10 text-destructive",
};

function AdminContracts() {
  const [list, setList] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");

  async function load() {
    const [{ data: cs }, { data: cl }] = await Promise.all([
      supabase.from("contracts").select("*, clients(full_name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name").order("full_name"),
    ]);
    setList((cs as Contract[]) ?? []);
    setClients((cl as Client[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!newTitle.trim() || !newClient) { toast.error("Selecione cliente e título"); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("contracts")
      .insert({ title: newTitle, client_id: newClient, status: "rascunho", body: "" })
      .select("id").single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contrato criado");
    setNewTitle(""); setNewClient("");
    window.location.href = `/dashboard/contratos/${data!.id}`;
  }

  async function remove(id: string) {
    if (!confirm("Excluir este contrato?")) return;
    await supabase.from("contracts").delete().eq("id", id);
    setList((p) => p.filter((x) => x.id !== id));
    toast.success("Contrato excluído");
  }

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Contratos</h1>
        <p className="text-sm text-muted-foreground">Crie, gere com IA, envie por e-mail e receba assinatura digital.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">Novo contrato</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,auto]">
          <select value={newClient} onChange={(e) => setNewClient(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">Selecione o cliente…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título do contrato" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" />
          <button onClick={create} disabled={creating} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4"><h2 className="font-display text-lg font-bold">Todos os contratos ({list.length})</h2></div>
        {list.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            <FileSignature className="mx-auto mb-3 h-8 w-8 opacity-50" />
            Nenhum contrato criado ainda.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.clients?.full_name ?? "—"} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className="text-sm font-semibold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(c.total) || 0)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                <Link to="/dashboard/contratos/$id" params={{ id: c.id }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5" /> Abrir
                </Link>
                <button onClick={() => remove(c.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
