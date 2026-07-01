// Gera um arquivo .doc (HTML compatível com Word/Google Docs) totalmente editável.
// Não precisa de dependência extra — Word abre HTML como documento.

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMd(s: string) {
  // **bold** e *itálico* básicos
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\s)\*(.+?)\*(?=\s|$)/g, "$1<em>$2</em>");
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (inList) { out.push(`</${inList}>`); inList = null; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); out.push("<p>&nbsp;</p>"); continue; }

    if (/^###\s+/.test(line)) { closeList(); out.push(`<h3>${inlineMd(line.replace(/^###\s+/, ""))}</h3>`); continue; }
    if (/^##\s+/.test(line))  { closeList(); out.push(`<h2>${inlineMd(line.replace(/^##\s+/, ""))}</h2>`); continue; }
    if (/^#\s+/.test(line))   { closeList(); out.push(`<h1>${inlineMd(line.replace(/^#\s+/, ""))}</h1>`); continue; }

    if (/^\s*[-*]\s+/.test(line)) {
      if (inList !== "ul") { closeList(); out.push("<ul>"); inList = "ul"; }
      out.push(`<li>${inlineMd(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (inList !== "ol") { closeList(); out.push("<ol>"); inList = "ol"; }
      out.push(`<li>${inlineMd(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

interface DocInput {
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
  intro?: string | null;
  body_markdown?: string | null;
  items?: { description: string; quantity: number; unit_price: number }[];
  total?: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export function downloadEditableDoc(input: DocInput, filenameBase: string) {
  const metaRows = (input.meta ?? [])
    .map((m) => `<tr><td style="padding:4px 8px;color:#64748b"><b>${escapeHtml(m.label)}</b></td><td style="padding:4px 8px">${escapeHtml(m.value)}</td></tr>`)
    .join("");

  let itemsBlock = "";
  if (input.items && input.items.length > 0) {
    const rows = input.items.map(
      (it) => `<tr>
        <td style="border:1px solid #cbd5e1;padding:6px">${escapeHtml(it.description)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:center">${it.quantity}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:right">${fmt(it.unit_price)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:right">${fmt(it.quantity * it.unit_price)}</td>
      </tr>`,
    ).join("");
    itemsBlock = `
      <h2 style="color:#0e7490">Itens</h2>
      <table style="border-collapse:collapse;width:100%;font-size:11pt">
        <thead>
          <tr style="background:#0ea5e9;color:#fff">
            <th style="border:1px solid #0ea5e9;padding:6px;text-align:left">Descrição</th>
            <th style="border:1px solid #0ea5e9;padding:6px">Qtd</th>
            <th style="border:1px solid #0ea5e9;padding:6px;text-align:right">Unitário</th>
            <th style="border:1px solid #0ea5e9;padding:6px;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const totalBlock =
    typeof input.total === "number"
      ? `<p style="text-align:right;font-size:14pt"><b>Total: ${fmt(input.total)}</b></p>`
      : "";

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.title)}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #0f172a; }
    h1 { color:#0f172a; font-size:22pt; margin:0 0 4px 0; }
    h2 { color:#0e7490; font-size:14pt; margin-top:18px; }
    h3 { color:#0f172a; font-size:12pt; }
    .sub { color:#64748b; margin:0 0 12px 0; }
    .meta { margin:8px 0 16px 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.title)}</h1>
  ${input.subtitle ? `<p class="sub">${escapeHtml(input.subtitle)}</p>` : ""}
  ${metaRows ? `<table class="meta">${metaRows}</table>` : ""}
  ${input.intro ? `<h2>Resumo executivo</h2><p>${inlineMd(input.intro)}</p>` : ""}
  ${input.body_markdown ? markdownToHtml(input.body_markdown) : ""}
  ${itemsBlock}
  ${totalBlock}
  <hr />
  <p style="color:#64748b;font-size:9pt">Daina Flow · Larissa Daina dos Santos Quirino · Igarapé-MG</p>
</body>
</html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
