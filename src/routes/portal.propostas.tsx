import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, FileText } from "lucide-react";

export const Route = createFileRoute("/portal/propostas")({
  head: () => ({ meta: [{ title: "Propostas — Daina Flow" }] }),
  component: () => <PortalLayout><ClientProposals /></PortalLayout>,
});

interface Proposal { id: string; title: string; status: string; total: number; valid_until: string | null; created_at: string; }

const STATUS_LABEL: Record<string, string> = { rascunho: "Rascunho", enviada: "Aguardando", aceita: "Aceita", recusada: "Recusada", expirada: "Expirada" };
const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviada: "bg-blue-500/10 text-blue-600",
  aceita: "bg-green-500/10 text-green-600",
  recusada: "bg-destructive/10 text-destructive",
  expirada: "bg-orange-500/10 text-orange-600",
};

function ClientProposals() {
  const { user } = useAuth();
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: client } = await supabase.from("clients").select("id").eq("user_id", user.id).maybeSingle();
      if (!client) { setLoading(false); return; }
      const { data } = await supabase
        .from("proposals")
        .select("*")
        .eq("client_id", client.id)
        .neq("status", "rascunho")
        .order("created_at", { ascending: false });
      setList((data as Proposal[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Propostas</h1>
        <p className="text-sm text-muted-foreground">Veja, baixe em PDF e aceite suas propostas comerciais.</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />
          Você ainda não recebeu propostas.
        </div>
      ) : (
        <ul className="grid gap-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link to="/portal/propostas/$id" params={{ id: p.id }} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-smooth hover:border-primary/40">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Recebida em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    {p.valid_until && ` · Válida até ${new Date(p.valid_until).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <span className="font-semibold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p.total) || 0)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
