import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, Trash2, Inbox } from "lucide-react";

export const Route = createFileRoute("/dashboard/leads")({
  component: () => <DashboardLayout><LeadsAdmin /></DashboardLayout>,
});

interface Lead { id: string; name: string; email: string; phone: string | null; service_interest: string | null; message: string; status: string; created_at: string; }

const STATUSES = ["novo", "contato", "negociando", "ganho", "perdido"];

function LeadsAdmin() {
  const [items, setItems] = useState<Lead[]>([]);

  async function load() {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status atualizado"); load(); }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); load(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Leads</h1>
        <p className="text-muted-foreground">Mensagens recebidas pelo formulário do site.</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum lead ainda. Assim que alguém preencher o formulário, aparecerá aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((l) => (
            <div key={l.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-display text-lg font-semibold">{l.name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{l.email}</span>
                    {l.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{l.phone}</span>}
                    {l.service_interest && <span className="rounded-full bg-secondary px-2 py-0.5">{l.service_interest}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium capitalize">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => remove(l.id)} className="rounded-lg border border-destructive/40 px-2.5 py-1.5 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-secondary/50 p-3 text-sm">{l.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(l.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
