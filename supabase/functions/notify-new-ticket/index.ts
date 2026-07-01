// Envia e-mail para Larissa quando um novo ticket é aberto + gera sugestão de resposta via IA
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "dainaflow@gmail.com";
const FROM_EMAIL = "Daina Flow <onboarding@resend.dev>";
const APP_URL = "https://daina-flow-solutions.lovable.app";

interface TicketPayload {
  id: string;
  type: string;
  subject: string;
  description: string;
  user_email?: string | null;
  user_name?: string | null;
  guest_email?: string | null;
  guest_name?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  reclamacao: "Reclamação",
  sugestao: "Sugestão",
  bug: "Erro técnico",
  duvida: "Dúvida",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_KEY = Deno.env.get("Resend") || Deno.env.get("RESEND_API_KEY");
    if (!RESEND_KEY) throw new Error("Resend key not configured");

    const t = (await req.json()) as TicketPayload;
    const senderName = t.user_name ?? t.guest_name ?? "Cliente";
    const senderEmail = t.user_email ?? t.guest_email ?? "—";
    const typeLabel = TYPE_LABEL[t.type] ?? t.type;
    const link = `${APP_URL}/dashboard/tickets`;

    // 1) Gerar sugestão de resposta inicial via Lovable AI (rascunho)
    let aiDraft = "";
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_KEY) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "Você é a Larissa Daina, dona da Daina Flow. Escreva um RASCUNHO de resposta inicial empática e profissional para o ticket abaixo, em português do Brasil. Máx 4 linhas curtas. Não invente prazos nem soluções definitivas — apenas acolha, valide a questão e diga próximos passos. Não use saudação tipo 'Olá!' (já está no e-mail).",
              },
              {
                role: "user",
                content: `Tipo: ${typeLabel}\nAssunto: ${t.subject}\n\nMensagem do cliente:\n${t.description}`,
              },
            ],
          }),
        });
        if (aiRes.ok) {
          const j = await aiRes.json();
          aiDraft = j.choices?.[0]?.message?.content?.trim() ?? "";
        }
      } catch {
        // ignora — e-mail vai sem rascunho
      }
    }

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px;color:#0f172a;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:20px 24px;color:#fff">
      <p style="margin:0;font-size:12px;opacity:0.85;text-transform:uppercase;letter-spacing:1px">Novo ticket — ${typeLabel}</p>
      <h1 style="margin:6px 0 0;font-size:20px">${escapeHtml(t.subject)}</h1>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b">De</p>
      <p style="margin:0 0 16px;font-weight:600">${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;</p>

      <p style="margin:0 0 4px;font-size:13px;color:#64748b">Mensagem</p>
      <div style="background:#f1f5f9;border-radius:10px;padding:14px;white-space:pre-wrap;font-size:14px;line-height:1.5">${escapeHtml(t.description)}</div>

      ${
        aiDraft
          ? `<div style="margin-top:20px;border:1px dashed #c7d2fe;border-radius:10px;padding:14px;background:#eef2ff">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:0.5px">✨ Sugestão de resposta (rascunho IA)</p>
        <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.5;color:#1e1b4b">${escapeHtml(aiDraft)}</p>
        <p style="margin:10px 0 0;font-size:11px;color:#6366f1">Apenas um rascunho — revise antes de enviar.</p>
      </div>`
          : ""
      }

      <a href="${link}" style="display:inline-block;margin-top:22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">Abrir ticket no painel →</a>
    </div>
    <div style="padding:14px 24px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center">
      Daina Flow · Notificação automática
    </div>
  </div>
</body></html>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `[${typeLabel}] ${t.subject}`,
        html,
        reply_to: senderEmail !== "—" ? senderEmail : undefined,
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Resend ${r.status}: ${txt}`);
    }

    return new Response(JSON.stringify({ ok: true, ai_draft: aiDraft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
