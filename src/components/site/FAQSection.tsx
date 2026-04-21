import { motion } from "framer-motion";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Qual é o prazo médio de entrega de um projeto?",
    a: "Depende do escopo, mas a maioria dos projetos low-code/no-code é entregue entre 5 e 20 dias úteis. Automações simples ficam prontas em poucos dias; dashboards e sistemas mais robustos levam de 2 a 4 semanas. Te passo um cronograma claro logo na proposta.",
  },
  {
    q: "Quais ferramentas você utiliza?",
    a: "Notion, Excel/Google Sheets avançado, Power BI, Pipefy, Zapier, Make, Airtable, n8n e WhatsApp Business API. Sempre escolho a ferramenta mais adequada ao seu cenário — não te prendo a nenhuma plataforma cara desnecessariamente.",
  },
  {
    q: "Como funciona o orçamento? Tem valor fixo?",
    a: "Cada projeto é único, então o orçamento é personalizado. Faço um diagnóstico inicial gratuito pelo WhatsApp e, depois de entender o seu desafio, mando uma proposta detalhada com escopo, prazo e investimento. Sem pegadinhas.",
  },
  {
    q: "Você atende presencialmente ou só online?",
    a: "Atendo presencialmente em Igarapé-MG e região, e online para todo o Brasil. Reuniões por Google Meet, entregas e suporte por WhatsApp/e-mail.",
  },
  {
    q: "E o suporte depois que o projeto termina?",
    a: "Todo projeto tem 30 dias de suporte gratuito para ajustes. Depois disso, oferecemos planos mensais opcionais de manutenção e evolução. Você nunca fica na mão.",
  },
  {
    q: "Você usa IA nos projetos?",
    a: "Sim, uso IA como ferramenta auxiliar para acelerar análises, gerar insights e automatizar respostas — sempre com supervisão humana e total transparência. Detalhes na nossa página de Transparência.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-background py-20 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Dúvidas <span className="text-gradient-brand">frequentes</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tudo que você quer saber antes de começar.
          </p>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-card px-5 shadow-card"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
