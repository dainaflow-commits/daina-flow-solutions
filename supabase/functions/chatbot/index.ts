// Chatbot Daina Flow — Lovable AI Gateway com contexto rico de serviços
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InMsg { role: "user" | "assistant" | "system"; content: string }
interface ServiceCtx { title: string; description: string; tags?: string[]; slug?: string; price_text?: string | null }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, siteContext } = (await req.json()) as {
      messages: InMsg[];
      siteContext?: { services?: ServiceCtx[]; whatsapp?: string; email?: string };
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const services = siteContext?.services ?? [];
    const servicesBlock = services.length
      ? services.map((s) =>
          `• **${s.title}** ${s.price_text ? `(${s.price_text})` : ""}\n  ${s.description}${s.tags?.length ? `\n  Tags: ${s.tags.join(", ")}` : ""}${s.slug ? `\n  Página: /servicos/${s.slug}` : ""}`
        ).join("\n\n")
      : "Catálogo em atualização — sugira /servicos para o usuário ver tudo.";

    const systemPrompt = `Você é a "Flow", assistente virtual da Daina Flow — marca de Larissa Daina dos Santos Quirino, Analista Administrativa Jr. especialista em People Analytics, Governança de Dados e Automação Low-code/No-code, baseada em Igarapé-MG.

## Catálogo COMPLETO de serviços (use SOMENTE estes ao responder):
${servicesBlock}

## Como você responde
1. **Perguntas sobre serviços ("você faz X?", "atende Y?")**: confira a lista acima.
   - Se algum serviço **bate** com o pedido (mesmo parcialmente, via título/descrição/tags), confirme e mande o link da página: /servicos/SLUG
   - Se NÃO bate com nada, seja honesta: "Esse não está no meu catálogo principal, mas posso confirmar com a Larissa — quer que eu abra um ticket de dúvida pra você?"
2. **Direcionamento**: cliente pode ver tudo em /servicos (catálogo com busca).
3. **Lead/orçamento**: capture nome + (email OU whatsapp) + interesse e finalize com a tag literal [LEAD_CAPTURED].
4. **Tickets**: se o usuário quiser registrar reclamação, sugestão, bug ou dúvida formal, oriente: "Posso abrir um ticket pra você. Me diz: tipo (reclamação/sugestão/bug/dúvida), assunto e detalhes." Quando tiver os 3, finalize com a tag literal [OPEN_TICKET:tipo|assunto|descrição] (use exatamente esse formato, separado por |). Não exiba a tag — ela será processada e removida.
5. **Tom**: português BR, acolhedor e direto. 2-4 frases. Markdown leve (negrito, listas).
6. **IA transparente**: se perguntarem se você é humana ou IA, responda com honestidade — você é a Flow, assistente virtual da Daina Flow. Pode pedir atendimento humano quando quiser.
7. **Nunca invente** preços, prazos ou serviços fora da lista.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Muitas mensagens. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (upstream.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await upstream.text();
      console.error("AI gateway error:", upstream.status, t);
      return new Response(JSON.stringify({ error: "Falha ao consultar a IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(upstream.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
