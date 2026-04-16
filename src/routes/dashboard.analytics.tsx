import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: () => <DashboardLayout><Placeholder /></DashboardLayout>,
});

function Placeholder() {
  return (
    <div className="grid h-[60vh] place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Em breve: visitas no site, conversão de leads, taxa de aceite de propostas e tempo médio por projeto.
        </p>
      </div>
    </div>
  );
}
