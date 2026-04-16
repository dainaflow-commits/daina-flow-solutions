import heroImg from "@/assets/larissa-hero.jpg";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { buildWhatsappLink, GENERIC_HELLO } from "@/lib/whatsapp";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function HeroSection() {
  const [photo, setPhoto] = useState<string>(heroImg);
  const [whatsapp, setWhatsapp] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["hero_photo_url", "whatsapp_number"])
      .then(({ data }) => {
        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
        if (map.hero_photo_url) setPhoto(map.hero_photo_url);
        if (map.whatsapp_number) setWhatsapp(map.whatsapp_number);
      });
  }, []);

  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-40" />
      <div className="container relative mx-auto grid items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24 lg:py-32">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-violet)]" />
            People Analytics · Governança de Dados · Low-code
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            Transformando <span className="text-gradient-brand">dados</span> em decisões{" "}
            <span className="text-gradient-brand">inteligentes</span>.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Combino visão administrativa com automação técnica (Low-code/No-code) para
            entregar soluções práticas, inteligentes e que realmente geram resultado.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={buildWhatsappLink(GENERIC_HELLO, whatsapp)}
              target="_blank" rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com a Larissa no WhatsApp
            </a>
            <a
              href="#servicos"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground shadow-card transition-smooth hover:border-primary/40"
            >
              Ver todos os serviços
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-brand opacity-25 blur-3xl" />
          <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-elegant">
            <img
              src={photo}
              alt="Larissa Daina"
              width={1024}
              height={1024}
              className="aspect-square h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card">
            <p className="text-xs text-muted-foreground">Larissa Daina · 22 anos</p>
            <p className="text-sm font-semibold">Analista Administrativa Jr.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
