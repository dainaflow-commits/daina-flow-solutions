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
  Search, Check, Clock, MessageCircle, ListChecks, Wrench,
  Workflow, Sparkles, Users, HelpCircle, ArrowRight, ChevronDown,
} from "lucide-react";

interface ServiceDetail {
  id: string; slug: string; title: string; description: string; icon: string;
  long_description: string | null; price_text: string | null;
  duration_estimate: string | null;
  target_audience: string[] | null; deliverables: string[] | null;
  faq: { q: string; a: string }[] | null; tags: string[] | null;
}

interface AllService { slug: string; title: string; description: string; }

interface Props {
  slug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ---------- helpers ---------- */
function escapeRegExp(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{renderInline(text)}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "ig"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="rounded bg-[color:var(--accent-cyan)]/30 px-0.5 text-foreground">{p}</mark>
        ) : (
          <span key={i}>{renderInline(p)}</span>
        )
      )}
    </>
  );
}

/** Renders **bold** inline markdown safely. */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

/** Parse markdown long_description into structured blocks. */
type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ol"; items: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "quote"; text: string };

function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^#{1,6}\s+/.test(line)) {
      blocks.push({ kind: "heading", text: line.replace(/^#+\s*/, "").trim() });
      i++; continue;
    }
    if (/^>\s+/.test(line)) {
      const text = line.replace(/^>\s*/, "").trim();
      blocks.push({ kind: "quote", text }); i++; continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, "").trim()); i++;
      }
      blocks.push({ kind: "ol", items }); continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, "").trim()); i++;
      }
      blocks.push({ kind: "ul", items }); continue;
    }
    // paragraph: accumulate until blank
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>\s|\d+\.\s|[-*]\s)/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    blocks.push({ kind: "paragraph", text: buf.join(" ").trim() });
  }
  return blocks;
}

function blockText(b: Block): string {
  if (b.kind === "ol" || b.kind === "ul") return b.items.join(" ");
  return b.text;
}

function similarity(a: string, b: string): number {
  const A = a.toLowerCase().trim(); const B = b.toLowerCase().trim();
  if (!A || !B) return 0;
  if (B.includes(A) || A.includes(B)) return 0.9;
  const aTokens = A.split(/\s+/);
  const bTokens = new Set(B.split(/\s+/));
  const hits = aTokens.filter(t => t.length > 2 && [...bTokens].some(bt => bt.includes(t) || t.includes(bt))).length;
  return hits / Math.max(aTokens.length, 1);
}

/* ---------- Collapsible section ---------- */
function Section({
  icon: Icon, title, defaultOpen = true, children, count,
}: { icon: any; title: string; defaultOpen?: boolean; children: React.ReactNode; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-smooth"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">{title}</span>
          {typeof count === "number" && count > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{count}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </section>
  );
}

/* ============================================================ */
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
    setLoading(true); setService(null); setQ("");
    supabase
      .from("services")
      .select("id,slug,title,description,icon,long_description,price_text,duration_estimate,target_audience,deliverables,faq,tags")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => { setService(data as ServiceDetail | null); setLoading(false); });
  }, [slug, open]);

  const term = q.trim().toLowerCase();
  const matches = (s: string) => !term || s.toLowerCase().includes(term);

  const blocks = useMemo<Block[]>(
    () => service?.long_description ? parseMarkdown(service.long_description) : [],
    [service]
  );
  const filteredBlocks = blocks.filter(b => matches(blockText(b)));
  const deliverables = (service?.deliverables ?? []).filter(matches);
  const audience = (service?.target_audience ?? []).filter(matches);
  const tags = (service?.tags ?? []).filter(matches);
  const faq = (service?.faq ?? []).filter(f => matches(f.q) || matches(f.a));

  const hasAnyContent =
    filteredBlocks.length + deliverables.length + audience.length + tags.length + faq.length > 0;
  const noResults = term.length > 0 && !hasAnyContent && !loading;

  const bestMatch = useMemo(() => {
    if (!term) return null;
    const scored = allServices
      .filter(s => s.slug !== service?.slug)
      .map(s => ({ s, score: Math.max(similarity(term, s.title), similarity(term, s.description) * 0.7) }))
      .sort((a, b) => b.score - a.score);
    const top = scored[0];
    return top && top.score >= 0.34 ? top.s : null;
  }, [term, allServices, service]);

  const Icon = service ? getIcon(service.icon) : Sparkles;

  const waLinkPrimary = service
    ? buildWhatsappLink(serviceMessage(service.title), whatsapp)
    : buildWhatsappLink(`Olá Larissa! Tenho interesse em conversar.`, whatsapp);

  const waLinkNotFound = (() => {
    const ctx = service ? `(estava vendo "${service.title}")` : "";
    if (bestMatch) {
      return buildWhatsappLink(
        `Olá Larissa! Procurei por "${q}" no seu site ${ctx} e não achei direto, mas vi que você oferece "${bestMatch.title}" — pode ser parecido com o que preciso? Conseguimos conversar?`,
        whatsapp
      );
    }
    return buildWhatsappLink(
      `Olá Larissa! Procurei por "${q}" no seu site ${ctx} e não encontrei. Você consegue fazer algo personalizado nessa linha?`,
      whatsapp
    );
  })();

  /* Render a parsed block */
  const renderBlock = (b: Block, i: number) => {
    if (b.kind === "heading") {
      return (
        <h4 key={i} className="mt-3 first:mt-0 font-display text-sm font-bold text-foreground">
          <Highlight text={b.text} term={term} />
        </h4>
      );
    }
    if (b.kind === "paragraph") {
      return (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          <Highlight text={b.text} term={term} />
        </p>
      );
    }
    if (b.kind === "quote") {
      return (
        <p key={i} className="rounded-lg border-l-2 border-primary bg-gradient-brand-soft/40 px-3 py-2 text-xs italic text-foreground/80">
          <Highlight text={b.text} term={term} />
        </p>
      );
    }
    if (b.kind === "ol") {
      return (
        <ol key={i} className="space-y-2">
          {b.items.map((it, k) => (
            <li key={k} className="flex gap-2 text-sm">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-brand text-[10px] font-bold text-primary-foreground">{k + 1}</span>
              <span className="text-muted-foreground"><Highlight text={it} term={term} /></span>
            </li>
          ))}
        </ol>
      );
    }
    return (
      <ul key={i} className="space-y-1.5">
        {b.items.map((it, k) => (
          <li key={k} className="flex gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground"><Highlight text={it} term={term} /></span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[95vw] sm:w-[60vw] md:w-[50vw] lg:w-[42vw] sm:max-w-none overflow-y-auto p-0"
      >
        {/* HEADER */}
        <div className="bg-gradient-brand-soft/60 px-6 pt-6 pb-5 border-b border-border">
          <SheetHeader className="text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-elegant">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <SheetTitle className="font-display text-xl leading-tight">
                  {loading ? "Carregando…" : service?.title ?? "Serviço"}
                </SheetTitle>
                {service?.description && (
                  <SheetDescription className="mt-1 text-sm">{service.description}</SheetDescription>
                )}
              </div>
            </div>
            {service && (service.duration_estimate || service.price_text) && (
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

        {/* CONTENT */}
        <div className="px-5 py-5 space-y-4 pb-32">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando detalhes…</p>
          )}

          {/* Sobre o serviço */}
          {!loading && service && filteredBlocks.length > 0 && (
            <Section icon={Sparkles} title="Sobre o serviço">
              <div className="space-y-3">{filteredBlocks.map(renderBlock)}</div>
            </Section>
          )}

          {/* O que entregamos */}
          {!loading && service && deliverables.length > 0 && (
            <Section icon={ListChecks} title="O que entregamos" count={deliverables.length}>
              <ul className="grid gap-2">
                {deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-border/60 bg-background p-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span><Highlight text={d} term={term} /></span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Para quem é — chips compactos */}
          {!loading && service && audience.length > 0 && (
            <Section icon={Users} title="Para quem é" count={audience.length}>
              <ul className="flex flex-wrap gap-2">
                {audience.map((a, i) => (
                  <li key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
                    <Users className="h-3 w-3 text-primary" />
                    <span><Highlight text={a} term={term} /></span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Ferramentas */}
          {!loading && service && tags.length > 0 && (
            <Section icon={Wrench} title="Ferramentas" count={tags.length}>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span key={i} className="inline-flex items-center rounded-full border border-primary/30 bg-gradient-brand-soft px-3 py-1 text-xs font-semibold text-[color:var(--accent-violet)]">
                    <Highlight text={t} term={term} />
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* FAQ */}
          {!loading && service && faq.length > 0 && (
            <Section icon={HelpCircle} title="Perguntas frequentes" count={faq.length} defaultOpen={false}>
              <ul className="space-y-2">
                {faq.map((f, i) => (
                  <li key={i} className="rounded-lg border border-border/60 bg-background p-3">
                    <p className="text-sm font-semibold text-foreground"><Highlight text={f.q} term={term} /></p>
                    <p className="mt-1 text-sm text-muted-foreground"><Highlight text={f.a} term={term} /></p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Nada encontrado */}
          {noResults && (
            <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-brand-soft/50 p-5 text-center">
              <ListChecks className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="font-display font-semibold">Não encontrou “{q}”?</p>
              {bestMatch ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Talvez <strong className="text-foreground">{bestMatch.title}</strong> seja o que você precisa — ou eu faço algo <strong>personalizado</strong>.
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Eu também faço <strong>soluções personalizadas sob demanda</strong>.
                </p>
              )}
              <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
                {bestMatch && (
                  <button
                    onClick={() => {
                      setQ(""); onOpenChange(false);
                      setTimeout(() => window.dispatchEvent(new CustomEvent("daina:open-service", { detail: bestMatch.slug })), 250);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-card px-5 py-2.5 text-sm font-semibold"
                  >
                    Ver “{bestMatch.title}”
                  </button>
                )}
                <a
                  href={waLinkNotFound} target="_blank" rel="noreferrer"
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
          <div className="fixed bottom-0 right-0 w-[95vw] sm:w-[60vw] md:w-[50vw] lg:w-[42vw] border-t border-border bg-background/95 px-5 py-3 backdrop-blur">
            <div className="flex gap-2">
              <a
                href={waLinkPrimary} target="_blank" rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant"
              >
                <MessageCircle className="h-4 w-4" /> Quero este serviço
              </a>
              <Link
                to="/servicos/$slug"
                params={{ slug: service.slug }}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/40"
              >
                Página completa <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
