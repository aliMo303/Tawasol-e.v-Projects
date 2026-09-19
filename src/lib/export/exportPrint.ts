import { CLR, hex } from "@/lib/conjugation/theme";

const PRINT_CSS = `
  @page { size: A4 portrait; margin: 14mm; }
  body {
    font-family: "Amiri", "Scheherazade New", "Traditional Arabic", serif;
    direction: rtl;
    margin: 0;
    color: #000;
  }
  h1 { font-size: 26pt; margin: 0 0 6px; text-align: center; }
  .sub { text-align: center; font-size: 11pt; color: #55636b; margin-bottom: 14px; }
  .legend { text-align: center; font-size: 18pt; font-weight: 700; margin-bottom: 12px; }
  .legend span { margin: 0 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 15pt; }
  th, td { border: 1px solid ${hex(CLR.border)}; padding: 5px 8px; text-align: center; vertical-align: middle; }
  th { background: ${hex(CLR.headerFill)}; font-weight: 700; }
  .brand { text-align: center; font-size: 10pt; color: #026a61; margin-top: 16px; }
`;

function buildDocument(verb: string, tableHtml: string) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>تصريف الفعل ${verb} — تواصل صرف</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet">
<style>${PRINT_CSS}</style></head>
<body>
<h1>تَصْرِيف الفِعْل: ${verb}</h1>
<div class="sub">تواصل صرف — تصريف الأفعال العربية وفق أحدث المعايير الصرفية</div>
<div class="legend">
  <span style="color:${hex(CLR.masc)}">مُذَکَّرْ</span>
  <span style="color:${hex(CLR.fem)}">مُؤَنَّثْ</span>
  <span style="color:${hex(CLR.common)}">كِلَاهُمَا</span>
</div>
${tableHtml}
<div class="brand">tawasol.de</div>
</body></html>`;
}

/** Table markup with all styling inlined, for clipboard and print. */
export function tableHtml() {
  const el = document.getElementById("sarf-table");
  return el ? el.outerHTML : "";
}

export function printConjugation(verb: string) {
  const html = buildDocument(verb, tableHtml());
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "-10000px";
  frame.style.width = "820px";
  frame.style.height = "1160px";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1500);
  };
  // give webfonts a moment so the PDF renders with Amiri
  window.setTimeout(go, 900);
}

export async function copyTable(verb: string) {
  const html = buildDocument(verb, tableHtml());
  const plain = (document.getElementById("sarf-table")?.innerText ?? "").trim();
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      }),
    ]);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(plain);
      return true;
    } catch {
      return false;
    }
  }
}
