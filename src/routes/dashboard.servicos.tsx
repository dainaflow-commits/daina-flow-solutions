import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { ICON_OPTIONS, getIcon } from "@/lib/icon-map";

export const Route = createFileRoute("/dashboard/servicos")({
  component: () => <DashboardLayout><ServicesAdmin /></DashboardLayout>,
});

interface Service { id: string; title: string; description: string; icon: string; display_order: number; active: boolean; }

function ServicesAdmin() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("display_order");
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addNew() {
    const { error } = await supabase.from("services").insert({
      title: "Novo serviço", description: "Descrição", icon: "sparkles",
      display_order: items.length + 1,
    });
    if (error) toast.error(error.message); else { toast.success("Serviço criado"); load(); }
  }

  async function update(s: Service) {
    const { error } = await supabase.from("services").update({
      title: s.title, description: s.description, icon: s.icon,
      display_order: s.display_order, active: s.active,
    }).eq("id", s.id);
    if (error) toast.error(error.message); else toast.success("Salvo");
  }

  async function remove(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); load(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços exibidos no site.</p>
        </div>
        <button onClick={addNew} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>
      {loading ? (<p className="text-muted-foreground">Carregando…</p>) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((s, idx) => {
            const Icon = getIcon(s.icon);
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand-soft">
                    <Icon className="h-5 w-5 text-[color:var(--accent-violet)]" />
                  </span>
                  <input
                    value={s.title}
                    onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold"
                  />
                </div>
                <textarea
                  value={s.description} rows={3}
                  onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={s.icon}
                    onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, icon: e.target.value } : x))}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input type="number" value={s.display_order}
                    onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, display_order: +e.target.value } : x))}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setItems(items.map((x, i) => i === idx ? { ...x, active: !x.active } : x))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                  >
                    {s.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {s.active ? "Ativo" : "Oculto"}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => remove(s.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </button>
                    <button onClick={() => update(s)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-xs font-semibold text-primary-foreground">
                      <Save className="h-3.5 w-3.5" /> Salvar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
