import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/icon-map";

interface Stat { id: string; label: string; value: string; suffix: string | null; icon: string | null; }

export function ResultsSection() {
  const [stats, setStats] = useState<Stat[]>([]);
  useEffect(() => {
    supabase.from("results_stats").select("id,label,value,suffix,icon")
      .eq("active", true).order("display_order")
      .then(({ data }) => setStats(data ?? []));
  }, []);

  return (
    <section id="resultados" className="relative overflow-hidden bg-gradient-brand py-20 text-primary-foreground md:py-24">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-20" />
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            Resultados
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Números que mostram o impacto real
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = getIcon(s.icon);
            return (
              <div key={s.id} className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-sm">
                <Icon className="mx-auto mb-3 h-7 w-7 opacity-80" />
                <div className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                  {s.value}<span className="text-2xl">{s.suffix}</span>
                </div>
                <p className="mt-2 text-sm opacity-90">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
