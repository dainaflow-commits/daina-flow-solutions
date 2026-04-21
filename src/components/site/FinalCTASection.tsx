import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsappLink, GENERIC_HELLO } from "@/lib/whatsapp";

export function FinalCTASection() {
  const [whatsapp, setWhatsapp] = useState<string | undefined>();
  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => setWhatsapp(data?.value || undefined));
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-brand py-20 md:py-28">
      <motion.div
        aria-hidden
        className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative mx-auto max-w-3xl px-4 text-center text-primary-foreground">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5" /> Vamos começar
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-5 font-display text-3xl font-extrabold leading-tight md:text-5xl"
        >
          Pronto para tirar o caos da sua operação?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-4 max-w-xl text-base opacity-90 md:text-lg"
        >
          Diagnóstico inicial gratuito. Em uma conversa rápida pelo WhatsApp eu te mostro
          o caminho mais curto para automatizar e crescer.
        </motion.p>

        <motion.a
          href={buildWhatsappLink(GENERIC_HELLO, whatsapp)}
          target="_blank" rel="noreferrer"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ delay: 0.25 }}
          className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-primary shadow-elegant"
        >
          <MessageCircle className="h-5 w-5" />
          Falar com a Larissa agora
        </motion.a>

        <p className="mt-4 text-xs opacity-80">
          Resposta em até algumas horas no horário comercial.
        </p>
      </div>
    </section>
  );
}
