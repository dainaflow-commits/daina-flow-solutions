import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/icon-map";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ServiceDetailsDrawer } from "./ServiceDetailsDrawer";

interface Service {
  id: string; slug: string; title: string; description: string; icon: string; price_text: string | null;
}

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("services")
      .select("id,slug,title,description,icon,price_text")
      .eq("active", true)
      .order("display_order")
      .limit(6)
      .then(({ data }) => setServices((data as Service[]) ?? []));

    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      if (typeof slug === "string") setOpenSlug(slug);
    };
    window.addEventListener("daina:open-service", onOpen);
    return () => window.removeEventListener("daina:open-service", onOpen);
  }, []);

  return (
    <section id="servicos" className="bg-background py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            Serviços
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Soluções para <span className="text-gradient-brand">cada etapa</span> do seu negócio
          </h2>
          <p className="mt-3 text-muted-foreground">
            Veja os principais serviços abaixo ou explore o catálogo completo com busca.
          </p>
          <Link to="/servicos" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant">
            Ver catálogo completo <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.08 }}
                whileHover={{ y: -8 }}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:border-primary/30 hover:shadow-elegant"
              >
                <motion.div
                  className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand-soft transition-smooth group-hover:bg-gradient-brand"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.7 }}
                >
                  <Icon className="h-6 w-6 text-[color:var(--accent-violet)] transition-smooth group-hover:text-primary-foreground" />
                </motion.div>
                <h3 className="mb-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                {s.price_text && (
                  <p className="mb-4 inline-flex w-fit items-center rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-bold text-[color:var(--accent-violet)]">
                    {s.price_text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setOpenSlug(s.slug)}
                  className="inline-flex items-center justify-between gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-smooth hover:bg-gradient-brand hover:text-primary-foreground"
                >
                  Ver detalhes
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </button>
              </motion.article>
            );
          })}
        </div>
      </div>
      <ServiceDetailsDrawer
        slug={openSlug}
        open={!!openSlug}
        onOpenChange={(o) => !o && setOpenSlug(null)}
      />
    </section>
  );
}
