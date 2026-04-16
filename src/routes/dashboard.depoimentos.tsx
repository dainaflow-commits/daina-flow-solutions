import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Star } from "lucide-react";

export const Route = createFileRoute("/dashboard/depoimentos")({
  component: () => <DashboardLayout><TestimonialsAdmin /></DashboardLayout>,
});

interface T { id: string; author_name: string; author_role: string | null; content: string; rating: number; active: boolean; display_order: number; }

function TestimonialsAdmin() {
  const [items, setItems] = useState<T[]>([]);

  async function load() {
    const { data } = await supabase.from("testimonials").select("*").order("display_order");
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const { error } = await supabase.from("testimonials").insert({
      author_name: "Nome do cliente", author_role: "Empresa / cargo",
      content: "Depoimento aqui...", rating: 5, display_order: items.length + 1,
    });
    if (error) toast.error(error.message); else { toast.success("Depoimento criado"); load(); }
  }

  async function save(t: T) {
    const { error } = await supabase.from("testimonials").update({
      author_name: t.author_name, author_role: t.author_role,
      content: t.content, rating: t.rating, active: t.active, display_order: t.display_order,
    }).eq("id", t.id);
    if (error) toast.error(error.message); else toast.success("Salvo");
  }

  async function remove(id: string) {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); load(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Depoimentos</h1>
          <p className="text-muted-foreground">Adicione depoimentos reais conforme forem chegando.</p>
        </div>
        <button onClick={add} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Nenhum depoimento ainda. Quando você receber, adicione aqui — eles aparecerão automaticamente no site (em breve, na próxima fase 😉).</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((t, idx) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={t.author_name} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, author_name: e.target.value } : x))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold" />
              <input value={t.author_role ?? ""} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, author_role: e.target.value } : x))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Cargo / empresa" />
            </div>
            <textarea value={t.content} rows={4} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, content: e.target.value } : x))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setItems(items.map((x, i) => i === idx ? { ...x, rating: n } : x))}>
                  <Star className={`h-5 w-5 ${n <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={t.active} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, active: e.target.checked } : x))} /> Visível</label>
              <div className="flex gap-2">
                <button onClick={() => remove(t.id)} className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => save(t)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-xs font-semibold text-primary-foreground"><Save className="h-3.5 w-3.5" /> Salvar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
