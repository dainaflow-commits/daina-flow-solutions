import jsPDF from "jspdf";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);

export interface QuoteTier {
  name: string;
  price_min: number;
  price_max: number;
  scope_summary: string;
  justification: string;
  estimated_hours: number;
  ideal_for: string;
}

export interface QuotePdfData {
  description: string;
  complexity?: string;
  deadline?: string;
  urgency?: string;
  client_profile?: string;
  pricing_style?: string;
  analysis: string;
  pricing_strategy?: string;
  recommended_tier?: string;
  red_flags?: string[];
  tiers: QuoteTier[];
  created_at?: string;
}

function brandHeader(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, w, 30, "F");
  doc.setFillColor(139, 92, 246);
  doc.rect(w * 0.55, 0, w * 0.45, 30, "F");

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Daina Flow", 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("People Analytics · Governança de Dados · Automação Low-code", 14, 21);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Orçamento Sugerido", w - 14, 18, { align: "right" });
}

function brandFooter(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220);
  doc.line(14, h - 22, w - 14, h - 22);
  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text("Daina Flow · Larissa Daina · Igarapé-MG · dainaflow.com", 14, h - 15);
  doc.setFontSize(7);
  doc.text("Orçamento estimado, sujeito a refinamento após escopo definitivo.", 14, h - 10);
  doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, w - 14, h - 10, { align: "right" });
}

function ensure(doc: jsPDF, y: number, needed = 20) {
  const h = doc.internal.pageSize.getHeight();
  if (y + needed > h - 26) {
    brandFooter(doc);
    doc.addPage();
    brandHeader(doc);
    return 40;
  }
  return y;
}

export function generateQuotePdf(q: QuotePdfData) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  brandHeader(doc);

  let y = 42;
  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const date = q.created_at ? new Date(q.created_at) : new Date();
  doc.text(`Emissão: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, 14, y);
  y += 8;

  // Serviço
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(14, 116, 144);
  doc.text("Serviço descrito", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
  const desc = doc.splitTextToSize(q.description, w - 28);
  doc.text(desc, 14, y); y += desc.length * 5 + 4;

  // Parâmetros
  const params = [
    ["Complexidade", q.complexity || "—"],
    ["Prazo", q.deadline || "—"],
    ["Urgência", q.urgency || "—"],
    ["Perfil do cliente", q.client_profile || "—"],
    ["Estilo de cobrança", q.pricing_style || "—"],
  ];
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, w - 28, params.length * 6 + 6, 3, 3, "F");
  y += 5;
  for (const [k, v] of params) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(60);
    doc.text(k, 18, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(30);
    doc.text(String(v), 70, y);
    y += 6;
  }
  y += 4;

  // Análise
  y = ensure(doc, y, 30);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(14, 116, 144);
  doc.text("Análise", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
  const an = doc.splitTextToSize(q.analysis, w - 28);
  doc.text(an, 14, y); y += an.length * 5 + 4;

  if (q.pricing_strategy) {
    y = ensure(doc, y, 18);
    doc.setFillColor(245, 243, 255);
    const ps = doc.splitTextToSize(`Estratégia: ${q.pricing_strategy}`, w - 36);
    const ph = ps.length * 5 + 8;
    doc.roundedRect(14, y, w - 28, ph, 3, 3, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 50, 130);
    doc.text(ps, 18, y + 6);
    y += ph + 4;
  }

  // Tiers
  for (const t of q.tiers) {
    y = ensure(doc, y, 50);
    const isRec = q.recommended_tier === t.name;
    doc.setDrawColor(isRec ? 14 : 220, isRec ? 165 : 220, isRec ? 233 : 220);
    doc.setLineWidth(isRec ? 0.8 : 0.3);
    const startY = y;
    y += 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20);
    doc.text(t.name + (isRec ? "  ★ Recomendado" : ""), 18, y); y += 6;

    doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(14, 116, 144);
    const price = t.price_max > t.price_min ? `${fmt(t.price_min)} — ${fmt(t.price_max)}` : fmt(t.price_min);
    doc.text(price, 18, y); y += 6;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`${t.estimated_hours}h estimadas · Ideal para: ${t.ideal_for}`, 18, y); y += 6;

    doc.setFontSize(10); doc.setTextColor(40);
    const scope = doc.splitTextToSize(t.scope_summary, w - 36);
    doc.text(scope, 18, y); y += scope.length * 5 + 3;

    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(60);
    doc.text("Por que esse valor?", 18, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setTextColor(60);
    const just = doc.splitTextToSize(t.justification, w - 36);
    doc.text(just, 18, y); y += just.length * 5 + 5;

    doc.setLineWidth(isRec ? 0.8 : 0.3);
    doc.setDrawColor(isRec ? 14 : 220, isRec ? 165 : 220, isRec ? 233 : 220);
    doc.roundedRect(14, startY, w - 28, y - startY, 4, 4, "S");
    y += 6;
  }

  if (q.red_flags && q.red_flags.length) {
    y = ensure(doc, y, 30);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(190, 30, 50);
    doc.text("Atenção / Sinais de alerta", 14, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
    for (const f of q.red_flags) {
      const fl = doc.splitTextToSize(`• ${f}`, w - 28);
      y = ensure(doc, y, fl.length * 5);
      doc.text(fl, 14, y); y += fl.length * 5 + 1;
    }
  }

  brandFooter(doc);
  const filename = `orcamento-daina-flow-${date.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return { filename };
}
