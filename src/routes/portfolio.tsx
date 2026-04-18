import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicNav } from "@/components/site/PublicNav";
import { Footer } from "@/components/site/Footer";
import { ExternalLink, Loader2, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólio — Daina Flow" },
      { name: "description", content: "Cases de People Analytics, Governança de Dados e Automação implementados pela Daina Flow." },
      { property: "og:title", content: "Portfólio — Daina Flow" },
      { property: "og:description", content: "Cases reais de transformação por dados." },
    ],
  }),
  component: PortfolioPage,
});

interface Item {
  id: string; title: string; description: string | null; category: string | null;
  cover_url: string | null; link_url: string | null;
}

function PortfolioPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("portfolio_items")
        .select("id, title, description, category, cover_url, link_url")
        .eq("active", true)
        .order("display_order");
      setItems((data as Item[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-wider text-primary">Portfólio</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            <span className="text-gradient-brand">Cases</span> e projetos
          </h1>
          <p className="mt-4 text-muted-foreground">Resultados reais de transformação por dados, governança e automação.</p>
        </header>

        {loading ? (
          <div className="mt-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 opacity-50" />
            Em breve: novos cases serão publicados aqui.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <article key={it.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-smooth hover:shadow-elegant">
                {it.cover_url ? (
                  <div className="aspect-video overflow-hidden bg-secondary">
                    <img src={it.cover_url} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="grid aspect-video place-items-center bg-gradient-brand text-primary-foreground">
                    <ImageIcon className="h-10 w-10 opacity-70" />
                  </div>
                )}
                <div className="space-y-2 p-5">
                  {it.category && <p className="text-[10px] uppercase tracking-wider text-primary">{it.category}</p>}
                  <h3 className="font-display text-lg font-bold">{it.title}</h3>
                  {it.description && <p className="text-sm text-muted-foreground">{it.description}</p>}
                  {it.link_url && (
                    <a href={it.link_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                      Ver case <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
