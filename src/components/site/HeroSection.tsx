import heroImg from "@/assets/larissa.png";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { buildWhatsappLink, GENERIC_HELLO } from "@/lib/whatsapp";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export function HeroSection() {
  const [photo, setPhoto] = useState<string>(heroImg);
  const [whatsapp, setWhatsapp] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["hero_photo_url", "whatsapp_number"])
      .then(({ data }) => {
        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
        if (map.hero_photo_url) setPhoto(map.hero_photo_url);
        if (map.whatsapp_number) setWhatsapp(map.whatsapp_number);
      });
  }, []);

  return (
    <section className="relative overflow-hidden bg-hero">
      {/* Animated blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -right-32 -z-10 h-[480px] w-[480px] rounded-full bg-gradient-brand opacity-30 blur-3xl"
        animate={{ scale: [1, 1.15, 1], rotate: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -left-32 -z-10 h-[460px] w-[460px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-cyan), transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1], x: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 -z-10 bg-mesh opacity-40" />

      <div className="container relative mx-auto grid items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24 lg:py-32">
        <motion.div
          className="space-y-7"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.span
              animate={{ rotate: [0, 20, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-violet)]" />
            </motion.span>
            People Analytics · Governança de Dados · Low-code
          </motion.span>

          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            Transformando{" "}
            <motion.span
              className="text-gradient-brand inline-block"
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% auto" }}
            >
              dados
            </motion.span>{" "}
            em decisões{" "}
            <motion.span
              className="text-gradient-brand inline-block"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
              style={{ backgroundSize: "200% auto" }}
            >
              inteligentes
            </motion.span>
            .
          </h1>

          <motion.p
            className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Combino visão administrativa com automação técnica (Low-code/No-code) para
            entregar soluções práticas, inteligentes e que realmente geram resultado.
          </motion.p>

          <motion.div
            className="flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <motion.a
              href={buildWhatsappLink(GENERIC_HELLO, whatsapp)}
              target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com a Larissa no WhatsApp
            </motion.a>
            <motion.a
              href="#servicos"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground shadow-card"
            >
              Ver todos os serviços
              <ArrowRight className="h-4 w-4" />
            </motion.a>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <motion.div
            className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-brand opacity-25 blur-3xl"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-elegant"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={photo}
              alt="Larissa Daina"
              width={1024}
              height={1024}
              className="aspect-square h-full w-full object-cover"
            />
          </motion.div>
          <motion.div
            className="absolute -bottom-4 -left-4 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-xs text-muted-foreground">Larissa Daina · 22 anos</p>
            <p className="text-sm font-semibold">Analista Administrativa Jr.</p>
          </motion.div>
          <motion.div
            className="absolute -top-3 -right-3 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--accent-cyan)" }} />
              Disponível agora
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
