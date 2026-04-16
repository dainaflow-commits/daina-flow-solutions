import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Endpoint único para criar o usuário admin dainaflow@gmail.com.
// Após executar uma vez com sucesso, este arquivo pode ser removido.
export const Route = createFileRoute("/api/bootstrap-admin")({
  server: {
    handlers: {
      GET: async () => {
        const email = "dainaflow@gmail.com";
        const password = "Dainaflow021240@";

        const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
        const found = existing?.users?.find((u) => u.email?.toLowerCase() === email);
        let userId = found?.id;

        if (!userId) {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: "Daina Flow" },
          });
          if (error) {
            return new Response(JSON.stringify({ ok: false, error: error.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          userId = data.user?.id;
        } else {
          // Atualiza senha caso usuário já exista
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
          });
        }

        if (userId) {
          await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" });
        }

        return new Response(
          JSON.stringify({ ok: true, userId, email, message: "Admin pronto. Faça login." }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
