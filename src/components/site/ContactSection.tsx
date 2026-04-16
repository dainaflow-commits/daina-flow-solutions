import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Mail, MapPin, LogIn } from "lucide-react";
import { buildWhatsappLink, leadMessage } from "@/lib/whatsapp";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  service_interest: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Conte um pouquinho mais").max(1500),
});

export function ContactSection() {
  const { session, fullName, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", service_interest: "", message: "",
  });
  const [info, setInfo] = useState({ whatsapp: "", email: "", address: "" });

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["whatsapp_number", "contact_email", "contact_address"])
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
        setInfo({
          whatsapp: m.whatsapp_number ?? "",
          email: m.contact_email ?? "",
          address: m.contact_address ?? "Igarapé-MG · Online para todo o Brasil",
        });
      });
  }, []);

  // Auto preenche nome/email se logado
  useEffect(() => {
    if (session && user) {
      setForm((f) => ({
        ...f,
        name: f.name || fullName || "",
        email: f.email || user.email || "",
      }));
    }
  }, [session, user, fullName]);

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
      service_interest: parsed.data.service_interest || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    toast.success("Mensagem enviada! Abrindo o WhatsApp...");
    const link = buildWhatsappLink(leadMessage(parsed.data), info.whatsapp);
    window.open(link, "_blank", "noopener,noreferrer");
    if (!session) setForm({ name: "", email: "", service_interest: "", message: "" });
    else setForm((f) => ({ ...f, service_interest: "", message: "" }));
  }

  return (
    <section id="contato" className="bg-background py-20 md:py-28">
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1fr_1.2fr]">
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            Vamos conversar
          </span>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Pronta para <span className="text-gradient-brand">transformar dados</span> em decisões?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Me conte um pouco sobre o seu desafio. Os campos marcados com{" "}
            <span className="font-semibold text-destructive">*</span> são obrigatórios.
            {!session && (
              <> <strong>Faça login</strong> para enviar mensagens personalizadas com seu nome.</>
            )}
          </p>

          <ul className="space-y-3 pt-2">
            {info.whatsapp && (
              <ContactItem
                icon={<MessageCircle className="h-4 w-4" />}
                label="WhatsApp"
                value={formatPhone(info.whatsapp)}
              />
            )}
            {info.email && (
              <ContactItem
                icon={<Mail className="h-4 w-4" />}
                label="E-mail"
                value={info.email}
              />
            )}
            <ContactItem
              icon={<MapPin className="h-4 w-4" />}
              label="Atendimento"
              value={info.address}
            />
          </ul>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {!session && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="text-sm font-semibold">Quer enviar com seu perfil?</p>
                <p className="text-xs text-muted-foreground">Faça login e a mensagem vai personalizada com seu nome.</p>
              </div>
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-elegant"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </Link>
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field required label="Seu nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field required label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Serviço de interesse" value={form.service_interest} onChange={(v) => setForm({ ...form, service_interest: v })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Sua mensagem <span className="text-destructive">*</span>
              </label>
              <textarea
                required
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
              Enviar e abrir no WhatsApp
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Ao enviar, abriremos o WhatsApp da Larissa com sua mensagem pré-preenchida.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-primary-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </li>
  );
}

function Field({
  label, value, onChange, type = "text", required = false, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring focus:ring-2"
      />
    </div>
  );
}

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return raw;
}
