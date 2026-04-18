import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Save, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/portfolio")({
  head: () => ({ meta: [{ title: "Portfólio — Admin" }] }),
  component: () => <DashboardLayout><AdminPortfolio /></DashboardLayout>,
});

interface Item {
  id: string; title: string; description: string | null; category: string | null;
  cover_url: string | null; link_url: string | null; active: boolean; display_order: number;
}

function AdminPortfolio() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    const { data } = await supabase.from("portfolio_items").select("*").order("display_order");
    setItems((data as Item[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const { data, error } = await supabase.from("portfolio_items")
      .insert({ title: "Novo case", display_order: items.length, active: false })
      .select("*").single();
    if (error) return toast.error(error.message);
    setItems((p) => [...p, data as Item]);
  }

  function update(id: string, patch: Partial<Item>) {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function save(it: Item) {
    const { error } = await supabase.from("portfolio_items").update({
      title: it.title, description: it.description, category: it.category,
      cover_url: it.cover_url, link_url: it.link_url, active: it.active,
    }).eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Case salvo");
  }

  async function remove(id: string) {
    if (!confirm("Excluir este case?")) return;
    await supabase.from("portfolio_items").delete().eq("id", id);
    setItems((p) => p.filter((x) => x.id !== id));
  }

  async function uploadCover(id: string, file: File) {
    const ext = file.name.split(".").pop();
    const path = `${id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("portfolio").upload(path, file, { upsert: true });
    if (upErr) return toast.error(upErr.message);
    const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
    update(id, { cover_url: data.publicUrl });
    await supabase.from("portfolio_items").update({ cover_url: data.publicUrl }).eq("id", id);
    toast.success("Imagem enviada");
  }

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Portfólio</h1>
          <p className="text-sm text-muted-foreground">Cases que aparecem em <code className="rounded bg-secondary px-1">/portfolio</code>.</p>
        </div>
        <button onClick={add} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant">
          <Plus className="h-4 w-4" /> Novo case
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          Nenhum case ainda. Clique em "Novo case" para começar.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((it) => (
            <article key={it.id} className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                {it.cover_url ? (
                  <img src={it.cover_url} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-20 w-28 shrink-0 place-items-center rounded-lg bg-secondary text-xs text-muted-foreground">Sem capa</div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="file" accept="image/*" hidden
                    ref={(el) => { fileRefs.current[it.id] = el; }}
                    onChange={(e) => e.target.files?.[0] && uploadCover(it.id, e.target.files[0])}
                  />
                  <button onClick={() => fileRefs.current[it.id]?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold">
                    <Upload className="h-3 w-3" /> {it.cover_url ? "Trocar capa" : "Enviar capa"}
                  </button>
                  <button onClick={() => update(it.id, { active: !it.active })} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold ${it.active ? "border-green-500/40 bg-green-500/10 text-green-700" : "border-border text-muted-foreground"}`}>
                    {it.active ? <><Eye className="h-3 w-3" /> Publicado</> : <><EyeOff className="h-3 w-3" /> Oculto</>}
                  </button>
                </div>
              </div>
              <input value={it.title} onChange={(e) => update(it.id, { title: e.target.value })} placeholder="Título" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
              <input value={it.category ?? ""} onChange={(e) => update(it.id, { category: e.target.value })} placeholder="Categoria (ex.: People Analytics)" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
              <textarea value={it.description ?? ""} onChange={(e) => update(it.id, { description: e.target.value })} rows={3} placeholder="Descrição" className="w-full rounded-lg border border-input bg-background p-3 text-sm" />
              <input value={it.link_url ?? ""} onChange={(e) => update(it.id, { link_url: e.target.value })} placeholder="Link (opcional)" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
              <div className="flex justify-between gap-2 pt-1">
                <button onClick={() => remove(it.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
                <button onClick={() => save(it)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-brand px-4 text-xs font-semibold text-primary-foreground shadow-elegant">
                  <Save className="h-3.5 w-3.5" /> Salvar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
