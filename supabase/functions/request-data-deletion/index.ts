// Envia e-mail à Larissa solicitando exclusão de dados de um usuário (LGPD Art. 18)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  user_id: string;
  user_email: string;
  user_name: string;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const p = (await req.json()) as Payload;
    const RESEND_API_KEY = Deno.env.get("Resend") ?? Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = "dainaflow@gmail.com";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h1 style="font-size:20px;margin:0 0 12px">Solicitação de Exclusão de Dados — LGPD</h1>
        <p style="font-size:14px;line-height:1.6;color:#475569">
          O usuário abaixo solicitou a exclusão dos seus dados conforme o <strong>Art. 18 da LGPD</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr><td style="padding:8px;border:1px solid #e2e8f0"><strong>Nome</strong></td><td style="padding:8px;border:1px solid #e2e8f0">${p.user_name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0"><strong>E-mail</strong></td><td style="padding:8px;border:1px solid #e2e8f0">${p.user_email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0"><strong>ID</strong></td><td style="padding:8px;border:1px solid #e2e8f0"><code>${p.user_id}</code></td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0"><strong>Solicitado em</strong></td><td style="padding:8px;border:1px solid #e2e8f0">${new Date().toLocaleString("pt-BR")}</td></tr>
          ${p.reason ? `<tr><td style="padding:8px;border:1px solid #e2e8f0"><strong>Motivo</strong></td><td style="padding:8px;border:1px solid #e2e8f0">${p.reason}</td></tr>` : ""}
        </table>
        <p style="font-size:13px;color:#94a3b8">Você tem até 15 dias para responder à solicitação conforme a LGPD.</p>
      </div>`;

    if (!RESEND_API_KEY) {
      console.log("[request-data-deletion] No Resend key, payload:", p);
      return new Response(JSON.stringify({ ok: true, sent: false, reason: "Sem chave Resend" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Daina Flow <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        reply_to: p.user_email,
        subject: `[LGPD] Solicitação de exclusão de dados — ${p.user_name}`,
        html,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Resend error", r.status, t);
      return new Response(JSON.stringify({ ok: false, error: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
