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
    if (!briefing.service_focus?.trim() || !briefing.scope_summary?.trim()) {
      return json({ error: "Informe a ideia/serviço e o escopo da proposta." }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isProposal = briefing.type === "proposal";

    const systemPrompt = isProposal
      ? `Você é uma estrategista comercial sênior da Daina Flow, consultoria brasileira de People Analytics, Governança de Dados e Automação Low-code/No-code.

Sua tarefa é transformar um briefing simples em uma PROPOSTA COMERCIAL pronta para captar clientes, em português do Brasil, com tom profissional, consultivo e convincente.

Você deve:
- Fazer a proposta pela consultora, não apenas resumir o briefing.
- Diagnosticar o problema do cliente e conectar o escopo ao resultado de negócio.
- Sugerir investimento quando o valor não for informado, usando referências realistas do mercado brasileiro: automações simples R$1.500–5.000, dashboards/dados R$3.000–15.000, projetos estratégicos R$10.000+, hora especializada R$300–600.
- Ajustar preço por complexidade, urgência e perfil do cliente. Estratégia conservadora puxa para baixo, equilibrada mantém mercado, premium puxa para cima. Urgência pode adicionar 20–40%.
- Quebrar o investimento em itens/etapas coerentes.
- Não prometer resultado garantido; use linguagem de potencial, ganho esperado e clareza operacional.

A proposta deve ter estas seções no body_markdown, nesta ordem:
## Contexto e oportunidade
## Objetivos da proposta
## Solução proposta
## Escopo detalhado
## Cronograma e forma de trabalho
## Investimento sugerido
## Condições comerciais
## Próximos passos

Retorne APENAS JSON válido, sem markdown fora do JSON, seguindo exatamente este schema:
{
  "title": "string",
  "intro": "string — resumo executivo de 4 a 6 linhas",
  "body_markdown": "string — seções acima em markdown",
  "items": [{ "description": "string", "quantity": number, "unit_price": number }],
  "total": number,
  "suggested_price_range": "string — faixa considerada, ex: R$ 4.500 a R$ 7.000",
  "pricing_note": "string — justificativa curta do preço sugerido",
  "valid_until_days": number,
  "payment_terms": "string"
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