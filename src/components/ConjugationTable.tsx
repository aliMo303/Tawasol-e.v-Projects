import type { ConjRow, Segment } from "@/lib/conjugation/engine";
import {
  CLR,
  hex,
  pastAffixColor,
  rowColor,
  shadeOf,
  type CellKey,
} from "@/lib/conjugation/theme";

function Form({
  segments,
  color,
}: {
  segments: Segment[] | null;
  color: string;
}) {
  if (!segments || segments.length === 0) return null;
  return (
    <span className="whitespace-nowrap">
      {segments.map((s, i) => (
        <span
          key={i}
          style={{ color: s.role === "affix" ? hex(color) : hex(CLR.root) }}
        >
          {s.text}
        </span>
      ))}
    </span>
  );
}

function Cell({
  n,
  k,
  children,
  className = "",
}: {
  n: number;
  k: CellKey;
  children?: React.ReactNode;
  className?: string;
}) {
  const fill = shadeOf(n, k);
  return (
    <td
      className={`border border-[#808080] px-2 py-1.5 text-center align-middle ${className}`}
      style={fill ? { backgroundColor: hex(fill) } : undefined}
    >
      {children}
    </td>
  );
}

export function ConjugationTable({
  rows,
  verb,
  showJazm = true,
}: {
  rows: ConjRow[];
  verb: string;
  showJazm?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-6 text-2xl font-bold">
        <span style={{ color: hex(CLR.masc) }}>مُذَکَّرْ</span>
        <span style={{ color: hex(CLR.fem) }}>مُؤَنَّثْ</span>
        <span style={{ color: hex(CLR.common) }}>كِلَاهُمَا</span>
      </div>

      <table
        id="sarf-table"
        dir="rtl"
        className="mx-auto w-full min-w-[640px] border-collapse font-[family-name:var(--font-quran)] text-xl leading-loose"
      >
        <caption className="sr-only">جدول تصريف الفعل {verb}</caption>
        <thead>
          <tr style={{ backgroundColor: hex(CLR.headerFill) }}>
            <th className="border border-[#808080] px-2 py-2 font-bold" colSpan={2}>
              الضمير
            </th>
            <th className="border border-[#808080] px-2 py-2 font-bold">
              الماضي
            </th>
            <th className="border border-[#808080] px-2 py-2 font-bold" colSpan={2}>
              المضارع
            </th>
            <th className="border border-[#808080] px-2 py-2 font-bold">
              الأمر
            </th>
          </tr>
          <tr style={{ backgroundColor: hex(CLR.headerFill) }}>
            <th className="border border-[#808080] px-2 py-1" colSpan={2}></th>
            <th className="border border-[#808080] px-2 py-1 font-bold">مبني</th>
            <th className="border border-[#808080] px-2 py-1">مرفوع</th>
            <th className="border border-[#808080] px-2 py-1 font-bold">مجزوم</th>
            <th className="border border-[#808080] px-2 py-1">مبني</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const n = row.pronoun.n;
            const color = rowColor(n);
            return (
              <tr key={n}>
                <Cell n={n} k="num" className="w-12 text-base text-muted-foreground">
                  {n}
                </Cell>
                <Cell n={n} k="pron">
                  <span style={{ color: hex(color) }}>{row.pronoun.label}</span>
                  {row.pronoun.note ? (
                    <span className="mr-1 text-xs text-muted-foreground">
                      ({row.pronoun.note})
                    </span>
                  ) : null}
                </Cell>
                <Cell n={n} k="past">
                  <Form segments={row.past} color={pastAffixColor(n)} />
                </Cell>
                <Cell n={n} k="raf">
                  <Form segments={row.presentRaf} color={color} />
                </Cell>
                <Cell n={n} k="jazm">
                  <Form
                    segments={showJazm ? row.presentJazm : null}
                    color={color}
                  />
                </Cell>
                <Cell n={n} k="amr">
                  <Form segments={row.imperative} color={color} />
                </Cell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
