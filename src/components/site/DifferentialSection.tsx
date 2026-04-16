import { Heart, BrainCircuit, Zap, Handshake } from "lucide-react";

const items = [
  {
    icon: BrainCircuit,
    title: "Visão estratégica + técnica",
    description: "Entendo o lado humano do negócio e traduzo em automações inteligentes.",
  },
  {
    icon: Zap,
    title: "Low-code / No-code rápido",
    description: "Soluções práticas que entram em produção em dias, não em meses.",
  },
  {
    icon: Heart,
    title: "Atendimento próximo",
    description: "Linguagem clara, sem jargão técnico. Você entende cada etapa.",
  },
  {
    icon: Handshake,
    title: "Resultado mensurável",
    description: "Dashboards e métricas para você acompanhar o impacto real.",
  },
];

export function DifferentialSection() {
  return (
    <section id="diferencial" className="border-y border-border/60 bg-secondary/40 py-20 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Por que Daina Flow
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            O <span className="text-gradient-brand">diferencial</span> que entrega resultado
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand-soft transition-smooth group-hover:bg-gradient-brand">
                <Icon className="h-5 w-5 text-[color:var(--accent-violet)] transition-smooth group-hover:text-primary-foreground" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
