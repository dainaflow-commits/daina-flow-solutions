import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/icon-map";

export const Route = createFileRoute("/dashboard/resultados")({
  component: () => <DashboardLayout><StatsAdmin /></DashboardLayout>,
});

interface Stat { id: string; label: string; value: string; suffix: string | null; icon: string | null; display_order: number; active: boolean; }

function StatsAdmin() {
  const [items, setItems] = useState<Stat[]>([]);

  async function load() {
    const { data } = await supabase.from("results_stats").select("*").order("display_order");
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const { error } = await supabase.from("results_stats").insert({
      label: "Novo número", value: "0", suffix: "+", icon: "trending-up", display_order: items.length + 1,
    });
    if (error) toast.error(error.message); else { toast.success("Adicionado"); load(); }
  }
  async function save(s: Stat) {
    const { error } = await supabase.from("results_stats").update({
      label: s.label, value: s.value, suffix: s.suffix, icon: s.icon, active: s.active, display_order: s.display_order,
    }).eq("id", s.id);
    if (error) toast.error(error.message); else toast.success("Salvo");
  }
  async function remove(id: string) {
    if (!confirm("Excluir?")) return;
    await supabase.from("results_stats").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Resultados</h1>
          <p className="text-muted-foreground">Edite os números exibidos na seção de resultados.</p>
        </div>
        <button onClick={add} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((s, idx) => (
          <div key={s.id} className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-card">
            <input value={s.label} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold" placeholder="Rótulo" />
            <div className="grid grid-cols-3 gap-2">
              <input value={s.value} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Valor" />
              <input value={s.suffix ?? ""} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, suffix: e.target.value } : x))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Sufixo" />
              <select value={s.icon ?? "trending-up"} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, icon: e.target.value } : x))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {ICON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex justify-between">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={s.active} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, active: e.target.checked } : x))} /> Visível</label>
              <div className="flex gap-2">
                <button onClick={() => remove(s.id)} className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => save(s)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-xs font-semibold text-primary-foreground"><Save className="h-3.5 w-3.5" /> Salvar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
