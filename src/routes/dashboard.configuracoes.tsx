import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload, ImageIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/configuracoes")({
  component: () => <DashboardLayout><Settings /></DashboardLayout>,
});

function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    whatsapp_number: "", hero_photo_url: "", about_photo_url: "",
  });
  const [uploading, setUploading] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("site_settings").select("key,value");
    const map: Record<string, string> = { whatsapp_number: "", hero_photo_url: "", about_photo_url: "" };
    (data ?? []).forEach(r => { map[r.key] = r.value ?? ""; });
    setSettings(map);
  }
  useEffect(() => { load(); }, []);

  async function saveOne(key: string) {
    const { error } = await supabase.from("site_settings").upsert({ key, value: settings[key] });
    if (error) toast.error(error.message); else toast.success("Salvo");
  }

  async function uploadImage(key: "hero_photo_url" | "about_photo_url", file: File) {
    setUploading(key);
    const path = `${key}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(null); return; }
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
    const url = pub.publicUrl;
    setSettings(s => ({ ...s, [key]: url }));
    await supabase.from("site_settings").upsert({ key, value: url });
    toast.success("Imagem enviada e salva");
    setUploading(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize informações exibidas no site.</p>
      </div>

      <Section title="WhatsApp">
        <p className="mb-2 text-xs text-muted-foreground">Formato internacional, ex.: 5531991853920</p>
        <div className="flex gap-2">
          <input
            value={settings.whatsapp_number}
            onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
          <button onClick={() => saveOne("whatsapp_number")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground">
            <Save className="h-4 w-4" /> Salvar
          </button>
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
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
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
