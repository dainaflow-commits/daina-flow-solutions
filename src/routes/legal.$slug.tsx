import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PublicNav } from "@/components/site/PublicNav";
import { Footer } from "@/components/site/Footer";

const VALID = ["privacidade", "termos", "transparencia"] as const;

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    if (!VALID.includes(params.slug as any)) throw notFound();
    const { data } = await supabase
      .from("legal_documents")
      .select("title, content_markdown, updated_at")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Documento legal"} — Daina Flow` },
      { name: "description", content: `${loaderData?.title} da Daina Flow.` },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <p className="text-sm text-muted-foreground">Erro: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">Documento não encontrado</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">Voltar ao início</Link>
      </div>
    </div>
  ),
  component: LegalPage,
});

function renderMd(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];
  const flushList = () => {
    if (listBuf.length) {
      out.push(
        <ul key={`u${out.length}`} className="my-3 list-disc space-y-1 pl-6 text-foreground/90">
          {listBuf.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(l) }} />)}
        </ul>
      );
      listBuf = [];
    }
  };
  const inline = (s: string) =>
    s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) { flushList(); return; }
    if (line.startsWith("# ")) { flushList(); out.push(<h1 key={i} className="mt-6 font-display text-3xl font-bold">{line.slice(2)}</h1>); return; }
    if (line.startsWith("## ")) { flushList(); out.push(<h2 key={i} className="mt-8 font-display text-xl font-bold text-gradient-brand">{line.slice(3)}</h2>); return; }
    if (line.startsWith("### ")) { flushList(); out.push(<h3 key={i} className="mt-4 font-semibold">{line.slice(4)}</h3>); return; }
    if (/^[-*]\s+/.test(line)) { listBuf.push(line.replace(/^[-*]\s+/, "")); return; }
    flushList();
    out.push(<p key={i} className="my-2 leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: inline(line) }} />);
  });
  flushList();
  return out;
}

function LegalPage() {
  const data = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container mx-auto max-w-3xl px-4 py-16">
        <article className="prose prose-neutral max-w-none">
          {renderMd(data.content_markdown)}
        </article>
        <p className="mt-12 text-xs text-muted-foreground">
          Atualizado em {new Date(data.updated_at).toLocaleDateString("pt-BR")}.
        </p>
      </main>
      <Footer />
    </div>
  );
}
