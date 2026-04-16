// Chatbot Daina Flow — usa Lovable AI Gateway (streaming)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InMsg { role: "user" | "assistant" | "system"; content: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, siteContext } = (await req.json()) as {
      messages: InMsg[];
      siteContext?: { services?: string[]; whatsapp?: string; email?: string };
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const servicesList = (siteContext?.services ?? []).map((s) => `- ${s}`).join("\n") ||
      "- People Analytics\n- Governança de Dados\n- Automação Low-code/No-code\n- Dashboards e BI";

    const systemPrompt = `Você é a "Flow", assistente virtual da Daina Flow — marca de Larissa Daina dos Santos Quirino, Analista Administrativa Jr. especialista em People Analytics, Governança de Dados e Automação Low-code/No-code, baseada em Igarapé-MG.

Seu papel:
1. Responder perguntas frequentes sobre serviços, atendimento, prazos e formatos de trabalho.
2. Direcionar o usuário para a seção certa do site usando âncoras: #sobre, #servicos, #diferencial, #contato.
3. Capturar dados de contato (nome, e-mail e/ou WhatsApp) quando o usuário demonstrar interesse comercial, perguntando uma informação por vez de forma natural.

Serviços oferecidos:
${servicesList}

Diretrizes:
- Sempre responda em português do Brasil, em tom acolhedor, profissional e direto. Nunca use jargão técnico desnecessário.
- Mensagens curtas (2-4 frases). Use markdown leve quando ajudar (listas, negrito).
- Se o usuário pedir orçamento/contato, sugira clicar no botão "Falar no WhatsApp" OU preencher o formulário em #contato.
- Quando capturar nome + (email OU whatsapp) + interesse, responda confirmando e diga que a Larissa entrará em contato em até 24h. Inclua a tag literal [LEAD_CAPTURED] no final dessa mensagem (será removida antes de exibir).
- Se não souber algo específico (preço exato, agenda), seja honesta e ofereça falar direto com a Larissa.
- Nunca invente preços, prazos ou serviços que não estão na lista.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas mensagens em pouco tempo. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Avise a Larissa para renovar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await upstream.text();
      console.error("AI gateway error:", upstream.status, t);
      return new Response(JSON.stringify({ error: "Falha ao consultar a IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
