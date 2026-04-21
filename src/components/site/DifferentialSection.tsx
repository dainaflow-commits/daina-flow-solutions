import { Heart, BrainCircuit, Zap, Handshake, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsappLink, GENERIC_HELLO } from "@/lib/whatsapp";

const items = [
  { icon: BrainCircuit, title: "Visão estratégica + técnica", description: "Entendo o lado humano do negócio e traduzo em automações inteligentes." },
  { icon: Zap, title: "Low-code / No-code rápido", description: "Soluções práticas que entram em produção em dias, não em meses." },
  { icon: Heart, title: "Atendimento próximo", description: "Linguagem clara, sem jargão técnico. Você entende cada etapa." },
  { icon: Handshake, title: "Resultado mensurável", description: "Dashboards e métricas para você acompanhar o impacto real." },
];

export function DifferentialSection() {
  const [whatsapp, setWhatsapp] = useState<string | undefined>();
  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => setWhatsapp(data?.value || undefined));
  }, []);

  return (
    <section id="diferencial" className="relative border-y border-border/60 bg-secondary/40 py-20 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Por que Daina Flow
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            O <span className="text-gradient-brand">diferencial</span> que entrega resultado
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elegant"
            >
              <motion.div
                className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand-soft transition-smooth group-hover:bg-gradient-brand"
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
              >
                <Icon className="h-5 w-5 text-[color:var(--accent-violet)] transition-smooth group-hover:text-primary-foreground" />
              </motion.div>
              <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href={buildWhatsappLink(GENERIC_HELLO, whatsapp)}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-3 text-sm font-semibold text-primary-foreground shadow-elegant"
          >
            <MessageCircle className="h-4 w-4" />
            Agendar consultoria gratuita
          </a>
        </div>
      </div>
    </section>
  );
}
