import jsPDF from "jspdf";

export interface ProposalForPdf {
  title: string;
  intro?: string | null;
  valid_until?: string | null;
  total: number;
  client_name: string;
  signature_data?: string | null;
  signer_name?: string | null;
  signed_at?: string | null;
  items: { description: string; quantity: number; unit_price: number }[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export function generateProposalPdf(p: ProposalForPdf) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, w, 30, "F");
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Daina Flow", 14, 19);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Proposta Comercial", w - 14, 19, { align: "right" });

  // Title block
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(p.title, 14, 45);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`Cliente: ${p.client_name}`, 14, 53);
  if (p.valid_until) doc.text(`Validade: ${new Date(p.valid_until).toLocaleDateString("pt-BR")}`, 14, 59);

  let y = 70;
  if (p.intro) {
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(p.intro, w - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

  // Items table
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, w - 28, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text("Descrição", 17, y + 5.5);
  doc.text("Qtd", w - 80, y + 5.5);
  doc.text("Unitário", w - 60, y + 5.5);
  doc.text("Total", w - 17, y + 5.5, { align: "right" });
  y += 12;

  doc.setFont("helvetica", "normal");
  for (const it of p.items) {
    const lines = doc.splitTextToSize(it.description, 100);
    doc.text(lines, 17, y);
    doc.text(String(it.quantity), w - 80, y);
    doc.text(fmt(it.unit_price), w - 60, y);
    doc.text(fmt(it.quantity * it.unit_price), w - 17, y, { align: "right" });
    y += Math.max(6, lines.length * 5);
    if (y > 250) { doc.addPage(); y = 20; }
  }

  // Total
  y += 4;
  doc.setDrawColor(200);
  doc.line(14, y, w - 14, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total", 14, y);
  doc.text(fmt(p.total), w - 14, y, { align: "right" });

  // Assinatura
  if (p.signature_data) {
    y += 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text("Aceite digital:", 14, y);
    try {
      doc.addImage(p.signature_data, "PNG", 14, y + 3, 70, 25);
    } catch {}
    if (p.signer_name) doc.text(`${p.signer_name}`, 14, y + 33);
    if (p.signed_at) doc.text(`Em ${new Date(p.signed_at).toLocaleString("pt-BR")}`, 14, y + 39);
  }

  doc.save(`proposta-${p.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
