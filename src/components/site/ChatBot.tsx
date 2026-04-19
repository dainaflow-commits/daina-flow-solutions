import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, Ticket } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Msg { role: "user" | "assistant"; content: string }
interface ServiceCtx { title: string; description: string; tags: string[]; slug: string; price_text: string | null }

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;
const TICKET_RX = /\[OPEN_TICKET:([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/;

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Oi! Sou a **Flow** ✨\n\nPosso te ajudar com:\n• Dúvidas sobre serviços\n• Agendar conversa com a Larissa\n• Abrir um **ticket** (reclamação, sugestão ou erro técnico)\n\nO que você precisa hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [siteContext, setSiteContext] = useState<{ services: ServiceCtx[]; whatsapp?: string; email?: string }>({ services: [] });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("services").select("title,description,tags,slug,price_text").eq("active", true),
      supabase.from("site_settings").select("key,value").in("key", ["whatsapp_number", "contact_email"]),
    ]).then(([svc, set]) => {
      const m = Object.fromEntries((set.data ?? []).map((r) => [r.key, r.value ?? ""]));
      setSiteContext({
        services: ((svc.data ?? []) as any[]).map((s) => ({
          title: s.title, description: s.description, slug: s.slug,
          tags: Array.isArray(s.tags) ? s.tags : [], price_text: s.price_text ?? null,
        })),
        whatsapp: m.whatsapp_number, email: m.contact_email,
      });
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(forced?: string) {
    const text = (forced ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setStreaming(true);

    let assistantSoFar = "";
    const upsert = (delta: string) => {
      assistantSoFar += delta;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== messages[messages.length - 1]?.content) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), siteContext }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Muitas mensagens. Aguarde um momento.");
        else if (resp.status === 402) toast.error("Créditos de IA esgotados.");
        else toast.error("Não consegui responder agora.");
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsert(delta);
          } catch {
            buf = line + "\n" + buf; break;
          }
        }
      }

      // Lead capture
      if (assistantSoFar.includes("[LEAD_CAPTURED]")) {
        await captureLeadFromTranscript([...next, { role: "assistant", content: assistantSoFar }]);
      }
      // Ticket capture
      const tk = assistantSoFar.match(TICKET_RX);
      if (tk) {
        await openTicketFromAI(tk[1].trim(), tk[2].trim(), tk[3].trim(), next);
      }
      // Strip tags from displayed content
      if (assistantSoFar.includes("[LEAD_CAPTURED]") || tk) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: m.content.replace("[LEAD_CAPTURED]", "").replace(TICKET_RX, "").trim() }
              : m,
          ),
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro de conexão com a Flow.");
    } finally {
      setStreaming(false);
    }
  }

  async function captureLeadFromTranscript(history: Msg[]) {
    const transcript = history.map((m) => `${m.role === "user" ? "Cliente" : "Flow"}: ${m.content}`).join("\n");
    const email = transcript.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
    const phone = transcript.match(/(?:\+?\d{2}\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}/)?.[0];
    const nameMatch = transcript.match(/(?:sou|meu nome é|me chamo|aqui é o?a?)\s+([A-ZÁ-Ú][\wÀ-ÿ]+(?:\s[A-ZÁ-Ú][\wÀ-ÿ]+)?)/i);
    const name = nameMatch?.[1] ?? "Lead via Chatbot";
    await supabase.from("leads").insert({
      name, email: email ?? "sem-email@chatbot.local", phone: phone ?? null,
      service_interest: "Chatbot", message: transcript.slice(-1500),
    });
  }

  async function openTicketFromAI(rawType: string, subject: string, description: string, history: Msg[]) {
    const type = ["reclamacao", "sugestao", "bug", "duvida"].includes(rawType.toLowerCase())
      ? rawType.toLowerCase() : "duvida";
    const { data: { user } } = await supabase.auth.getUser();
    const transcript = history.map((m) => `${m.role}: ${m.content}`).join("\n").slice(-1000);
    const fullDesc = `${description}\n\n--- Conversa ---\n${transcript}`;

    if (user) {
      const { error } = await supabase.from("tickets").insert({
        user_id: user.id, type, subject, description: fullDesc, source: "chatbot",
      });
      if (error) toast.error("Não consegui registrar o ticket: " + error.message);
      else toast.success("Ticket aberto! Acompanhe em Meus tickets.");
    } else {
      // visitante: extrai email do transcript
      const email = history.map((m) => m.content).join(" ").match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
      if (!email) { toast.message("Pra finalizar o ticket, me passe seu e-mail."); return; }
      const { error } = await supabase.from("tickets").insert({
        type, subject, description: fullDesc, source: "chatbot",
        guest_email: email, guest_name: "Visitante",
      });
      if (error) toast.error("Erro: " + error.message);
      else toast.success("Ticket registrado! A Larissa vai te responder em breve.");
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        aria-label="Abrir chat com Flow"
        className="fixed bottom-24 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-elegant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
              <Sparkles className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full" style={{ background: "var(--accent-cyan)" }} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed bottom-44 right-6 z-50 flex h-[min(560px,calc(100vh-12rem))] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant"
          >
            <div className="flex items-center gap-3 border-b border-border bg-gradient-brand p-4 text-primary-foreground">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur"><Sparkles className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold">Flow · Daina Flow</p>
                <p className="flex items-center gap-1.5 text-xs opacity-90">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Online
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 p-4">
              {messages.map((m, i) => <Bubble key={i} role={m.role}>{m.content}</Bubble>)}
              {streaming && messages[messages.length - 1]?.role === "user" && (
                <Bubble role="assistant"><Loader2 className="h-4 w-4 animate-spin" /></Bubble>
              )}
            </div>

            {/* Atalhos de ticket */}
            <div className="flex flex-wrap gap-1.5 border-t border-border bg-card px-3 pt-2">
              <QuickBtn onClick={() => send("Quero abrir uma reclamação sobre o serviço")}>
                <Ticket className="h-3 w-3" /> Reclamação
              </QuickBtn>
              <QuickBtn onClick={() => send("Quero deixar uma sugestão para o site")}>💡 Sugestão</QuickBtn>
              <QuickBtn onClick={() => send("Encontrei um erro técnico no site")}>🐛 Bug</QuickBtn>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border bg-card p-3">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..." disabled={streaming}
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2 disabled:opacity-60"
              />
              <button type="submit" disabled={streaming || !input.trim()}
                className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-card disabled:opacity-50">
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function QuickBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-gradient-brand hover:text-primary-foreground transition-smooth">
      {children}
    </button>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
        isUser ? "bg-gradient-brand text-primary-foreground" : "border border-border bg-card text-foreground"
      }`}>
        {typeof children === "string" ? (
          <div className="prose prose-sm max-w-none [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:m-0 [&_ul]:pl-4 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline">
            <ReactMarkdown>{children.replace("[LEAD_CAPTURED]", "").replace(TICKET_RX, "").trim()}</ReactMarkdown>
          </div>
        ) : children}
      </div>
    </motion.div>
  );
}
