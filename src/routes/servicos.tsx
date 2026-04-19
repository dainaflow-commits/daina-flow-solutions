import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicNav } from "@/components/site/PublicNav";
import { Footer } from "@/components/site/Footer";
import { getIcon } from "@/lib/icon-map";
import { Search, ArrowRight, Clock, Tag } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Daina Flow" },
      { name: "description", content: "Catálogo completo de serviços: People Analytics, dashboards, automação, governança de dados. Pesquise por tema." },
      { property: "og:title", content: "Serviços — Daina Flow" },
      { property: "og:description", content: "Soluções em dados, analytics e automação para PMEs." },
    ],
  }),
  component: ServicosPage,
});

interface Service {
  id: string; slug: string; title: string; description: string; icon: string;
  price_text: string | null; duration_estimate: string | null; tags: string[];
}

function ServicosPage() {
  const [items, setItems] = useState<Service[] | null>(null);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("services")
      .select("id,slug,title,description,icon,price_text,duration_estimate,tags")
      .eq("active", true).order("display_order")
      .then(({ data }) => setItems((data ?? []).map((d: any) => ({ ...d, tags: Array.isArray(d.tags) ? d.tags : [] })) as Service[]));
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items?.forEach((s) => s.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const term = q.trim().toLowerCase();
    return items.filter((s) => {
      if (activeTag && !s.tags.includes(activeTag)) return false;
      if (!term) return true;
      return [s.title, s.description, ...s.tags].some((x) => x?.toLowerCase().includes(term));
    });
  }, [items, q, activeTag]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <header className="border-b border-border bg-gradient-brand-soft/50">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider">Catálogo</span>
            <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
              Como posso <span className="text-gradient-brand">ajudar</span> seu negócio
            </h1>
            <p className="mt-3 text-muted-foreground">
              Explore todos os serviços e descubra a solução certa para o seu desafio.
            </p>
          </motion.div>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquise por tema, palavra-chave ou serviço…"
                className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-sm shadow-card outline-none focus:border-primary"
              />
            </div>
            {allTags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button onClick={() => setActiveTag(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${!activeTag ? "bg-gradient-brand text-primary-foreground" : "bg-card border border-border"}`}>
                  Todos
                </button>
                {allTags.map((t) => (
                  <button key={t} onClick={() => setActiveTag(t === activeTag ? null : t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${activeTag === t ? "bg-gradient-brand text-primary-foreground" : "bg-card border border-border"}`}>
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {!items ? (
          <p className="text-center text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-semibold">Nada encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente outra palavra ou <button onClick={() => { setQ(""); setActiveTag(null); }} className="text-primary underline">ver todos os serviços</button>.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => {
              const Icon = getIcon(s.icon);
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 9) * 0.04 }}
                >
                  <Link
                    to="/servicos/$slug" params={{ slug: s.slug }}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
                  >
                    <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand-soft transition-smooth group-hover:bg-gradient-brand">
                      <Icon className="h-5 w-5 text-[color:var(--accent-violet)] transition-smooth group-hover:text-primary-foreground" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {s.duration_estimate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Clock className="h-3 w-3" /> {s.duration_estimate}</span>
                      )}
                      {s.price_text && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-brand-soft px-2 py-1 font-semibold text-[color:var(--accent-violet)]">{s.price_text}</span>
                      )}
                      {s.tags.slice(0, 2).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1"><Tag className="h-3 w-3" />{t}</span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Ver detalhes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
