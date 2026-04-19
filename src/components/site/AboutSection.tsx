import heroImg from "@/assets/larissa.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, GraduationCap, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export function AboutSection() {
  const [photo, setPhoto] = useState<string>(heroImg);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "about_photo_url").maybeSingle()
      .then(({ data }) => { if (data?.value) setPhoto(data.value); });
  }, []);

  return (
    <section id="sobre" className="bg-background py-20 md:py-28">
      <div className="container mx-auto grid items-center gap-12 px-4 md:grid-cols-[1fr_1.2fr]">
        <motion.div
          className="relative mx-auto w-full max-w-sm"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.div
            className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-brand-soft"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.img
            src={photo}
            alt="Larissa Daina"
            loading="lazy"
            width={800} height={1000}
            className="aspect-[4/5] w-full rounded-[1.75rem] border border-border object-cover shadow-card"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
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
            <InfoChip icon={<GraduationCap className="h-4 w-4" />} label="ADS · em curso" />
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
