// Sugere uma resposta inicial para um ticket aberto, baseada em tickets resolvidos similares
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticket_id } = await req.json();
    if (!ticket_id) throw new Error("ticket_id required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: ticket } = await sb.from("tickets").select("*").eq("id", ticket_id).maybeSingle();
    if (!ticket) throw new Error("Ticket não encontrado");

    // Busca tickets resolvidos do mesmo tipo (até 5) com primeira resposta da admin
    const { data: similar } = await sb
      .from("tickets")
      .select("id, subject, description, type")
      .eq("type", ticket.type)
      .in("status", ["resolvido", "fechado"])
      .neq("id", ticket_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const examples: string[] = [];
    if (similar?.length) {
      for (const s of similar) {
        const { data: msgs } = await sb
          .from("ticket_messages")
          .select("content, sender_role")
          .eq("ticket_id", s.id)
          .eq("sender_role", "admin")
          .order("created_at")
          .limit(1);
        const reply = msgs?.[0]?.content;
        if (reply) {
          examples.push(`### Caso anterior\nAssunto: ${s.subject}\nProblema: ${s.description.slice(0, 200)}\nResposta da Larissa: ${reply.slice(0, 400)}`);
        }
      }
    }

    const sysPrompt = `Você é a Larissa Daina (dona da Daina Flow). Escreva um RASCUNHO de resposta inicial para o ticket abaixo. Português BR, tom profissional e empático. Máx 5 linhas curtas. Não invente prazos exatos. Não use saudação genérica.${
      examples.length ? "\n\nUse os casos abaixo como referência de tom e estrutura:\n\n" + examples.join("\n\n") : ""
    }`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sysPrompt },
          {
            role: "user",
            content: `Tipo: ${ticket.type}\nAssunto: ${ticket.subject}\n\nMensagem:\n${ticket.description}`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em alguns minutos.");
      if (aiRes.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error(`AI error ${aiRes.status}`);
    }
    const j = await aiRes.json();
    const draft = j.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ draft, used_examples: examples.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
