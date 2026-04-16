import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FolderKanban, Calendar, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/projetos")({
  head: () => ({ meta: [{ title: "Meus Projetos — Daina Flow" }] }),
  component: () => <PortalLayout><Projects /></PortalLayout>,
});

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  due_date: string | null;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  em_andamento: { label: "Em andamento", className: "bg-primary/10 text-primary" },
  concluido: { label: "Concluído", className: "bg-emerald-500/10 text-emerald-600" },
  pausado: { label: "Pausado", className: "bg-amber-500/10 text-amber-600" },
  planejamento: { label: "Planejamento", className: "bg-secondary text-secondary-foreground" },
};

function Projects() {
  const [list, setList] = useState<Project[] | null>(null);

  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setList(data ?? []));
  }, []);

  if (!list) return <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Meus projetos</h1>
        <p className="text-muted-foreground">Acompanhe o status e o kanban de cada projeto.</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nenhum projeto ainda</p>
          <p className="text-sm text-muted-foreground">A Larissa criará seus projetos por aqui em breve.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.em_andamento;
            return (
              <Link
                key={p.id}
                to="/portal/projetos/$projectId"
                params={{ projectId: p.id }}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-smooth hover:border-primary/40 hover:shadow-elegant"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}>
                      {st.label}
                    </span>
                    <h2 className="mt-2 font-display text-lg font-semibold">{p.title}</h2>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                {(p.start_date || p.due_date) && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {p.start_date && <span>Início: {new Date(p.start_date).toLocaleDateString("pt-BR")}</span>}
                    {p.due_date && <span>· Entrega: {new Date(p.due_date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
