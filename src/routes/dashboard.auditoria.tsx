import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { History } from "lucide-react";

export const Route = createFileRoute("/dashboard/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Admin" }] }),
  component: () => <DashboardLayout><Placeholder /></DashboardLayout>,
});

function Placeholder() {
  return (
    <div className="grid h-[60vh] place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <History className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Auditoria</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Em breve: log de ações importantes (login, mudanças de status, propostas aceitas, mensagens trocadas).
        </p>
      </div>
    </div>
  );
}
