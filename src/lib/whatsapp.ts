export const DEFAULT_WHATSAPP = "5531991853920";

export function buildWhatsappLink(message: string, number = DEFAULT_WHATSAPP) {
  const cleanNumber = number.replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function serviceMessage(serviceName: string) {
  return `Olá Larissa! Tenho interesse no serviço de ${serviceName}. Pode me passar mais detalhes?`;
}

export const GENERIC_HELLO = "Olá Larissa! Vim pelo seu site Daina Flow e gostaria de conversar.";
