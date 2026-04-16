import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/dashboard/calendario")({
  head: () => ({ meta: [{ title: "Calendário — Admin" }] }),
  component: () => <DashboardLayout><Placeholder /></DashboardLayout>,
});

function Placeholder() {
  return (
    <div className="grid h-[60vh] place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <Calendar className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Calendário</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Em breve: agenda de entregas, reuniões com clientes e marcos de projetos com lembretes.
        </p>
      </div>
    </div>
  );
}
