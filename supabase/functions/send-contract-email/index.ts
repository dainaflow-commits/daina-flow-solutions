// Envia e-mail ao cliente com link de assinatura do contrato.
// Tenta usar Resend (se RESEND_API_KEY existir) — senão apenas registra log e retorna sucesso.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  to: string;
  client_name: string;
  contract_title: string;
  sign_url: string;
  pdf_data_url?: string; // base64 data URL
  pdf_filename?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const p = (await req.json()) as Payload;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h1 style="font-size:22px;margin:0 0 12px">Olá, ${p.client_name}!</h1>
        <p style="font-size:15px;line-height:1.6;color:#475569">
          A <strong>Daina Flow</strong> preparou o contrato <strong>"${p.contract_title}"</strong> para você.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#475569">
          Acesse o link abaixo para revisar e assinar digitalmente:
        </p>
        <p style="margin:24px 0">
          <a href="${p.sign_url}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600">
            Revisar e assinar contrato
          </a>
        </p>
        <p style="font-size:13px;color:#94a3b8">
          Se o botão não funcionar, copie este link: ${p.sign_url}
        </p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
        <p style="font-size:12px;color:#94a3b8">Daina Flow — Larissa Daina · Igarapé-MG</p>
      </div>`;

    if (!RESEND_API_KEY) {
      console.log("[send-contract-email] No RESEND_API_KEY, skipping send. Payload:", { to: p.to, sign_url: p.sign_url });
      return new Response(JSON.stringify({ ok: true, sent: false, reason: "RESEND_API_KEY ausente — link copiado para área de transferência" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const attachments: any[] = [];
    if (p.pdf_data_url && p.pdf_filename) {
      const base64 = p.pdf_data_url.split(",")[1];
      attachments.push({ filename: p.pdf_filename, content: base64 });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Daina Flow <onboarding@resend.dev>",
        to: [p.to],
        subject: `Contrato para assinatura: ${p.contract_title}`,
        html,
        attachments,
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
