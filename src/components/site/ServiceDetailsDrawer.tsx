import { useEffect, useMemo, useState } from "react";
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
  Search, Check, Clock, MessageCircle, ListChecks, Wrench,
  Workflow, Sparkles,
} from "lucide-react";

interface ServiceDetail {
  id: string; slug: string; title: string; description: string; icon: string;
  long_description: string | null; price_text: string | null;
  duration_estimate: string | null;
  target_audience: string[] | null; deliverables: string[] | null;
  faq: { q: string; a: string }[] | null; tags: string[] | null;
}

interface AllService {
  slug: string; title: string; description: string;
}

interface Props {
  slug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------- Highlight matched text ----------
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "ig"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="rounded bg-[color:var(--accent-cyan)]/30 px-0.5 text-foreground">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- Simple fuzzy / similarity scoring ----------
function similarity(a: string, b: string): number {
  const A = a.toLowerCase().trim();
  const B = b.toLowerCase().trim();
  if (!A || !B) return 0;
  if (B.includes(A) || A.includes(B)) return 0.9;
  const aTokens = A.split(/\s+/);
  const bTokens = new Set(B.split(/\s+/));
  const hits = aTokens.filter((t) => t.length > 2 && [...bTokens].some((bt) => bt.includes(t) || t.includes(bt))).length;
  return hits / Math.max(aTokens.length, 1);
}

export function ServiceDetailsDrawer({ slug, open, onOpenChange }: Props) {
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | undefined>();
  const [allServices, setAllServices] = useState<AllService[]>([]);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => setWhatsapp(data?.value || undefined));
    supabase.from("services").select("slug,title,description").eq("active", true)
      .then(({ data }) => setAllServices((data as AllService[]) ?? []));
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

  // ---------- Filtering per section ----------
  const term = q.trim().toLowerCase();
  const matches = (s: string) => !term || s.toLowerCase().includes(term);

  const deliverables = (service?.deliverables ?? []).filter(matches);
  const tags = (service?.tags ?? []).filter(matches);
  const steps: { title: string; text: string }[] = useMemo(() => {
    if (!service) return [];
    const list: { title: string; text: string }[] = [];
    if (service.long_description) {
      // Split markdown into paragraphs as steps
      service.long_description
        .split(/\n{2,}/)
        .map((p) => p.replace(/^#+\s*/, "").trim())
        .filter(Boolean)
        .forEach((p, idx) => list.push({ title: `Etapa ${idx + 1}`, text: p }));
    }
    (service.faq ?? []).forEach((f) => list.push({ title: f.q, text: f.a }));
    return list;
  }, [service]);
  const filteredSteps = steps.filter((s) => matches(s.title) || matches(s.text));

  const hasAnyContent =
    deliverables.length > 0 || tags.length > 0 || filteredSteps.length > 0;
  const noResults = term.length > 0 && !hasAnyContent && !loading;

  // ---------- Suggestion when nothing found ----------
  const bestMatch = useMemo(() => {
    if (!term) return null;
    const scored = allServices
      .filter((s) => s.slug !== service?.slug)
      .map((s) => ({
        s,
        score: Math.max(
          similarity(term, s.title),
          similarity(term, s.description) * 0.7
        ),
      }))
      .sort((a, b) => b.score - a.score);
    const top = scored[0];
    return top && top.score >= 0.34 ? top.s : null;
  }, [term, allServices, service]);

  const Icon = service ? getIcon(service.icon) : Sparkles;

  // ---------- WhatsApp links ----------
  const waLinkPrimary = service
    ? buildWhatsappLink(serviceMessage(service.title), whatsapp)
    : buildWhatsappLink(`Olá Larissa! Tenho interesse em conversar.`, whatsapp);

  const waLinkNotFound = (() => {
    const ctx = service ? `(estava vendo "${service.title}")` : "";
    if (bestMatch) {
      return buildWhatsappLink(
        `Olá Larissa! Procurei por "${q}" no seu site ${ctx} e não achei direto, ` +
        `mas vi que você oferece "${bestMatch.title}" — pode ser parecido com o que preciso? ` +
        `Conseguimos conversar?`,
        whatsapp
      );
    }
    return buildWhatsappLink(
      `Olá Larissa! Procurei por "${q}" no seu site ${ctx} e não encontrei. ` +
      `Você consegue fazer algo personalizado nessa linha?`,
      whatsapp
    );
  })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[95vw] sm:w-[60vw] md:w-[50vw] lg:w-[40vw] sm:max-w-none overflow-y-auto p-0"
      >
        {/* HEADER */}
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
              placeholder="Tem alguma dúvida específica? Pesquise aqui (ex: Word, prazos…)"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-5 space-y-7 pb-32">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando detalhes…</p>
          )}

          {/* O que entregamos */}
          {!loading && service && deliverables.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <ListChecks className="h-4 w-4 text-primary" /> O que entregamos
              </h3>
              <ul className="grid gap-2">
                {deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span><Highlight text={d} term={term} /></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Como funciona */}
          {!loading && service && filteredSteps.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <Workflow className="h-4 w-4 text-primary" /> Como funciona
              </h3>
              <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                {filteredSteps.map((s, i) => (
                  <li key={i} className="relative flex gap-3 rounded-xl border border-border bg-card p-3 pl-4">
                    <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-elegant">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Highlight text={s.title} term={term} />
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-foreground whitespace-pre-line">
                        <Highlight text={s.text} term={term} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Ferramentas */}
          {!loading && service && tags.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <Wrench className="h-4 w-4 text-primary" /> Ferramentas
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span key={i} className="inline-flex items-center rounded-full border border-primary/30 bg-gradient-brand-soft px-3 py-1 text-xs font-semibold text-[color:var(--accent-violet)]">
                    <Highlight text={t} term={term} />
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Nada encontrado */}
          {noResults && (
            <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-brand-soft/50 p-5 text-center">
              <ListChecks className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="font-display font-semibold">
                Não encontrou “{q}”?
              </p>
              {bestMatch ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Mas talvez o serviço <strong className="text-foreground">{bestMatch.title}</strong> seja
                  o que você precisa — ou eu posso fazer algo <strong>personalizado sob demanda</strong>.
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Eu também faço <strong>soluções personalizadas sob demanda</strong>. Me chama no WhatsApp que a gente conversa.
                </p>
              )}
              <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
                {bestMatch && (
                  <button
                    onClick={() => { setQ(""); /* abre o sugerido */
                      onOpenChange(false);
                      setTimeout(() => {
                        const evt = new CustomEvent("daina:open-service", { detail: bestMatch.slug });
                        window.dispatchEvent(evt);
                      }, 250);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-card px-5 py-2.5 text-sm font-semibold"
                  >
                    Ver “{bestMatch.title}”
                  </button>
                )}
                <a
                  href={waLinkNotFound}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
                >
                  <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>

        {/* STICKY CTA */}
        {!loading && service && (
          <div className="fixed bottom-0 right-0 w-[95vw] sm:w-[60vw] md:w-[50vw] lg:w-[40vw] border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
            <a
              href={waLinkPrimary}
              target="_blank" rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              <MessageCircle className="h-4 w-4" />
              Solicitar orçamento personalizado
            </a>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
