import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, FileSignature, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/portal/contratos")({
  head: () => ({ meta: [{ title: "Meus contratos — Daina Flow" }] }),
  component: () => <PortalLayout><ClientContracts /></PortalLayout>,
});

interface Contract {
  id: string; title: string; status: string; total: number; created_at: string;
  signed_at: string | null; sign_token: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Aguardando assinatura", assinado: "Assinado", recusado: "Recusado",
};
const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-blue-500/10 text-blue-600",
  assinado: "bg-green-500/10 text-green-600",
  recusado: "bg-destructive/10 text-destructive",
};

function ClientContracts() {
  const { user } = useAuth();
  const [list, setList] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: client } = await supabase.from("clients").select("id").eq("user_id", user.id).maybeSingle();
      if (!client) { setLoading(false); return; }
      const { data } = await supabase
        .from("contracts")
        .select("id, title, status, total, created_at, signed_at, sign_token")
        .eq("client_id", client.id)
        .neq("status", "rascunho")
        .order("created_at", { ascending: false });
      setList((data as Contract[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Meus contratos</h1>
        <p className="text-sm text-muted-foreground">Aqui ficam os contratos enviados para você.</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          <FileSignature className="mx-auto mb-3 h-8 w-8 opacity-50" />
          Nenhum contrato disponível ainda.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  {c.signed_at && ` · Assinado em ${new Date(c.signed_at).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(c.total) || 0)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
              {c.sign_token && (
                <a href={`/contrato/assinar/${c.sign_token}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-brand px-3 text-xs font-semibold text-primary-foreground shadow-elegant">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
