import { MessageCircle } from "lucide-react";
import { buildWhatsappLink, GENERIC_HELLO } from "@/lib/whatsapp";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function WhatsappFloat() {
  const [number, setNumber] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle()
      .then(({ data }) => setNumber(data?.value || undefined));
  }, []);

  return (
    <a
      href={buildWhatsappLink(GENERIC_HELLO, number)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[oklch(0.65_0.18_150)] text-white shadow-elegant transition-smooth hover:scale-110"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute -inset-1 -z-10 rounded-full bg-[oklch(0.65_0.18_150)] opacity-30 blur-xl animate-pulse" />
    </a>
  );
}
