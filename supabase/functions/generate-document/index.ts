// Gera propostas/contratos via Lovable AI Gateway (não-streaming, retorna JSON estruturado)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Briefing {
  type: "proposal" | "contract";
  client_name: string;
  client_company?: string;
  client_email?: string;
  service_focus: string;          // ex.: "Implementação de People Analytics"
  scope_summary: string;          // o que será entregue (texto livre)
  deadline?: string;              // ex.: "30 dias"
  total_value?: string;           // ex.: "R$ 4500" ou "A partir de R$ 2000"
  payment_terms?: string;         // ex.: "50% início, 50% entrega"
  extra_notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const briefing = (await req.json()) as Briefing;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isProposal = briefing.type === "proposal";

    const systemPrompt = isProposal
      ? `Você é uma redatora comercial sênior da Daina Flow (consultoria de People Analytics, Governança de Dados e Automação Low-code/No-code, conduzida por Larissa Daina dos Santos Quirino, Igarapé-MG).

Sua tarefa: gerar uma PROPOSTA COMERCIAL detalhada (de 2 a 4 páginas) em PORTUGUÊS DO BRASIL, com tom profissional, acolhedor e consultivo.

A proposta DEVE ter estas seções nesta ordem:
1. Resumo Executivo (3–5 linhas com a essência da oferta e o valor total).
2. Contexto e Desafio (o que entendemos da necessidade do cliente).
3. Solução Proposta (descrição da abordagem e metodologia).
4. Escopo Detalhado (lista de entregas em bullets, cada uma com 1 linha de descrição).
5. Cronograma e Prazos (etapas com duração estimada).
6. Investimento (valor, condições de pagamento, validade da proposta).
7. Por que a Daina Flow (3–4 diferenciais).
8. Próximos Passos.

Retorne APENAS um JSON válido (sem markdown, sem comentários) seguindo EXATAMENTE este schema:
{
  "title": "string — título curto da proposta",
  "intro": "string — resumo executivo (parágrafo único)",
  "body_markdown": "string — TODAS as seções 2 a 8 em markdown bem formatado, com ## títulos",
  "items": [
    { "description": "string — entrega/etapa", "quantity": number, "unit_price": number }
  ],
  "total": number,
  "valid_until_days": number,
  "payment_terms": "string"
}

Se o usuário não informou valores numéricos exatos, distribua o total_value informado entre os itens de forma coerente. Se o total for "A partir de", use o piso. Os valores numéricos devem ser realistas. NUNCA retorne texto fora do JSON.`
      : `Você é uma advogada/redatora contratual sênior da Daina Flow (consultoria de People Analytics, Governança de Dados e Automação Low-code/No-code, conduzida por Larissa Daina dos Santos Quirino, MEI baseada em Igarapé-MG).

Sua tarefa: gerar um CONTRATO DE PRESTAÇÃO DE SERVIÇOS detalhado (mínimo 2 páginas) em PORTUGUÊS DO BRASIL, com linguagem clara e formal.

O contrato DEVE ter estas cláusulas (numeradas):
1. Das Partes (CONTRATADA: Larissa Daina dos Santos Quirino — Daina Flow; CONTRATANTE: dados do cliente).
2. Do Objeto (descrição do serviço).
3. Do Escopo e Entregas.
4. Dos Prazos.
5. Do Valor e Forma de Pagamento.
6. Das Obrigações da CONTRATADA.
7. Das Obrigações da CONTRATANTE.
8. Da Confidencialidade e LGPD.
9. Da Propriedade Intelectual.
10. Da Rescisão.
11. Do Foro (Comarca de Igarapé-MG).
12. Disposições Finais.

Retorne APENAS um JSON válido (sem markdown, sem comentários) seguindo EXATAMENTE este schema:
{
  "title": "string — ex: 'Contrato de Prestação de Serviços — <cliente>'",
  "body_markdown": "string — TODO o contrato em markdown com ## para cada cláusula",
  "total": number,
  "payment_terms": "string"
}

NUNCA retorne texto fora do JSON.`;

    const userPrompt = `Briefing do cliente:
- Tipo: ${isProposal ? "Proposta comercial" : "Contrato"}
- Cliente: ${briefing.client_name}${briefing.client_company ? ` (${briefing.client_company})` : ""}
- Email do cliente: ${briefing.client_email ?? "—"}
- Serviço/Objeto: ${briefing.service_focus}
- Escopo resumido: ${briefing.scope_summary}
- Prazo: ${briefing.deadline ?? "a definir"}
- Valor: ${briefing.total_value ?? "a definir"}
- Condições de pagamento: ${briefing.payment_terms ?? "a definir"}
- Observações: ${briefing.extra_notes ?? "—"}

Gere o documento agora.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
      return new Response(JSON.stringify({ error: "Falha ao gerar documento" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch { parsed = { error: "Resposta da IA inválida", raw: content }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
