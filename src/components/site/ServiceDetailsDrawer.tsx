import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/icon-map";
import { buildWhatsappLink, serviceMessage } from "@/lib/whatsapp";
import {
  Search, Check, Sparkles, Users, Clock, ArrowRight,
  MessageCircle, ListChecks, HelpCircle, Target,
} from "lucide-react";

interface ServiceDetail {
  id: string; slug: string; title: string; description: string; icon: string;
  long_description: string | null; price_text: string | null;
  duration_estimate: string | null;
  target_audience: string[] | null; deliverables: string[] | null;
  faq: { q: string; a: string }[] | null; tags: string[] | null;
}

interface Props {
  slug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Step {
  icon: typeof Target;
  label: string;
  text: string;
  group: "publico" | "entrega" | "faq" | "sobre";
}

export function ServiceDetailsDrawer({ slug, open, onOpenChange }: Props) {
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | undefined>();

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => setWhatsapp(data?.value || undefined));
  }, []);

  useEffect(() => {
    if (!slug || !open) return;
    setLoading(true);
    setService(null);
    setQ("");
    supabase
      .from("services")
      .select("id,slug,title,description,icon,long_description,price_text,duration_estimate,target_audience,deliverables,faq,tags")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setService(data as ServiceDetail | null);
        setLoading(false);
      });
  }, [slug, open]);

  const steps: Step[] = useMemo(() => {
    if (!service) return [];
    const out: Step[] = [];
    if (service.long_description) {
      out.push({ icon: Sparkles, label: "Sobre o serviço", text: service.long_description, group: "sobre" });
    }
    (service.target_audience ?? []).forEach((a) =>
      out.push({ icon: Users, label: "Para quem é", text: a, group: "publico" })
    );
    (service.deliverables ?? []).forEach((d) =>
      out.push({ icon: Check, label: "Você recebe", text: d, group: "entrega" })
    );
    (service.faq ?? []).forEach((f) =>
      out.push({ icon: HelpCircle, label: f.q, text: f.a, group: "faq" })
    );
    return out;
  }, [service]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return steps;
    return steps.filter((s) =>
      `${s.label} ${s.text}`.toLowerCase().includes(term)
    );
  }, [steps, q]);

  const noResults = q.trim().length > 0 && filtered.length === 0 && !loading;
  const Icon = service ? getIcon(service.icon) : Sparkles;

  const waLink = service
    ? buildWhatsappLink(serviceMessage(service.title), whatsapp)
    : buildWhatsappLink(
        `Olá Larissa! Procurei por "${q}" no seu site mas não encontrei. Vocês fazem isso?`,
        whatsapp
      );

  const customWaLink = buildWhatsappLink(
    service
      ? `Olá Larissa! Estou vendo o serviço "${service.title}" mas preciso de algo personalizado: "${q}". Conseguimos conversar?`
      : `Olá Larissa! Procurei por "${q}" no seu site mas não encontrei. Vocês fazem isso sob demanda?`,
    whatsapp
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="bg-gradient-brand-soft/60 px-6 pt-6 pb-5 border-b border-border">
          <SheetHeader className="text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-elegant">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <SheetTitle className="font-display text-xl">
                  {loading ? "Carregando…" : service?.title ?? "Serviço"}
                </SheetTitle>
                {service?.description && (
                  <SheetDescription className="mt-1">{service.description}</SheetDescription>
                )}
              </div>
            </div>
            {service && (
              <div className="flex flex-wrap gap-2 text-xs">
                {service.duration_estimate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1">
                    <Clock className="h-3 w-3" /> {service.duration_estimate}
                  </span>
                )}
                {service.price_text && (
                  <span className="inline-flex items-center rounded-full bg-gradient-brand px-3 py-1 font-semibold text-primary-foreground">
                    {service.price_text}
                  </span>
                )}
              </div>
            )}
          </SheetHeader>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nas etapas, entregas, FAQ…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando detalhes…</p>
          )}

          {!loading && service && filtered.length > 0 && (
            <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {filtered.map((s, i) => {
                const StepIcon = s.icon;
                return (
                  <li key={i} className="relative flex gap-3 rounded-xl border border-border bg-card p-3 pl-4">
                    <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-brand text-primary-foreground shadow-elegant">
                      <StepIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-foreground whitespace-pre-line">
                        {s.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {noResults && (
            <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-brand-soft/50 p-5 text-center">
              <ListChecks className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="font-display font-semibold">
                Não encontrou o que precisava?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Eu também faço <strong>soluções personalizadas sob demanda</strong>. Me chama no WhatsApp que a gente conversa.
              </p>
              <a
                href={customWaLink}
                target="_blank" rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
              >
                <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
              </a>
            </div>
          )}

          {!loading && service && (
            <div className="sticky bottom-0 -mx-6 mt-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={waLink}
                  target="_blank" rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
                >
                  <MessageCircle className="h-4 w-4" /> Quero este serviço
                </a>
                <Link
                  to="/servicos/$slug"
                  params={{ slug: service.slug }}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold"
                >
                  Página completa <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
