import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil — Daina Flow" }] }),
  component: () => <PortalLayout><Profile /></PortalLayout>,
});

function Profile() {
  const { user } = useAuth();
  const [data, setData] = useState({ full_name: "", email: "", phone: "", company: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("clients").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data: c }) => {
        if (c) setData({
          full_name: c.full_name ?? "",
          email: c.email ?? user.email ?? "",
          phone: c.phone ?? "",
          company: c.company ?? "",
          notes: c.notes ?? "",
        });
        setLoading(false);
      });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("clients").upsert({
      user_id: user.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil salvo");
  }

  if (loading) return <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Meu perfil</h1>
        <p className="text-muted-foreground">Mantenha seus dados atualizados para a Larissa entrar em contato.</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
        <Field label="Nome completo" value={data.full_name} onChange={(v) => setData({ ...data, full_name: v })} />
        <Field label="E-mail" type="email" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
        <Field label="WhatsApp" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} placeholder="(31) 99999-9999" />
        <Field label="Empresa (opcional)" value={data.company} onChange={(v) => setData({ ...data, company: v })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium">Observações</label>
          <textarea
            rows={4}
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
            placeholder="Algo que eu deva saber sobre você ou seu negócio..."
          />
        </div>
        <button
          onClick={save} disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-ring focus:ring-2"
      />
    </div>
  );
}
