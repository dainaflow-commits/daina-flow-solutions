import { motion } from "framer-motion";
import { Sparkles, Clock, Users, TrendingUp } from "lucide-react";

const tools = ["Notion", "Excel", "Power BI", "Pipefy", "Zapier", "Make", "Airtable", "n8n"];
const metrics = [
  { icon: Clock, value: "+500h", label: "economizadas em automações" },
  { icon: Users, value: "+30", label: "negócios atendidos" },
  { icon: TrendingUp, value: "100%", label: "soluções sob medida" },
];

export function SocialProofSection() {
  return (
    <section className="border-y border-border/60 bg-secondary/30 py-12">
      <div className="container mx-auto px-4">
        <motion.p
          className="mb-6 flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-violet)]" />
          Ferramentas que domino · Resultados reais
        </motion.p>

        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
            {tools.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                {t}
              </motion.span>
            ))}
          </div>

          <div className="hidden h-12 w-px bg-border md:block" />

          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {metrics.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="text-center"
              >
                <Icon className="mx-auto h-4 w-4 text-[color:var(--accent-violet)]" />
                <p className="mt-1 font-display text-xl font-bold text-foreground">{value}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
