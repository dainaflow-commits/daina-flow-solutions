import { createFileRoute } from "@tanstack/react-router";
import { PublicNav } from "@/components/site/PublicNav";
import { HeroSection } from "@/components/site/HeroSection";
import { AboutSection } from "@/components/site/AboutSection";
import { DifferentialSection } from "@/components/site/DifferentialSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { ResultsSection } from "@/components/site/ResultsSection";
import { ContactSection } from "@/components/site/ContactSection";
import { Footer } from "@/components/site/Footer";
import { WhatsappFloat } from "@/components/site/WhatsappFloat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daina Flow — Transformando dados em decisões inteligentes" },
      { name: "description", content: "Larissa Daina · Analista Administrativa Jr. especialista em People Analytics, Governança de Dados e Automação Low-code/No-code." },
      { property: "og:title", content: "Daina Flow — Transformando dados em decisões" },
      { property: "og:description", content: "Soluções práticas em People Analytics, automação e dashboards." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main>
        <HeroSection />
        <AboutSection />
        <DifferentialSection />
        <ServicesSection />
        <ResultsSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsappFloat />
    </div>
  );
}
