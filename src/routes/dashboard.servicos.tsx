import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Eye, EyeOff, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { ICON_OPTIONS, getIcon } from "@/lib/icon-map";

export const Route = createFileRoute("/dashboard/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Daina Flow Admin" }] }),
  component: () => <DashboardLayout><ServicesAdmin /></DashboardLayout>,
});

interface FAQ { q: string; a: string }
interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  long_description: string | null;
  icon: string;
  display_order: number;
  active: boolean;
  price_text: string | null;
  duration_estimate: string | null;
  hero_image_url: string | null;
  target_audience: string[];
  deliverables: string[];
  tags: string[];
  faq: FAQ[];
}

const empty: Partial<Service> = {
  long_description: "",
  duration_estimate: "",
  hero_image_url: "",
  target_audience: [],
  deliverables: [],
  tags: [],
  faq: [],
};

function asArr(v: unknown): string[] { return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; }
function asFaq(v: unknown): FAQ[] {
  return Array.isArray(v) ? v.filter((x): x is FAQ => !!x && typeof (x as FAQ).q === "string" && typeof (x as FAQ).a === "string") : [];
}

function ServicesAdmin() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("display_order");
    const mapped = (data ?? []).map((d: any) => ({
      ...empty, ...d,
      target_audience: asArr(d.target_audience),
      deliverables: asArr(d.deliverables),
      tags: asArr(d.tags),
      faq: asFaq(d.faq),
    })) as Service[];
    setItems(mapped);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addNew() {
    const { error } = await supabase.from("services").insert({
      title: "Novo serviço",
      description: "Descrição breve",
      icon: "sparkles",
      display_order: items.length + 1,
    } as any);
    if (error) toast.error(error.message); else { toast.success("Serviço criado"); load(); }
  }

  function patch(id: string, p: Partial<Service>) {
    setItems((curr) => curr.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  async function save(s: Service) {
    const { error } = await supabase.from("services").update({
      title: s.title,
      description: s.description,
      long_description: s.long_description,
      icon: s.icon,
      display_order: s.display_order,
      active: s.active,
      price_text: s.price_text || null,
      duration_estimate: s.duration_estimate || null,
      hero_image_url: s.hero_image_url || null,
      target_audience: s.target_audience as any,
      deliverables: s.deliverables as any,
      tags: s.tags as any,
      faq: s.faq as any,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Cards do site + página detalhada (/servicos/slug).</p>
        </div>
        <div className="flex gap-2">
          <Link to="/servicos" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium">
            <ExternalLink className="h-4 w-4" /> Ver catálogo público
          </Link>
          <button onClick={addNew} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant">
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>
      </div>

      {loading ? <p className="text-muted-foreground">Carregando…</p> : (
        <div className="space-y-4">
          {items.map((s) => {
            const Icon = getIcon(s.icon);
            const open = openId === s.id;
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card shadow-card">
                {/* HEADER LINHA */}
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand-soft">
                    <Icon className="h-5 w-5 text-[color:var(--accent-violet)]" />
                  </span>
                  <input
                    value={s.title}
                    onChange={(e) => patch(s.id, { title: e.target.value })}
                    className="min-w-[180px] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold"
                  />
                  <code className="rounded bg-muted px-2 py-1 text-xs">/{s.slug}</code>
                  <button
                    onClick={() => patch(s.id, { active: !s.active })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                  >
                    {s.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {s.active ? "Ativo" : "Oculto"}
                  </button>
                  <button onClick={() => setOpenId(open ? null : s.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs">
                    {open ? <><ChevronUp className="h-3.5 w-3.5" /> Recolher</> : <><ChevronDown className="h-3.5 w-3.5" /> Editar tudo</>}
                  </button>
                  <button onClick={() => save(s)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-xs font-semibold text-primary-foreground">
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </button>
                  <button onClick={() => remove(s.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {open && (
                  <div className="space-y-4 border-t border-border p-4">
                    <Field label="Descrição curta (card do site, 1-2 linhas)">
                      <textarea rows={2} value={s.description} onChange={(e) => patch(s.id, { description: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    </Field>

                    <Field label="Descrição longa (markdown — aparece na página detalhada)">
                      <textarea rows={8} value={s.long_description ?? ""} onChange={(e) => patch(s.id, { long_description: e.target.value })}
                        placeholder="## O que está incluso&#10;Detalhe aqui o que você entrega, metodologia, ferramentas…"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs" />
                    </Field>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Preço (texto livre)">
                        <input value={s.price_text ?? ""} placeholder="Ex: A partir de R$ 1.500"
                          onChange={(e) => patch(s.id, { price_text: e.target.value })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                      </Field>
                      <Field label="Duração estimada">
                        <input value={s.duration_estimate ?? ""} placeholder="Ex: 2 a 4 semanas"
                          onChange={(e) => patch(s.id, { duration_estimate: e.target.value })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                      </Field>
                      <Field label="Ícone">
                        <select value={s.icon} onChange={(e) => patch(s.id, { icon: e.target.value })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </Field>
                      <Field label="Ordem de exibição">
                        <input type="number" value={s.display_order}
                          onChange={(e) => patch(s.id, { display_order: +e.target.value })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                      </Field>
                      <Field label="Imagem de capa (URL)">
                        <input value={s.hero_image_url ?? ""} onChange={(e) => patch(s.id, { hero_image_url: e.target.value })}
                          placeholder="https://…" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                      </Field>
                      <Field label="Tags (busca) — separe por vírgula">
                        <input value={s.tags.join(", ")} onChange={(e) => patch(s.id, { tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                          placeholder="rh, dashboard, automação"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                      </Field>
                    </div>

                    <ListEditor label="Para quem é" items={s.target_audience} onChange={(v) => patch(s.id, { target_audience: v })}
                      placeholder="Ex: Empresas de RH com dados em planilhas" />
                    <ListEditor label="Entregáveis" items={s.deliverables} onChange={(v) => patch(s.id, { deliverables: v })}
                      placeholder="Ex: Dashboard interativo no Power BI" />

                    <FAQEditor items={s.faq} onChange={(v) => patch(s.id, { faq: v })} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input value={it} onChange={(e) => onChange(items.map((x, idx) => idx === i ? e.target.value : x))}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="rounded-lg border border-destructive/40 px-2 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ""])} placeholder={placeholder}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs">
          <Plus className="h-3 w-3" /> Adicionar item
        </button>
      </div>
    </Field>
  );
}

function FAQEditor({ items, onChange }: { items: FAQ[]; onChange: (v: FAQ[]) => void }) {
  return (
    <Field label="Perguntas frequentes">
      <div className="space-y-3">
        {items.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-3">
            <input value={f.q} placeholder="Pergunta"
              onChange={(e) => onChange(items.map((x, idx) => idx === i ? { ...x, q: e.target.value } : x))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold" />
            <textarea value={f.a} placeholder="Resposta" rows={2}
              onChange={(e) => onChange(items.map((x, idx) => idx === i ? { ...x, a: e.target.value } : x))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-xs text-destructive hover:underline">Remover</button>
          </div>
        ))}
        <button onClick={() => onChange([...items, { q: "", a: "" }])}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs">
          <Plus className="h-3 w-3" /> Adicionar FAQ
        </button>
      </div>
    </Field>
  );
}
