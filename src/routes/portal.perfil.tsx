import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save, Loader2, ShieldAlert } from "lucide-react";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [requesting, setRequesting] = useState(false);

  async function requestDeletion() {
    if (!user) return;
    setRequesting(true);
    const { error } = await supabase.functions.invoke("request-data-deletion", {
      body: {
        user_id: user.id,
        user_email: data.email || user.email,
        user_name: data.full_name || "Sem nome",
        reason: reason.trim() || undefined,
      },
    });
    setRequesting(false);
    if (error) { toast.error("Não foi possível enviar a solicitação."); return; }
    toast.success("Solicitação enviada! A Larissa responderá em até 15 dias.");
    setDeleteOpen(false);
    setReason("");
  }

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

      {/* Seção LGPD — Direitos do titular dos dados */}
      <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-card md:p-8">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold">Seus direitos LGPD</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Conforme o Art. 18 da LGPD, você pode solicitar a exclusão de todos os seus dados pessoais a qualquer momento. A Larissa receberá sua solicitação por e-mail e responderá em até 15 dias.
            </p>
          </div>
        </div>

        {!deleteOpen ? (
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 text-sm font-semibold text-destructive transition-smooth hover:bg-destructive/10"
          >
            Solicitar exclusão dos meus dados
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-background p-4">
            <label className="block text-sm font-medium">Motivo (opcional)</label>
            <textarea
              rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Conte brevemente o motivo, se desejar..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={requestDeletion} disabled={requesting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {requesting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar solicitação
              </button>
              <button
                onClick={() => { setDeleteOpen(false); setReason(""); }}
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
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
