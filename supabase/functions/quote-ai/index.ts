// Sugere orçamento via Lovable AI Gateway com justificativa de cada valor
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, complexity, deadline, urgency, client_profile, pricing_style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!description) throw new Error("description é obrigatório");

    const systemPrompt = `Você é uma consultora de pricing sênior da Daina Flow (consultoria de People Analytics, Governança de Dados e Automação Low-code/No-code, baseada em Igarapé-MG, conduzida por Larissa Daina).

Sua tarefa: ao receber a descrição de um serviço, sugerir 3 faixas de preço (Econômico, Recomendado, Premium) em REAIS BRASILEIROS, considerando o mercado brasileiro de consultoria para pequenos e médios negócios.

Para cada faixa, retorne:
- name: "Econômico" | "Recomendado" | "Premium"
- price_min e price_max (em R$, números)
- scope_summary: o que está incluso
- justification: explicação clara do POR QUÊ desse valor (horas estimadas, complexidade, entregáveis, custo de oportunidade, valor percebido pelo cliente)
- estimated_hours: número de horas estimadas
- ideal_for: perfil de cliente ideal para essa faixa

Também retorne:
- analysis: análise geral do serviço (parágrafo único, 3-5 linhas)
- recommended_tier: "Econômico" | "Recomendado" | "Premium" — qual a Larissa deveria oferecer primeiro
- pricing_strategy: dica de negociação (1-2 linhas)
- red_flags: array de strings com sinais de alerta no escopo (se houver)

Use referências realistas do mercado: hora de consultoria júnior R$80-150, pleno R$150-300, especializada R$300-600. Projetos low-code/automação simples R$1.500-5.000, projetos de dados/dashboards R$3.000-15.000, projetos estratégicos R$10.000+.

Retorne APENAS JSON válido, sem markdown.`;

    const userPrompt = `Descrição do serviço: ${description}
Complexidade percebida: ${complexity ?? "não informada"}
Prazo solicitado: ${deadline ?? "não informado"}
Urgência: ${urgency ?? "normal"}
Perfil do cliente: ${client_profile ?? "não informado"}
Estilo de cobrança preferido pela Larissa: ${pricing_style ?? "equilibrado"} (use isso para calibrar os 3 valores — "conservador" puxa para baixo, "premium" puxa para cima, "equilibrado" mantém faixa de mercado; em "urgente alto" aplique +20-40% de adicional)

Sugira o orçamento agora.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await upstream.text();
      console.error("AI gateway error:", upstream.status, t);
      return new Response(JSON.stringify({ error: "Falha ao gerar orçamento" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch { parsed = { error: "Resposta inválida da IA", raw: content }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quote-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
