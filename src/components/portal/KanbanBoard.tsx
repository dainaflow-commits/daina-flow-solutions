import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const COLUMNS = [
  { key: "todo", label: "A fazer" },
  { key: "doing", label: "Em andamento" },
  { key: "review", label: "Em revisão" },
  { key: "done", label: "Concluído" },
];

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  column_key: string;
  position: number;
}

export function KanbanBoard({ projectId, readOnly = false }: { projectId: string; readOnly?: boolean }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    let active = true;
    supabase.from("project_tasks").select("*").eq("project_id", projectId)
      .order("column_key").order("position")
      .then(({ data }) => { if (active) setTasks((data as Task[]) ?? []); });

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_tasks", filter: `project_id=eq.${projectId}` },
        () => {
          supabase.from("project_tasks").select("*").eq("project_id", projectId)
            .order("column_key").order("position")
            .then(({ data }) => setTasks((data as Task[]) ?? []));
        })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [projectId]);

  async function moveTask(taskId: string, newColumn: string) {
    if (readOnly) return;
    const { error } = await supabase.from("project_tasks").update({ column_key: newColumn }).eq("id", taskId);
    if (error) toast.error(error.message);
  }

  async function addTask(column: string) {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("project_tasks").insert({
      project_id: projectId,
      title: newTitle.trim(),
      column_key: column,
    });
    if (error) toast.error(error.message);
    else { setNewTitle(""); setAdding(null); }
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from("project_tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
  }

  if (!tasks) return <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.column_key === col.key);
        return (
          <div
            key={col.key}
            className="rounded-2xl border border-border bg-card p-4 shadow-card"
            onDragOver={(e) => !readOnly && e.preventDefault()}
            onDrop={(e) => {
              if (readOnly) return;
              const id = e.dataTransfer.getData("text/plain");
              if (id) moveTask(id, col.key);
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-semibold">{col.label}</h3>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{colTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable={!readOnly}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                  className={`group rounded-xl border border-border bg-background p-3 text-sm shadow-sm ${!readOnly ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      {t.description && <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>}
                    </div>
                    {!readOnly && (
                      <button onClick={() => deleteTask(t.id)} className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Excluir">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!readOnly && (
                adding === col.key ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addTask(col.key); if (e.key === "Escape") { setAdding(null); setNewTitle(""); } }}
                      placeholder="Título da tarefa"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addTask(col.key)} className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground">Adicionar</button>
                      <button onClick={() => { setAdding(null); setNewTitle(""); }} className="text-xs text-muted-foreground">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAdding(col.key)} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
