import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "@/components/portal/KanbanBoard";
import { Plus, Loader2, Trash2, Calendar, DollarSign, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/projetos")({
  component: () => <DashboardLayout><AdminProjects /></DashboardLayout>,
});

const STATUS = [
  { v: "em_andamento", l: "Em andamento", c: "bg-blue-500/10 text-blue-600" },
  { v: "planejamento", l: "Planejamento", c: "bg-amber-500/10 text-amber-600" },
  { v: "pausado", l: "Pausado", c: "bg-orange-500/10 text-orange-600" },
  { v: "entregue", l: "Entregue", c: "bg-green-500/10 text-green-600" },
  { v: "cancelado", l: "Cancelado", c: "bg-destructive/10 text-destructive" },
];

const TEMPLATES = [
  { key: "consultoria", label: "Consultoria de dados", tasks: ["Briefing inicial", "Diagnóstico", "Relatório de recomendações", "Apresentação"] },
  { key: "dashboard", label: "Dashboard / BI", tasks: ["Coleta de fontes", "Modelagem de dados", "Wireframe do dashboard", "Implementação", "Validação", "Treinamento"] },
  { key: "automacao", label: "Automação Low-code", tasks: ["Mapeamento de processo", "Desenho da automação", "Construção", "Testes", "Go-live"] },
  { key: "vazio", label: "Em branco", tasks: [] },
];

function AdminProjects() {
  const [projects, setProjects] = useState<any[] | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    client_id: "", title: "", description: "", status: "em_andamento",
    start_date: "", due_date: "", budget: "", template: "vazio",
  });

  async function load() {
    const { data: p } = await supabase
      .from("projects")
      .select("*, clients(full_name,email)")
      .order("created_at", { ascending: false });
    setProjects(p ?? []);
    if (p && p.length && !activeId) setActiveId(p[0].id);
  }

  useEffect(() => {
    load();
    supabase.from("clients").select("id,full_name,email").order("full_name").then(({ data }) => setClients(data ?? []));
  }, []);

  async function createProject() {
    if (!form.client_id || !form.title.trim()) return toast.error("Cliente e título são obrigatórios");
    setCreating(true);
    const tpl = TEMPLATES.find((t) => t.key === form.template)!;
    const { data, error } = await supabase.from("projects").insert({
      client_id: form.client_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      budget: form.budget ? Number(form.budget) : null,
    }).select("id").single();
    if (error) { setCreating(false); return toast.error(error.message); }

    if (tpl.tasks.length > 0 && data) {
      await supabase.from("project_tasks").insert(
        tpl.tasks.map((t, i) => ({ project_id: data.id, title: t, column_key: "todo", position: i }))
      );
    }
    setCreating(false);
    toast.success("Projeto criado");
    setShowForm(false);
    setForm({ client_id: "", title: "", description: "", status: "em_andamento", start_date: "", due_date: "", budget: "", template: "vazio" });
    setActiveId(data?.id ?? null);
    load();
  }

  async function deleteProject(id: string) {
    if (!confirm("Excluir projeto e todas tarefas/mensagens?")) return;
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Excluído");
    setActiveId(null);
    load();
  }

  if (!projects) return <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const active = projects.find((p) => p.id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Gerencie projetos e o kanban de cada cliente.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant">
          <Plus className="h-4 w-4" /> Novo projeto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="font-display text-lg font-bold">Novo projeto</h2>
              <button onClick={() => setShowForm(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Cliente *</label>
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">Selecione…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Título *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Dashboard de RH — 2025" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Descrição</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-input bg-background p-3 text-sm" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    {STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold"><Calendar className="inline h-3.5 w-3.5" /> Início</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold"><Calendar className="inline h-3.5 w-3.5" /> Entrega</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold"><DollarSign className="inline h-3.5 w-3.5" /> Orçamento (R$)</label>
                  <input type="number" min={0} step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0,00" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold"><Sparkles className="inline h-3.5 w-3.5" /> Template de tarefas</label>
                  <select value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    {TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}{t.tasks.length ? ` (${t.tasks.length} tarefas)` : ""}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border p-5">
              <button onClick={() => setShowForm(false)} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">Cancelar</button>
              <button onClick={createProject} disabled={creating} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar projeto
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <aside className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-card">
          {projects.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhum projeto ainda.</p>}
          {projects.map((p) => {
            const st = STATUS.find((s) => s.v === p.status);
            return (
              <button key={p.id} onClick={() => setActiveId(p.id)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${activeId === p.id ? "bg-gradient-brand text-primary-foreground" : "hover:bg-secondary"}`}>
                <p className="truncate font-medium">{p.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={`truncate text-xs ${activeId === p.id ? "opacity-90" : "text-muted-foreground"}`}>{p.clients?.full_name}</span>
                  {st && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeId === p.id ? "bg-white/20" : st.c}`}>{st.l}</span>}
                </div>
              </button>
            );
          })}
        </aside>

        <div className="space-y-4">
          {active && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{active.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {active.clients?.full_name}
                    {active.due_date && ` · entrega em ${new Date(active.due_date).toLocaleDateString("pt-BR")}`}
                    {active.budget && ` · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(active.budget))}`}
                  </p>
                </div>
                <button onClick={() => deleteProject(active.id)} className="text-sm text-destructive hover:underline inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
              <KanbanBoard projectId={active.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
