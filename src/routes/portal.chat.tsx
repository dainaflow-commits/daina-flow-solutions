import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/chat")({
  head: () => ({ meta: [{ title: "Chat — Daina Flow" }] }),
  component: () => <PortalLayout><ChatPage /></PortalLayout>,
});

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

function ChatPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[] | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("projects").select("id,title,status").order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects(data ?? []);
        if (data && data.length && !activeProject) setActiveProject(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!activeProject) return;
    supabase.from("project_messages").select("*").eq("project_id", activeProject)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) ?? []));

    const channel = supabase
      .channel(`msgs-${activeProject}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${activeProject}` },
        (payload) => setMessages((m) => [...m, payload.new as Message]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeProject]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || !activeProject || !user) return;
    setSending(true);
    const { error } = await supabase.from("project_messages").insert({
      project_id: activeProject,
      sender_id: user.id,
      sender_role: "client",
      content: text.trim(),
    });
    setSending(false);
    if (error) toast.error(error.message);
    else setText("");
  }

  if (!projects) return <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-semibold">Sem projetos ativos</p>
        <p className="text-sm text-muted-foreground">O chat fica disponível quando houver um projeto em aberto com a Larissa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Chat com a Larissa</h1>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <aside className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-card">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-smooth ${
                activeProject === p.id ? "bg-gradient-brand text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              <p className="truncate font-medium">{p.title}</p>
              <p className={`truncate text-xs ${activeProject === p.id ? "opacity-90" : "text-muted-foreground"}`}>
                {p.status === "em_andamento" ? "Em andamento" : p.status}
              </p>
            </button>
          ))}
        </aside>

        <div className="flex h-[60vh] flex-col rounded-2xl border border-border bg-card shadow-card">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">
                Mande a primeira mensagem 👋
              </p>
            )}
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-gradient-brand text-primary-foreground" : "bg-secondary"
                  }`}>
                    <p className="text-[11px] font-semibold opacity-80">
                      {m.sender_role === "admin" ? "Larissa" : "Você"}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
            <button
              type="submit" disabled={sending || !text.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-elegant disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
