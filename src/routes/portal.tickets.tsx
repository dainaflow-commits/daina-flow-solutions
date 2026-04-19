import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Send, Inbox, Plus } from "lucide-react";

export const Route = createFileRoute("/portal/tickets")({
  head: () => ({ meta: [{ title: "Meus tickets — Daina Flow" }] }),
  component: () => <PortalLayout><ClientTickets /></PortalLayout>,
});

interface Ticket {
  id: string; type: string; subject: string; description: string; status: string; created_at: string;
}
interface Msg { id: string; sender_role: string; content: string; created_at: string }

const STATUS_COLOR: Record<string, string> = {
  aberto: "bg-blue-500/10 text-blue-600",
  em_analise: "bg-amber-500/10 text-amber-600",
  resolvido: "bg-green-500/10 text-green-600",
  fechado: "bg-muted text-muted-foreground",
};

function ClientTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [active, setActive] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ type: "duvida", subject: "", description: "" });

  async function load() {
    const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!active) return;
    supabase.from("ticket_messages").select("*").eq("ticket_id", active.id).order("created_at")
      .then(({ data }) => setMessages((data as Msg[]) ?? []));
    const ch = supabase.channel(`tkc-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${active.id}` },
        (p) => setMessages((m) => [...m, p.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  async function createTicket() {
    if (!user || !form.subject.trim() || !form.description.trim()) {
      toast.error("Preencha assunto e descrição"); return;
    }
    const { error } = await supabase.from("tickets").insert({
      user_id: user.id, type: form.type, subject: form.subject, description: form.description, source: "portal",
    });
    if (error) toast.error(error.message);
    else { toast.success("Ticket aberto!"); setShowNew(false); setForm({ type: "duvida", subject: "", description: "" }); load(); }
  }

  async function send() {
    if (!reply.trim() || !active || !user) return;
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: active.id, sender_id: user.id, sender_role: "client", content: reply.trim(),
    });
    if (error) toast.error(error.message); else setReply("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Meus tickets</h1>
          <p className="text-muted-foreground">Reclamações, sugestões, dúvidas e bugs.</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo ticket
        </button>
      </div>

      {showNew && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-semibold">Abrir novo ticket</h2>
          <div className="grid gap-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="duvida">Dúvida</option>
              <option value="reclamacao">Reclamação</option>
              <option value="sugestao">Sugestão</option>
              <option value="bug">Erro técnico</option>
            </select>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Assunto" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4} placeholder="Descreva em detalhes…" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancelar</button>
              <button onClick={createTicket} className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground">Abrir</button>
            </div>
          </div>
        </div>
      )}

      {!tickets ? <Loader2 className="h-6 w-6 animate-spin" /> : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Você ainda não tem tickets</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-2">
            {tickets.map((t) => (
              <button key={t.id} onClick={() => setActive(t)}
                className={`block w-full rounded-xl border p-4 text-left ${active?.id === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase">{t.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[t.status]}`}>{t.status.replace("_", " ")}</span>
                </div>
                <p className="mt-1 truncate font-semibold">{t.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
              </button>
            ))}
          </div>

          {active ? (
            <div className="flex h-[60vh] flex-col rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border p-4">
                <h2 className="font-display text-lg font-bold">{active.subject}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{active.description}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "client" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.sender_role === "client" ? "bg-gradient-brand text-primary-foreground" : "bg-secondary"}`}>
                      <p className="text-[10px] font-semibold opacity-80">{m.sender_role === "client" ? "Você" : "Larissa"}</p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Aguardando resposta da Larissa.</p>}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-3">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Adicionar mensagem…"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ring-ring" />
                <button type="submit" disabled={!reply.trim()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-sm text-muted-foreground">
              Selecione um ticket
            </div>
          )}
        </div>
      )}
    </div>
  );
}
