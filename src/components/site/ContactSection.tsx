import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  service_interest: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Conte um pouquinho mais").max(1500),
});

export function ContactSection() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", service_interest: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      service_interest: parsed.data.service_interest || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    toast.success("Mensagem enviada! Em breve a Larissa entra em contato.");
    setForm({ name: "", email: "", phone: "", service_interest: "", message: "" });
  }

  return (
    <section id="contato" className="bg-background py-20 md:py-28">
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            Vamos conversar
          </span>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Pronta para <span className="text-gradient-brand">transformar dados</span> em decisões?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Me conte um pouco sobre o seu desafio. Respondo em até 24h com uma proposta
            inicial sem compromisso.
          </p>
          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <p className="text-sm font-semibold">Atendimento</p>
            <p className="mt-1 text-sm text-muted-foreground">Igarapé-MG · Online para todo o Brasil</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Seu nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="WhatsApp (opcional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Serviço de interesse (opcional)" value={form.service_interest} onChange={(v) => setForm({ ...form, service_interest: v })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Sua mensagem</label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
              placeholder="Me conte sobre o seu desafio..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar mensagem
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring focus:ring-2"
      />
    </div>
  );
}
