import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, BellOff, Bell, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Daina Flow" }] }),
  component: () => <PortalLayout><NotificationsPage /></PortalLayout>,
});

interface Notif {
  id: string; title: string; message: string | null; link: string | null;
  read: boolean; type: string; created_at: string;
}

interface Prefs {
  user_id: string;
  inapp_messages: boolean; inapp_project_status: boolean; inapp_proposals: boolean;
  email_messages: boolean; email_project_status: boolean; email_proposals: boolean;
}

const DEFAULT_PREFS: Omit<Prefs, "user_id"> = {
  inapp_messages: true, inapp_project_status: true, inapp_proposals: true,
  email_messages: true, email_project_status: true, email_proposals: true,
};

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: notifs }, { data: pref }] = await Promise.all([
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setItems((notifs as Notif[]) ?? []);
      setPrefs((pref as Prefs) ?? { user_id: user.id, ...DEFAULT_PREFS });
      setLoading(false);
    })();
  }, [user]);

  async function togglePref(key: keyof Omit<Prefs, "user_id">) {
    if (!prefs || !user) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await supabase.from("notification_preferences").upsert({ ...next, user_id: user.id });
    toast.success("Preferências salvas");
  }

  async function removeNotif(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Notificações</h1>
        <p className="text-sm text-muted-foreground">Acompanhe atualizações e gerencie suas preferências.</p>
      </div>

      {prefs && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Preferências</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {([
              ["inapp_messages", "Sino: novas mensagens"],
              ["email_messages", "Email: novas mensagens"],
              ["inapp_project_status", "Sino: status de projeto"],
              ["email_project_status", "Email: status de projeto"],
              ["inapp_proposals", "Sino: propostas"],
              ["email_proposals", "Email: propostas"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
                <span>{label}</span>
                <input type="checkbox" checked={prefs[k]} onChange={() => togglePref(k)} className="h-4 w-4 accent-primary" />
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold">Histórico</h2>
        </div>
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            <BellOff className="mx-auto mb-3 h-8 w-8 opacity-50" />
            Nenhuma notificação por enquanto.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const Inner = (
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-muted" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); removeNotif(n.id); }} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
              return (
                <li key={n.id} className="px-6 py-4">
                  {n.link ? <Link to={n.link} className="block">{Inner}</Link> : Inner}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
