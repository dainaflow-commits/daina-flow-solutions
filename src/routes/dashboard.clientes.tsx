import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, Phone, Building2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/dashboard/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Admin" }] }),
  component: () => <DashboardLayout><Clients /></DashboardLayout>,
});

const clientSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

interface ClientRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
}

function Clients() {
  const [list, setList] = useState<ClientRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", notes: "" });

  async function load() {
    const { data } = await supabase
      .from("clients")
      .select("id, full_name, email, phone, company, notes, created_at")
      .order("created_at", { ascending: false });
    setList((data as ClientRow[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function addClient() {
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setSaving(false); toast.error("Sessão expirada"); return; }
    const { error } = await supabase.from("clients").insert([{
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      notes: parsed.data.notes || null,
      user_id: uid,
    }]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente adicionado");
    setForm({ full_name: "", email: "", phone: "", company: "", notes: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este cliente? Propostas e contratos vinculados serão afetados.")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setList((prev) => prev?.filter((c) => c.id !== id) ?? null);
    toast.success("Cliente removido");
  }

  if (!list) return <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Cadastre e organize seus clientes manualmente.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">Novo cliente</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Nome completo *" maxLength={120}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          />
          <input
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="E-mail *" type="email" maxLength={160}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          />
          <input
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Telefone / WhatsApp" maxLength={40}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          />
          <input
            value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Empresa" maxLength={120}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          />
          <textarea
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas internas (opcional)" rows={3} maxLength={2000}
            className="md:col-span-2 rounded-xl border border-input bg-background p-3 text-sm"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={addClient} disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar cliente
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Todos os clientes ({list.length})</h2>
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">Nenhum cliente ainda</p>
            <p className="text-sm text-muted-foreground">Use o formulário acima para adicionar o primeiro.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-semibold">{c.full_name}</p>
                  <button
                    onClick={() => remove(c.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {c.email}</p>
                  {c.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {c.phone}</p>}
                  {c.company && <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {c.company}</p>}
                </div>
                {c.notes && <p className="mt-3 rounded-lg bg-secondary p-3 text-xs">{c.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
