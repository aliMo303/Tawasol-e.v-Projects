import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { ConjRow, Segment } from "@/lib/conjugation/engine";
import {
  CLR,
  pastAffixColor,
  rowColor,
  shadeOf,
  type CellKey,
} from "@/lib/conjugation/theme";

const FONT = "Amiri";
const COL_WIDTHS = [700, 1900, 1900, 1900, 1480, 1480];
const TABLE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0);

const border = { style: BorderStyle.SINGLE, size: 6, color: CLR.border };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(
  children: Paragraph[],
  colIndex: number,
  opts: { fill?: string | undefined; colSpan?: number | undefined } = {},
) {
  const span = opts.colSpan ?? 1;
  const width = COL_WIDTHS.slice(colIndex, colIndex + span).reduce(
    (a, b) => a + b,
    0,
  );
  return new TableCell({
    borders,
    width: { size: width || 1500, type: WidthType.DXA },
    ...(opts.colSpan ? { columnSpan: opts.colSpan } : {}),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    ...(opts.fill
      ? {
          shading: {
            fill: opts.fill,
            type: ShadingType.CLEAR,
            color: "auto",
          },
        }
      : {}),
    children,
  });
}

function para(runs: TextRun[]) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    spacing: { before: 40, after: 40 },
    children: runs,
  });
}

const run = (
  text: string,
  color: string,
  opts: { bold?: boolean | undefined; size?: number | undefined } = {},
) =>
  new TextRun({
    text,
    color,
    ...(opts.bold ? { bold: true } : {}),
    font: FONT,
    size: opts.size ?? 28,
    rightToLeft: true,
  });

function formRuns(segments: Segment[] | null, color: string) {
  if (!segments || segments.length === 0) return [run("", CLR.root)];
  return segments.map((s) =>
    run(s.text, s.role === "affix" ? color : CLR.root),
  );
}

export async function buildConjugationDocx(
  verb: string,
  rows: ConjRow[],
  showJazm: boolean,
) {
  const headerFill = CLR.headerFill;

  const legend = new Paragraph({
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    spacing: { after: 200 },
    children: [
      run("مُذَکَّرْ", CLR.masc, { bold: true, size: 32 }),
      run("     ", CLR.root),
      run("مُؤَنَّثْ", CLR.fem, { bold: true, size: 32 }),
      run("     ", CLR.root),
      run("كِلَاهُمَا", CLR.common, { bold: true, size: 32 }),
    ],
  });

  const title = new Paragraph({
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    spacing: { after: 120 },
    children: [run(`تَصْرِيف الفِعْل: ${verb}`, CLR.root, { bold: true, size: 36 })],
  });

  const headRow1 = new TableRow({
    tableHeader: true,
    children: [
      cell([para([run("الضمير", CLR.root, { bold: true })])], 0, {
        colSpan: 2,
        fill: headerFill,
      }),
      cell([para([run("الماضي", CLR.root, { bold: true })])], 2, {
        fill: headerFill,
      }),
      cell([para([run("المضارع", CLR.root, { bold: true })])], 3, {
        colSpan: 2,
        fill: headerFill,
      }),
      cell([para([run("الأمر", CLR.root, { bold: true })])], 5, {
        fill: headerFill,
      }),
    ],
  });

  const headRow2 = new TableRow({
    tableHeader: true,
    children: [
      cell([para([run("", CLR.root)])], 0, { colSpan: 2, fill: headerFill }),
      cell([para([run("مبني", CLR.root, { bold: true })])], 2, { fill: headerFill }),
      cell([para([run("مرفوع", CLR.root)])], 3, { fill: headerFill }),
      cell([para([run("مجزوم", CLR.root, { bold: true })])], 4, { fill: headerFill }),
      cell([para([run("مبني", CLR.root)])], 5, { fill: headerFill }),
    ],
  });

  const bodyRows = rows.map((r) => {
    const n = r.pronoun.n;
    const color = rowColor(n);
    const fill = (k: CellKey) => shadeOf(n, k);
    return new TableRow({
      children: [
        cell([para([run(String(n), "595959", { size: 22 })])], 0, {
          fill: fill("num"),
        }),
        cell([para([run(r.pronoun.label, color, { bold: true })])], 1, {
          fill: fill("pron"),
        }),
        cell([para(formRuns(r.past, pastAffixColor(n)))], 2, {
          fill: fill("past"),
        }),
        cell([para(formRuns(r.presentRaf, color))], 3, { fill: fill("raf") }),
        cell([para(formRuns(showJazm ? r.presentJazm : null, color))], 4, {
          fill: fill("jazm"),
        }),
        cell([para(formRuns(r.imperative, color))], 5, { fill: fill("amr") }),
      ],
    });
  });

  const table = new Table({
    visuallyRightToLeft: true,
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: COL_WIDTHS,
    rows: [headRow1, headRow2, ...bodyRows],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 28 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
          },
        },
        children: [title, legend, table],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function downloadDocx(
  verb: string,
  rows: ConjRow[],
  showJazm: boolean,
) {
  const blob = await buildConjugationDocx(verb, rows, showJazm);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `تصريف-${verb.replace(/[\u064B-\u0652]/g, "")}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
