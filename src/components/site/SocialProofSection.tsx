import { motion } from "framer-motion";
import { Sparkles, Clock, Users, TrendingUp } from "lucide-react";

// Logos oficiais via simple-icons CDN. Slugs verificados em simpleicons.org.
// Para marcas sem ícone público (Lovable, base44, Pipefy) usamos um monograma colorido.
const tools = [
  { name: "Excel", slug: "microsoftexcel", color: "217346" },
  { name: "Power BI", slug: "powerbi", color: "F2C811" },
  { name: "Notion", slug: "notion", color: "000000" },
  { name: "Teams", slug: "microsoftteams", color: "6264A7" },
  { name: "WhatsApp", slug: "whatsapp", color: "25D366" },
  { name: "Make", slug: "make", color: "6D00CC" },
  { name: "Airtable", slug: "airtable", color: "18BFFF" },
  { name: "Pipefy", slug: null as string | null, color: "00B884", mono: "P" },
  { name: "Lovable", slug: null as string | null, color: "FF5757", mono: "L" },
  { name: "base44", slug: null as string | null, color: "0EA5E9", mono: "b" },
];

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
          className="mb-8 flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-violet)]" />
          Ferramentas que domino · Resultados reais
        </motion.p>

        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_auto_1fr]">
          <div className="flex flex-wrap items-center justify-center gap-2.5 md:justify-end">
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
                {t.slug ? (
                  <img
                    src={`https://cdn.simpleicons.org/${t.slug}/${t.color}`}
                    alt={t.name}
                    className="h-4 w-4 object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const fallback = document.createElement("span");
                      fallback.className =
                        "grid h-4 w-4 place-items-center rounded-sm text-[8px] font-black text-white";
                      fallback.style.background = `#${t.color}`;
                      fallback.textContent = t.name.charAt(0).toLowerCase();
                      img.replaceWith(fallback);
                    }}
                  />
                ) : (
                  <span
                    className="grid h-4 w-4 place-items-center rounded-sm text-[8px] font-black text-white"
                    style={{ background: `#${t.color}` }}
                    aria-hidden
                  >
                    {(t as { mono?: string }).mono ?? t.name.charAt(0).toLowerCase()}
                  </span>
                )}
                {t.name}
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
