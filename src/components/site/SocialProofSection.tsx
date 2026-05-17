import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Logos renderizadas como monograma colorido para evitar dependência de CDN externa.
const tools = [
  { name: "Excel", color: "217346", mono: "X" },
  { name: "Power BI", color: "F2C811", mono: "P", fg: "#000" },
  { name: "Notion", color: "000000", mono: "N" },
  { name: "Teams", color: "6264A7", mono: "T" },
  { name: "WhatsApp", color: "25D366", mono: "W" },
  { name: "Make", color: "6D00CC", mono: "M" },
  { name: "Airtable", color: "18BFFF", mono: "A" },
  { name: "Pipefy", color: "00B884", mono: "P" },
  { name: "Lovable", color: "FF5757", mono: "L" },
  { name: "base44", color: "0EA5E9", mono: "b" },
];

export function SocialProofSection() {
  return (
    <section className="border-y border-border/60 bg-secondary/30 py-12">
      <div className="container mx-auto px-4">
        <motion.p
          className="mb-8 flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-violet)]" />
          Ferramentas que domino · Resultados reais
        </motion.p>

        <div className="flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {tools.map((t, i) => (
              <motion.span
                key={t.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 shadow-sm hover:border-primary/40 hover:shadow-md transition-smooth"
                title={t.name}
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-sm text-[9px] font-black"
                  style={{ background: `#${t.color}`, color: t.fg ?? "#fff" }}
                  aria-hidden
                >
                  {t.mono}
                </span>
                {t.name}
              </motion.span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
