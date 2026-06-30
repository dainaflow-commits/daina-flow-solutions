import { MapPin, GraduationCap, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section id="sobre" className="bg-background py-20 md:py-28">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            Sobre mim
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            Visão administrativa <span className="text-gradient-brand">+ automação técnica</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Sou Larissa Daina, Analista Administrativa Jr. e graduanda em Análise e
            Desenvolvimento de Sistemas, com especialização em People Analytics e
            Governança de Dados. Combino visão administrativa com automação técnica
            (Low-code/No-code) para entregar soluções práticas e eficientes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Meu diferencial é a união entre a visão administrativa/humana e a automação
            técnica. Entendo profundamente o seu negócio e traduzo isso em processos
            mais inteligentes — sem complicação. Atuo presencialmente em Igarapé-MG e
            regiões próximas.
          </p>

          <div className="grid gap-3 pt-4 sm:grid-cols-3">
            <InfoChip icon={<Briefcase className="h-4 w-4" />} label="Analista Adm. Jr." />
            <InfoChip icon={<GraduationCap className="h-4 w-4" />} label="Graduação completa" />
            <InfoChip icon={<MapPin className="h-4 w-4" />} label="Igarapé-MG" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <span className="text-[color:var(--accent-violet)]">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
