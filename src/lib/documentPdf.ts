import jsPDF from "jspdf";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function header(doc: jsPDF, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  // Faixa gradiente simulada
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, w, 28, "F");
  doc.setFillColor(139, 92, 246);
  doc.rect(w * 0.55, 0, w * 0.45, 28, "F");

  // "logo" textual + slogan
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Daina Flow", 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("People Analytics · Governança · Automação", 14, 19);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(subtitle, w - 14, 17, { align: "right" });
}

function footer(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220);
  doc.line(14, h - 18, w - 14, h - 18);
  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Daina Flow · Larissa Daina dos Santos Quirino · Igarapé-MG", 14, h - 11);
  const pageStr = `Página ${doc.getCurrentPageInfo().pageNumber}`;
  doc.text(pageStr, w - 14, h - 11, { align: "right" });
}

function ensureSpace(doc: jsPDF, y: number, needed = 20): number {
  const h = doc.internal.pageSize.getHeight();
  if (y + needed > h - 24) {
    footer(doc);
    doc.addPage();
    header(doc, "Continuação");
    return 40;
  }
  return y;
}

function renderMarkdown(doc: jsPDF, md: string, startY: number): number {
  const w = doc.internal.pageSize.getWidth();
  const maxW = w - 28;
  let y = startY;
  const lines = md.split("\n");

  for (const raw of lines) {
    const line = raw.trimEnd();
    y = ensureSpace(doc, y, 8);
    if (!line.trim()) { y += 3; continue; }

    if (line.startsWith("### ")) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20);
      const text = line.replace(/^###\s+/, "");
      const wrapped = doc.splitTextToSize(text, maxW);
      doc.text(wrapped, 14, y); y += wrapped.length * 5 + 2;
    } else if (line.startsWith("## ")) {
      y = ensureSpace(doc, y, 14);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(14, 116, 144);
      const text = line.replace(/^##\s+/, "");
      const wrapped = doc.splitTextToSize(text, maxW);
      doc.text(wrapped, 14, y); y += wrapped.length * 6 + 1;
      doc.setDrawColor(14, 165, 233); doc.setLineWidth(0.5);
      doc.line(14, y, 14 + 30, y); y += 4;
    } else if (line.startsWith("# ")) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(20);
      const text = line.replace(/^#\s+/, "");
      const wrapped = doc.splitTextToSize(text, maxW);
      doc.text(wrapped, 14, y); y += wrapped.length * 7 + 3;
    } else if (/^\s*[-*]\s+/.test(line)) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
      const text = line.replace(/^\s*[-*]\s+/, "");
      const wrapped = doc.splitTextToSize(text, maxW - 6);
      doc.text("•", 16, y);
      doc.text(wrapped, 22, y);
      y += wrapped.length * 5 + 1;
    } else if (/^\d+\.\s+/.test(line)) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
      const m = line.match(/^(\d+)\.\s+(.*)$/)!;
      const wrapped = doc.splitTextToSize(m[2], maxW - 8);
      doc.text(`${m[1]}.`, 16, y);
      doc.text(wrapped, 24, y);
      y += wrapped.length * 5 + 1;
    } else {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
      // **bold** simples
      const segments = line.split(/(\*\*[^*]+\*\*)/g);
      let x = 14;
      const lh = 5;
      // junta tudo numa string e quebra
      const plain = line.replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(plain, maxW);
      doc.text(wrapped, 14, y);
      y += wrapped.length * lh + 1;
      void segments; void x;
    }
  }
  return y;
}

// =============== PROPOSAL ===============
export interface ProposalForPdf {
  title: string;
  intro?: string | null;
  body_markdown?: string | null;
  valid_until?: string | null;
  total: number;
  client_name: string;
  signature_data?: string | null;
  signer_name?: string | null;
  signed_at?: string | null;
  items: { description: string; quantity: number; unit_price: number }[];
}

export function generateProposalPdf(p: ProposalForPdf, opts?: { returnDataUrl?: boolean }) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  header(doc, "Proposta Comercial");

  // capa / resumo
  doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  const wrappedTitle = doc.splitTextToSize(p.title, w - 28);
  doc.text(wrappedTitle, 14, 44);
  let y = 44 + wrappedTitle.length * 7 + 4;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80);
  doc.text(`Cliente: ${p.client_name}`, 14, y); y += 5;
  if (p.valid_until)
    doc.text(`Validade: ${new Date(p.valid_until).toLocaleDateString("pt-BR")}`, 14, y), y += 5;
  doc.text(`Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 14, y); y += 8;

  // Box do total
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, w - 28, 22, 3, 3, "F");
  doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("Investimento total", 18, y + 8);
  doc.setFontSize(18);
  doc.setTextColor(14, 116, 144);
  doc.text(fmt(p.total), w - 18, y + 14, { align: "right" });
  y += 30;

  if (p.intro) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(14, 116, 144);
    doc.text("Resumo executivo", 14, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
    const wrapped = doc.splitTextToSize(p.intro, w - 28);
    doc.text(wrapped, 14, y); y += wrapped.length * 5 + 6;
  }

  // Tabela de itens
  y = ensureSpace(doc, y, 30);
  doc.setFillColor(14, 165, 233);
  doc.rect(14, y, w - 28, 8, "F");
  doc.setFont("helvetica", "bold"); doc.setTextColor(255); doc.setFontSize(10);
  doc.text("Descrição", 17, y + 5.5);
  doc.text("Qtd", w - 80, y + 5.5);
  doc.text("Unitário", w - 60, y + 5.5);
  doc.text("Total", w - 17, y + 5.5, { align: "right" });
  y += 10;

  doc.setFont("helvetica", "normal"); doc.setTextColor(40);
  for (const it of p.items) {
    y = ensureSpace(doc, y, 10);
    const lines = doc.splitTextToSize(it.description, 100);
    doc.text(lines, 17, y);
    doc.text(String(it.quantity), w - 80, y);
    doc.text(fmt(it.unit_price), w - 60, y);
    doc.text(fmt(it.quantity * it.unit_price), w - 17, y, { align: "right" });
    y += Math.max(6, lines.length * 5);
  }

  y += 4;
  doc.setDrawColor(200); doc.line(14, y, w - 14, y); y += 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20);
  doc.text("Total", 14, y);
  doc.text(fmt(p.total), w - 14, y, { align: "right" });
  y += 10;

  // Detalhamento (markdown)
  if (p.body_markdown) {
    y = ensureSpace(doc, y, 20);
    y = renderMarkdown(doc, p.body_markdown, y);
  }

  // Assinatura
  if (p.signature_data) {
    y = ensureSpace(doc, y, 50);
    doc.setFontSize(10); doc.setTextColor(80); doc.setFont("helvetica", "normal");
    doc.text("Aceite digital:", 14, y);
    try { doc.addImage(p.signature_data, "PNG", 14, y + 3, 70, 25); } catch {}
    if (p.signer_name) doc.text(`${p.signer_name}`, 14, y + 33);
    if (p.signed_at) doc.text(`Em ${new Date(p.signed_at).toLocaleString("pt-BR")}`, 14, y + 39);
  }

  footer(doc);
  const filename = `proposta-${p.title.replace(/\s+/g, "-").toLowerCase().slice(0, 60)}.pdf`;
  if (opts?.returnDataUrl) return { dataUrl: doc.output("datauristring"), filename };
  doc.save(filename);
  return { filename };
}

// =============== CONTRACT ===============
export interface ContractForPdf {
  title: string;
  body_markdown: string;
  total: number;
  client_name: string;
  client_email?: string | null;
  signature_data?: string | null;
  signer_name?: string | null;
  signed_at?: string | null;
}

export function generateContractPdf(c: ContractForPdf, opts?: { returnDataUrl?: boolean }) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  header(doc, "Contrato");

  doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  const wrappedTitle = doc.splitTextToSize(c.title, w - 28);
  doc.text(wrappedTitle, 14, 44);
  let y = 44 + wrappedTitle.length * 7 + 4;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80);
  doc.text(`Contratante: ${c.client_name}`, 14, y); y += 5;
  if (c.client_email) doc.text(`E-mail: ${c.client_email}`, 14, y), y += 5;
  doc.text(`Valor: ${fmt(c.total)}`, 14, y); y += 5;
  doc.text(`Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 14, y); y += 8;

  y = renderMarkdown(doc, c.body_markdown, y);

  if (c.signature_data) {
    y = ensureSpace(doc, y, 60);
    doc.setDrawColor(200); doc.line(14, y, w - 14, y); y += 8;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(14, 116, 144);
    doc.text("Assinatura digital do contratante", 14, y); y += 6;
    try { doc.addImage(c.signature_data, "PNG", 14, y, 80, 30); } catch {}
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
    if (c.signer_name) doc.text(c.signer_name, 14, y + 36);
    if (c.signed_at) doc.text(`Assinado em ${new Date(c.signed_at).toLocaleString("pt-BR")}`, 14, y + 41);
  }

  footer(doc);
  const filename = `contrato-${c.title.replace(/\s+/g, "-").toLowerCase().slice(0, 60)}.pdf`;
  if (opts?.returnDataUrl) return { dataUrl: doc.output("datauristring"), filename };
  doc.save(filename);
  return { filename };
}
