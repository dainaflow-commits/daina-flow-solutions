import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload, ImageIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/configuracoes")({
  component: () => <DashboardLayout><Settings /></DashboardLayout>,
});

const TEXT_FIELDS: { key: string; label: string; placeholder?: string; type?: string; multiline?: boolean }[] = [
  { key: "whatsapp_number", label: "WhatsApp (formato 5531999999999)", placeholder: "5531991853920" },
  { key: "contact_email", label: "E-mail de contato", type: "email", placeholder: "larissa@dainaflow.com" },
  { key: "contact_address", label: "Endereço / atendimento", placeholder: "Igarapé-MG · Online para todo o Brasil" },
  { key: "instagram_url", label: "Instagram (URL completa)", placeholder: "https://instagram.com/seuuser" },
  { key: "linkedin_url", label: "LinkedIn (URL completa)", placeholder: "https://linkedin.com/in/seuuser" },
  { key: "hero_tagline", label: "Frase do topo (Hero)", placeholder: "Transformando dados em decisões inteligentes." },
  { key: "about_text", label: "Texto da seção Sobre Mim", multiline: true },
];

const ALL_KEYS = [
  ...TEXT_FIELDS.map((f) => f.key),
  "hero_photo_url",
  "about_photo_url",
];

function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(ALL_KEYS.map((k) => [k, ""])),
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  async function load() {
    const { data } = await supabase.from("site_settings").select("key,value");
    const map: Record<string, string> = Object.fromEntries(ALL_KEYS.map((k) => [k, ""]));
    (data ?? []).forEach((r) => { map[r.key] = r.value ?? ""; });
    setSettings(map);
  }
  useEffect(() => { load(); }, []);

  async function saveOne(key: string) {
    const { error } = await supabase.from("site_settings").upsert({ key, value: settings[key] });
    if (error) toast.error(error.message); else toast.success("Salvo");
  }

  async function saveAll() {
    setSavingAll(true);
    const rows = TEXT_FIELDS.map((f) => ({ key: f.key, value: settings[f.key] ?? "" }));
    const { error } = await supabase.from("site_settings").upsert(rows);
    setSavingAll(false);
    if (error) toast.error(error.message);
    else toast.success("Todas as informações foram salvas");
  }

  async function uploadImage(key: "hero_photo_url" | "about_photo_url", file: File) {
    setUploading(key);
    const path = `${key}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(null); return; }
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
    const url = pub.publicUrl;
    setSettings((s) => ({ ...s, [key]: url }));
    await supabase.from("site_settings").upsert({ key, value: url });
    toast.success("Imagem enviada e salva");
    setUploading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Configurações do site</h1>
          <p className="text-muted-foreground">Edite todas as informações exibidas no site público.</p>
        </div>
        <button
          onClick={saveAll}
          disabled={savingAll}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
        >
          {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar tudo
        </button>
      </div>

      <Section title="Informações de contato e identidade">
        <div className="grid gap-4 md:grid-cols-2">
          {TEXT_FIELDS.map((f) => (
            <div key={f.key} className={f.multiline ? "md:col-span-2" : ""}>
              <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
              <div className="flex gap-2">
                {f.multiline ? (
                  <textarea
                    rows={4}
                    value={settings[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={settings[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  />
                )}
                <button
                  onClick={() => saveOne(f.key)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 text-xs font-semibold hover:bg-accent"
                >
                  <Save className="h-3.5 w-3.5" /> Salvar
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <PhotoUploader
        title="Foto do Hero (topo da página)"
        currentUrl={settings.hero_photo_url}
        uploading={uploading === "hero_photo_url"}
        onUpload={(f) => uploadImage("hero_photo_url", f)}
      />
      <PhotoUploader
        title="Foto da seção Sobre Mim"
        currentUrl={settings.about_photo_url}
        uploading={uploading === "about_photo_url"}
        onUpload={(f) => uploadImage("about_photo_url", f)}
      />

      <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Dica</p>
        <p>Para gerenciar serviços e depoimentos, use os menus na barra lateral.</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function PhotoUploader({ title, currentUrl, uploading, onUpload }: { title: string; currentUrl: string; uploading: boolean; onUpload: (f: File) => void }) {
  return (
    <Section title={title}>
      <div className="flex items-center gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-secondary">
          {currentUrl ? <img src={currentUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold hover:bg-accent">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando..." : "Enviar nova foto"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      </div>
    </Section>
  );
}
