export const DEFAULT_WHATSAPP = "5531991853920";

export function buildWhatsappLink(message: string, number?: string | null) {
  const cleanNumber = (number || DEFAULT_WHATSAPP).replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function serviceMessage(serviceName: string) {
  return `Olá Larissa! Tenho interesse no serviço de ${serviceName}. Pode me passar mais detalhes?`;
}

export const GENERIC_HELLO =
  "Olá Larissa! Vim pelo seu site Daina Flow e gostaria de conversar.";

export interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  service_interest?: string;
  message: string;
}

export function leadMessage(d: LeadFormData) {
  const lines = [
    `Olá Larissa! Sou ${d.name} e vim pelo site Daina Flow.`,
    d.email ? `📧 E-mail: ${d.email}` : null,
    d.phone ? `📱 WhatsApp: ${d.phone}` : null,
    d.service_interest ? `💡 Interesse: ${d.service_interest}` : null,
    "",
    d.message,
  ].filter(Boolean);
  return lines.join("\n");
}
