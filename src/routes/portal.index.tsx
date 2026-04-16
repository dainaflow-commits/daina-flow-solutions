import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FolderKanban, MessageSquare, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/portal/")({
  head: () => ({ meta: [{ title: "Meu Portal — Daina Flow" }] }),
  component: () => <PortalLayout><PortalHome /></PortalLayout>,
});

function PortalHome() {
  const { fullName } = useAuth();
  const [stats, setStats] = useState({ projects: 0, active: 0, messages: 0 });

  useEffect(() => {
    (async () => {
      const { data: projs } = await supabase.from("projects").select("id,status");
      const { count: msgs } = await supabase.from("project_messages").select("id", { count: "exact", head: true });
      setStats({
        projects: projs?.length ?? 0,
        active: projs?.filter((p) => p.status === "em_andamento").length ?? 0,
        messages: msgs ?? 0,
      });
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-brand p-8 text-primary-foreground shadow-elegant md:p-10">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Sparkles className="h-4 w-4" /> Bem-vindo(a) de volta
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
          Olá, {fullName?.split(" ")[0] ?? "Cliente"}!
        </h1>
        <p className="mt-2 max-w-xl opacity-90">
          Acompanhe aqui o andamento dos seus projetos, converse comigo no chat interno e veja o kanban em tempo real.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Projetos" value={stats.projects} />
        <StatCard label="Em andamento" value={stats.active} accent />
        <StatCard label="Mensagens trocadas" value={stats.messages} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard to="/portal/projetos" icon={<FolderKanban className="h-5 w-5" />} title="Meus projetos" desc="Veja status, kanban e detalhes de cada projeto." />
        <ActionCard to="/portal/chat" icon={<MessageSquare className="h-5 w-5" />} title="Chat com a Larissa" desc="Tire dúvidas e acompanhe atualizações em tempo real." />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-card ${accent ? "ring-2 ring-primary/30" : ""}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-smooth hover:border-primary/40 hover:shadow-elegant">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">{icon}</span>
        <div>
          <p className="font-display text-lg font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
