// Gera propostas/contratos via Lovable AI Gateway, com acesso restrito ao perfil admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Briefing {
  type: "proposal" | "contract";
  client_name: string;
  client_company?: string;
  client_email?: string;
  title_hint?: string;
  service_focus: string;
  client_goal?: string;
  current_challenge?: string;
  scope_summary: string;
  client_profile?: string;
  complexity?: string;
  urgency?: string;
  pricing_style?: string;
  deadline?: string;
  total_value?: string;
  payment_terms?: string;
  extra_notes?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJson(content: string) {
  const clean = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
  return JSON.parse(clean);
}

async function assertAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { ok: false, response: json({ error: "Sessão obrigatória" }, 401) };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return { ok: false, response: json({ error: "Configuração de autenticação indisponível" }, 500) };

  const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await sb.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { ok: false, response: json({ error: "Sessão inválida" }, 401) };
  if (user.email?.toLowerCase() !== "dainaflow@gmail.com") return { ok: false, response: json({ error: "Acesso restrito" }, 403) };

  const { data: role, error: roleError } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !role) return { ok: false, response: json({ error: "Acesso restrito" }, 403) };
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = await assertAdmin(req);
    if (!admin.ok) return admin.response!;

    const briefing = (await req.json()) as Briefing;
    if (!briefing.service_focus?.trim()) {
      return json({ error: "Informe a ideia ou serviço a ser proposto." }, 400);
    }
    if (!briefing.scope_summary?.trim()) {
      briefing.scope_summary = briefing.service_focus;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isProposal = briefing.type === "proposal";

    const systemPrompt = isProposal
      ? `Você é sócia estratégica e consultora de negócios da Daina Flow — especialista em crescimento de pequenas e médias empresas, vendas consultivas, otimização de processos, automação low-code, CRM, marketing digital, CX, inteligência comercial e aumento de faturamento.

Sua missão NÃO é vender tecnologia. Sua missão é encontrar oportunidades para AUMENTAR O LUCRO do cliente. Sempre venda resultados, nunca ferramentas.

Ao receber o briefing, siga mentalmente estas etapas antes de escrever:

1. ENTENDA o negócio — não faça suposições importantes. Se faltar informação crítica, deixe isso explícito em "hipóteses_a_confirmar" no JSON.
2. IDENTIFIQUE DORES prováveis: gargalos, retrabalho, tempo desperdiçado, processos manuais, oportunidades perdidas, CX, atendimento, organização, vendas, pós-venda, fidelização, indicadores, tomada de decisão, marketing, automações possíveis.
3. DESCUBRA OPORTUNIDADES ESCONDIDAS pensando como empresária: onde perde dinheiro? onde desperdiça tempo? onde pode vender mais? onde pode reduzir custos? onde pode automatizar? o que o dono provavelmente nunca percebeu?
4. CRIE UMA PROPOSTA INICIAL curta e consultiva — o objetivo é DESPERTAR INTERESSE e levar a uma reunião de diagnóstico. Não é um orçamento fechado. Não entregue toda a consultoria de graça. Não detalhe TODAS as soluções — mostre que enxerga além do que foi pedido.
5. GERE PERGUNTAS ESTRATÉGICAS que façam o empresário refletir e confirmem/descartem hipóteses.

Regras rígidas de escrita:
- Nunca diga apenas "faça um site" ou "automatize" — explique QUE PROBLEMA resolve e QUANTO tempo/dinheiro economiza ou gera.
- Sempre conecte escopo ↔ retorno financeiro esperado (economia de horas, aumento de conversão, redução de retrabalho, ticket médio, LTV).
- Priorize soluções simples de ALTO IMPACTO. Aponte oportunidades de RECEITA RECORRENTE (mensalidade de suporte, evolução, dashboards vivos).
- Se enxergar oportunidades que a Larissa não mencionou, apresente-as em "oportunidades_adicionais".
- Não prometa garantias; use linguagem de potencial, ganho esperado, clareza operacional.
- Sugira investimento quando o valor não for informado, usando referências realistas do mercado brasileiro: automações simples R$1.500–5.000, dashboards/dados R$3.000–15.000, projetos estratégicos R$10.000+, hora especializada R$300–600. Ajuste por complexidade, urgência (+20–40%) e estratégia (conservador/equilibrado/premium).
- Sempre reserve espaço para relacionamento de longo prazo: aponte no fim como o projeto pontual pode virar contrato recorrente.

O body_markdown da proposta deve seguir EXATAMENTE esta estrutura consultiva (não usar as seções antigas de "escopo/cronograma"):

## O que observamos no seu negócio
(diagnóstico enxuto do contexto e das dores prováveis — mostrando entendimento real)

## Oportunidades que enxergamos
(3 a 6 oportunidades concretas, incluindo ao menos 1 que a cliente NÃO pediu explicitamente)

## Problemas que essas oportunidades podem estar causando hoje
(traduza cada oportunidade em dor financeira/operacional: perda de receita, tempo, clientes, decisões ruins)

## Como podemos ajudar
(abordagem geral da Daina Flow — SEM entregar a solução detalhada; foco em resultado)

## Benefícios esperados
(ganhos mensuráveis: horas/mês economizadas, % de conversão, redução de erros, previsibilidade)

## Investimento sugerido
(faixa ou valor com justificativa curta — deixe claro que é uma estimativa inicial a ser refinada no diagnóstico)

## Próximo passo — reunião de diagnóstico
(convite claro para conversa de 30–45 min, sem compromisso, para aprofundar)

Retorne APENAS JSON válido, sem markdown fora do JSON, seguindo EXATAMENTE este schema:
{
  "title": "string — título orientado a resultado, não a ferramenta",
  "intro": "string — resumo executivo de 4 a 6 linhas focado em VALOR de negócio",
  "body_markdown": "string — seções acima em markdown",
  "items": [{ "description": "string", "quantity": number, "unit_price": number }],
  "total": number,
  "suggested_price_range": "string — ex: R$ 4.500 a R$ 7.000",
  "pricing_note": "string — justificativa do preço conectada a ROI",
  "valid_until_days": number,
  "payment_terms": "string",
  "hipoteses_a_confirmar": ["string — informações faltantes que a Larissa deve validar antes de enviar"],
  "oportunidades_adicionais": ["string — oportunidades que o cliente NÃO pediu mas você enxergou"],
  "perguntas_estrategicas": ["string — 4 a 6 perguntas para a reunião de diagnóstico"],
  "caminho_recorrente": "string — como esse projeto pode virar receita recorrente / relacionamento de longo prazo"
}`
      : `Você é uma redatora contratual sênior da Daina Flow. Gere um CONTRATO DE PRESTAÇÃO DE SERVIÇOS claro, formal e completo em português do Brasil.

O contrato deve conter cláusulas numeradas sobre partes, objeto, escopo, prazos, valor, obrigações, confidencialidade/LGPD, propriedade intelectual, rescisão, foro de Igarapé-MG e disposições finais.

Retorne APENAS JSON válido seguindo exatamente este schema:
{
  "title": "string",
  "body_markdown": "string — contrato completo em markdown com ## para cada cláusula",
  "total": number,
  "payment_terms": "string"
}`;

    const userPrompt = `Briefing:
- Tipo: ${isProposal ? "Proposta comercial" : "Contrato"}
- Cliente: ${briefing.client_name}${briefing.client_company ? ` (${briefing.client_company})` : ""}
- E-mail do cliente: ${briefing.client_email ?? "—"}
- Título desejado: ${briefing.title_hint ?? "criar um título profissional"}
- Ideia/serviço: ${briefing.service_focus}
- Resultado desejado pelo cliente: ${briefing.client_goal ?? "não informado"}
- Problema/oportunidade atual: ${briefing.current_challenge ?? "não informado"}
- Escopo e entregáveis: ${briefing.scope_summary}
- Perfil do cliente: ${briefing.client_profile ?? "não informado"}
- Complexidade: ${briefing.complexity ?? "intermediária"}
- Urgência: ${briefing.urgency ?? "normal"}
- Prazo: ${briefing.deadline ?? "a definir"}
- Valor informado: ${briefing.total_value?.trim() || "não informado — sugira um valor"}
- Estratégia de preço: ${briefing.pricing_style ?? "equilibrado"}
- Condições de pagamento: ${briefing.payment_terms ?? "a definir"}
- Observações: ${briefing.extra_notes ?? "—"}`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) return json({ error: "Limite de requisições atingido. Tente novamente em instantes." }, 429);
      if (upstream.status === 402) return json({ error: "Créditos de IA esgotados." }, 402);
      const t = await upstream.text();
      console.error("AI gateway error:", upstream.status, t);
      return json({ error: "Falha ao gerar documento" }, 500);
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = extractJson(content); }
    catch { parsed = { error: "Resposta da IA inválida" }; }

    return json(parsed);
  } catch (e) {
    console.error("generate-document error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro ao gerar documento" }, 500);
  }
});