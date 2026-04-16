import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Inbox, MessageSquareQuote, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Painel — Daina Flow" }] }),
  component: () => <DashboardLayout><DashboardHome /></DashboardLayout>,
});

function DashboardHome() {
  const [stats, setStats] = useState({ services: 0, leads: 0, newLeads: 0, testimonials: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("services").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
      supabase.from("testimonials").select("id", { count: "exact", head: true }),
    ]).then(([s, l, nl, t]) => setStats({
      services: s.count ?? 0,
      leads: l.count ?? 0,
      newLeads: nl.count ?? 0,
      testimonials: t.count ?? 0,
    }));
  }, []);

  const cards = [
    { label: "Serviços ativos", value: stats.services, icon: Briefcase },
    { label: "Total de leads", value: stats.leads, icon: Inbox },
    { label: "Leads novos", value: stats.newLeads, icon: BarChart3 },
    { label: "Depoimentos", value: stats.testimonials, icon: MessageSquareQuote },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Olá, Larissa! 👋</h1>
        <p className="text-muted-foreground">Aqui está um resumo do que está acontecendo no seu site.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand-soft">
                <c.icon className="h-4 w-4 text-[color:var(--accent-violet)]" />
              </span>
            </div>
            <p className="font-display text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-gradient-brand p-6 text-primary-foreground shadow-elegant">
        <h2 className="font-display text-xl font-bold">Próximos passos</h2>
        <ul className="mt-3 space-y-1.5 text-sm opacity-95">
          <li>• Adicione seus depoimentos reais em <strong>Depoimentos</strong></li>
          <li>• Suba sua foto profissional em <strong>Configurações</strong></li>
          <li>• Acompanhe os leads recebidos pelo formulário</li>
          <li>• Edite os números da seção de resultados</li>
        </ul>
      </div>
    </div>
  );
}
