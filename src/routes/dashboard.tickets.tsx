import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard/tickets")({
  head: () => ({ meta: [{ title: "Tickets — Daina Flow Admin" }] }),
  component: () => <DashboardLayout><AdminTickets /></DashboardLayout>,
});

interface Ticket {
  id: string; type: string; subject: string; description: string;
  status: string; priority: string; source: string;
  user_id: string | null; guest_name: string | null; guest_email: string | null;
  created_at: string;
}
interface Msg { id: string; sender_role: string; content: string; created_at: string }

const STATUS = ["aberto", "em_analise", "resolvido", "fechado"];
const TYPE_LABEL: Record<string, string> = {
  reclamacao: "Reclamação", sugestao: "Sugestão", bug: "Erro técnico", duvida: "Dúvida",
};
const STATUS_COLOR: Record<string, string> = {
  aberto: "bg-blue-500/10 text-blue-600",
  em_analise: "bg-amber-500/10 text-amber-600",
  resolvido: "bg-green-500/10 text-green-600",
  fechado: "bg-muted text-muted-foreground",
};

function AdminTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [filter, setFilter] = useState<string>("todos");
  const [active, setActive] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");

  async function load() {
    const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!active) return;
    supabase.from("ticket_messages").select("*").eq("ticket_id", active.id).order("created_at")
      .then(({ data }) => setMessages((data as Msg[]) ?? []));
    const ch = supabase.channel(`tk-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${active.id}` },
        (p) => setMessages((m) => [...m, p.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  async function changeStatus(t: Ticket, status: string) {
    const { error } = await supabase.from("tickets").update({ status }).eq("id", t.id);
    if (error) toast.error(error.message);
    else { toast.success("Status atualizado"); load(); if (active?.id === t.id) setActive({ ...t, status }); }
  }

  async function send() {
    if (!reply.trim() || !active || !user) return;
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: active.id, sender_id: user.id, sender_role: "admin", content: reply.trim(),
    });
    if (error) toast.error(error.message); else setReply("");
  }

  const list = tickets?.filter((t) => filter === "todos" || t.status === filter) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Tickets</h1>
        <p className="text-muted-foreground">Reclamações, sugestões e erros enviados pelos clientes.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["todos", ...STATUS].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === s ? "bg-gradient-brand text-primary-foreground" : "bg-card border border-border"}`}>
            {s === "todos" ? "Todos" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {!tickets ? <Loader2 className="h-6 w-6 animate-spin" /> : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Sem tickets nessa categoria</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-2">
            {list.map((t) => (
              <button key={t.id} onClick={() => setActive(t)}
                className={`block w-full rounded-xl border p-4 text-left transition ${active?.id === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase">{TYPE_LABEL[t.type] ?? t.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[t.status]}`}>{t.status.replace("_", " ")}</span>
                </div>
                <p className="mt-1 truncate font-semibold">{t.subject}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{t.guest_name ?? "Cliente logado"} · {new Date(t.created_at).toLocaleString("pt-BR")}</p>
              </button>
            ))}
          </div>

          {active ? (
            <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border p-4">
                <p className="text-xs uppercase text-muted-foreground">{TYPE_LABEL[active.type] ?? active.type}</p>
                <h2 className="mt-1 font-display text-xl font-bold">{active.subject}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{active.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUS.map((s) => (
                    <button key={s} onClick={() => changeStatus(active, s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${active.status === s ? "bg-gradient-brand text-primary-foreground" : "border border-border"}`}>
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.sender_role === "admin" ? "bg-gradient-brand text-primary-foreground" : "bg-secondary"}`}>
                      <p className="text-[10px] font-semibold opacity-80">{m.sender_role === "admin" ? "Você" : "Cliente"}</p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Sem mensagens ainda.</p>}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-3">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Responder ao cliente…"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ring-ring" />
                <button type="submit" disabled={!reply.trim()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Selecione um ticket à esquerda
            </div>
          )}
        </div>
      )}
    </div>
  );
}
