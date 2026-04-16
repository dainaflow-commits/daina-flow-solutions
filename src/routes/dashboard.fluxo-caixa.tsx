import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { DollarSign } from "lucide-react";

export const Route = createFileRoute("/dashboard/fluxo-caixa")({
  head: () => ({ meta: [{ title: "Fluxo de Caixa — Admin" }] }),
  component: () => <DashboardLayout><Placeholder /></DashboardLayout>,
});

function Placeholder() {
  return (
    <div className="grid h-[60vh] place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <DollarSign className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Fluxo de Caixa</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Em breve: registro de entradas/saídas, projeção mensal e gráficos por categoria. Diga quais campos quer começar.
        </p>
      </div>
    </div>
  );
}
