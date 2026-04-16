import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard/portfolio")({
  head: () => ({ meta: [{ title: "Portfólio — Admin" }] }),
  component: () => <DashboardLayout><Placeholder /></DashboardLayout>,
});

function Placeholder() {
  return (
    <div className="grid h-[60vh] place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <ImageIcon className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Portfólio</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Em breve: galeria de cases com imagens, descrição e link. Avise quando quiser começar a publicar.
        </p>
      </div>
    </div>
  );
}
