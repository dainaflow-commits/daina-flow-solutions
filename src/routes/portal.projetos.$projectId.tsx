import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { KanbanBoard } from "@/components/portal/KanbanBoard";

export const Route = createFileRoute("/portal/projetos/$projectId")({
  head: () => ({ meta: [{ title: "Projeto — Daina Flow" }] }),
  component: () => <PortalLayout><ProjectDetail /></PortalLayout>,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle()
      .then(({ data }) => setProject(data));
  }, [projectId]);

  if (!project) return <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Link to="/portal/projetos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{project.title}</h1>
          {project.description && <p className="mt-2 max-w-2xl text-muted-foreground">{project.description}</p>}
        </div>
        <Link
          to="/portal/chat"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant"
        >
          <MessageSquare className="h-4 w-4" /> Chat
        </Link>
      </div>

      <KanbanBoard projectId={projectId} readOnly />
    </div>
  );
}
