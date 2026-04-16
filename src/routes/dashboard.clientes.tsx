import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, Phone, Building2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/clientes")({
  component: () => <DashboardLayout><Clients /></DashboardLayout>,
});

function Clients() {
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("clients").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setList(data ?? []));
  }, []);

  if (!list) return <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Todos os clientes cadastrados.</p>
      </div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nenhum cliente ainda</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="font-display text-lg font-semibold">{c.full_name}</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {c.email}</p>
                {c.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {c.phone}</p>}
                {c.company && <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {c.company}</p>}
              </div>
              {c.notes && <p className="mt-3 rounded-lg bg-secondary p-3 text-xs">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
