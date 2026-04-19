import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PublicNav } from "@/components/site/PublicNav";
import { Footer } from "@/components/site/Footer";
import { getIcon } from "@/lib/icon-map";
import { ArrowLeft, ArrowRight, Check, Clock, Sparkles, Users, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { buildWhatsappLink, serviceMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/servicos/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { service: data as any };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.service.title} — Daina Flow` },
          { name: "description", content: loaderData.service.description?.slice(0, 155) ?? "Serviço da Daina Flow" },
          { property: "og:title", content: `${loaderData.service.title} — Daina Flow` },
          { property: "og:description", content: loaderData.service.description?.slice(0, 155) ?? "" },
          ...(loaderData.service.hero_image_url ? [{ property: "og:image", content: loaderData.service.hero_image_url }] : []),
        ]
      : [],
  }),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="font-semibold">Não consegui carregar este serviço</p>
        <Link to="/servicos" className="mt-3 inline-block text-primary underline">Ver catálogo</Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">Serviço não encontrado</h1>
        <Link to="/servicos" className="mt-4 inline-block text-primary underline">Ver todos</Link>
      </div>
    </div>
  ),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  const Icon = getIcon(service.icon);
  const [whatsapp, setWhatsapp] = useState<string | undefined>();
  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => setWhatsapp(data?.value || undefined));
  }, []);

  const audience: string[] = Array.isArray(service.target_audience) ? service.target_audience : [];
  const deliverables: string[] = Array.isArray(service.deliverables) ? service.deliverables : [];
  const faq: { q: string; a: string }[] = Array.isArray(service.faq) ? service.faq : [];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <article>
        <header className="border-b border-border bg-gradient-brand-soft/40">
          <div className="container mx-auto px-4 py-10">
            <Link to="/servicos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Catálogo de serviços
            </Link>
            <div className="mt-6 flex flex-wrap items-start gap-6">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-elegant">
                <Icon className="h-7 w-7" />
              </span>
              <div className="flex-1 min-w-[260px]">
                <h1 className="font-display text-3xl font-bold md:text-4xl">{service.title}</h1>
                <p className="mt-2 text-muted-foreground">{service.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {service.duration_estimate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1.5">
                      <Clock className="h-3.5 w-3.5" /> {service.duration_estimate}
                    </span>
                  )}
                  {service.price_text && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 font-semibold text-primary-foreground">
                      {service.price_text}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={buildWhatsappLink(serviceMessage(service.title), whatsapp)}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant"
              >
                Quero este serviço <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </header>

        <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {service.hero_image_url && (
              <img src={service.hero_image_url} alt={service.title} className="w-full rounded-2xl border border-border object-cover" />
            )}

            {service.long_description && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-bold">Sobre este serviço</h2>
                <div className="prose prose-sm max-w-none [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h3]:font-display [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                  <ReactMarkdown>{service.long_description}</ReactMarkdown>
                </div>
              </section>
            )}

            {deliverables.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> O que você recebe
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {d}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {faq.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-bold">Perguntas frequentes</h2>
                <div className="space-y-3">
                  {faq.map((f, i) => (
                    <details key={i} className="group rounded-xl border border-border bg-card p-4">
                      <summary className="cursor-pointer list-none font-semibold marker:hidden">
                        {f.q}
                      </summary>
                      <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {audience.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-3 font-display font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Para quem é
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {audience.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}

            <div className="rounded-2xl bg-gradient-brand p-5 text-primary-foreground shadow-elegant">
              <p className="font-display text-lg font-bold">Vamos conversar?</p>
              <p className="mt-1 text-sm opacity-90">Diagnóstico inicial gratuito.</p>
              <a
                href={buildWhatsappLink(serviceMessage(service.title), whatsapp)}
                target="_blank" rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary"
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </article>

      <Footer />
    </div>
  );
}
