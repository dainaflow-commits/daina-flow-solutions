import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { siNotion, siWhatsapp, siMake, siAirtable } from "simple-icons";

type SimpleIcon = { hex: string; path: string; title: string };

// Hybrid: official SVGs from simple-icons when available; hand-built brand SVGs otherwise.
type Tool =
  | { name: string; kind: "si"; icon: SimpleIcon; bg?: string }
  | { name: string; kind: "custom"; render: () => JSX.Element };

const SI = (icon: SimpleIcon, bg?: string) => ({ kind: "si" as const, icon, bg });

const tools: Tool[] = [
  {
    name: "Excel",
    kind: "custom",
    render: () => (
      <svg viewBox="0 0 32 32" className="h-4 w-4">
        <path fill="#107C41" d="M19 4h9a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2h-9z" />
        <path fill="#185C37" d="M19 4v24H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <path fill="#fff" d="m8.5 10 3 6-3 6h2.4l1.8-3.9 1.8 3.9h2.4l-3-6 3-6h-2.4l-1.8 3.9L10.9 10z" />
      </svg>
    ),
  },
  {
    name: "Power BI",
    kind: "custom",
    render: () => (
      <svg viewBox="0 0 32 32" className="h-4 w-4">
        <rect x="4" y="14" width="6" height="14" rx="1" fill="#F2C811" />
        <rect x="13" y="8" width="6" height="20" rx="1" fill="#E6A700" />
        <rect x="22" y="4" width="6" height="24" rx="1" fill="#C49A00" />
      </svg>
    ),
  },
  { name: "Notion", ...SI(siNotion, "#fff") },
  {
    name: "Teams",
    kind: "custom",
    render: () => (
      <svg viewBox="0 0 32 32" className="h-4 w-4">
        <rect x="3" y="8" width="18" height="16" rx="2" fill="#5059C9" />
        <text x="12" y="20" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="13" fill="#fff">T</text>
        <circle cx="25" cy="13" r="4" fill="#7B83EB" />
      </svg>
    ),
  },
  { name: "WhatsApp", ...SI(siWhatsapp) },
  { name: "Make", ...SI(siMake) },
  { name: "Airtable", ...SI(siAirtable) },
  {
    name: "Pipefy",
    kind: "custom",
    render: () => (
      <svg viewBox="0 0 32 32" className="h-4 w-4">
        <circle cx="16" cy="16" r="14" fill="#00C16E" />
        <path fill="#fff" d="M11 9h7a5 5 0 0 1 0 10h-3v4h-4zm4 3v4h3a2 2 0 0 0 0-4z" />
      </svg>
    ),
  },
  {
    name: "Lovable",
    kind: "custom",
    render: () => (
      <svg viewBox="0 0 32 32" className="h-4 w-4">
        <path
          fill="#FF5757"
          d="M16 27s-10-6.2-10-13.5A5.5 5.5 0 0 1 16 9a5.5 5.5 0 0 1 10 4.5C26 20.8 16 27 16 27z"
        />
      </svg>
    ),
  },
  {
    name: "base44",
    kind: "custom",
    render: () => (
      <svg viewBox="0 0 32 32" className="h-4 w-4">
        <rect width="32" height="32" rx="7" fill="#0EA5E9" />
        <text x="16" y="22" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="16" fill="#fff">b</text>
      </svg>
    ),
  },
];

function SiSvg({ icon, bg }: { icon: SimpleIcon; bg?: string }) {
  return (
    <span
      className="grid h-4 w-4 place-items-center rounded-[3px]"
      style={{ background: bg ?? "transparent" }}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
        <path d={icon.path} fill={`#${icon.hex}`} />
      </svg>
    </span>
  );
}

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
                {t.kind === "si" ? <SiSvg icon={t.icon} bg={t.bg} /> : t.render()}
                {t.name}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
