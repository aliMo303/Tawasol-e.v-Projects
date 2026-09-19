/** Exact colours taken from Sarf.docx — shared by the screen table, the Word file and the PDF. */
export const CLR = {
  masc: "00B0F0",
  mascDeep: "2C7FCE",
  fem: "FF6699",
  common: "00B050",
  root: "000000",
  gray: "D9D9D9",
  peach: "FAE2D5",
  border: "808080",
  headerFill: "F2F2F2",
} as const;

export const hex = (c: string) => `#${c}`;

export type CellKey = "num" | "pron" | "past" | "raf" | "jazm" | "amr";

/** Per-row colour + shading map, exactly as in the source document. */
export const ROW_STYLE: Record<
  number,
  { color: string; pastAffix?: string; shade: Partial<Record<CellKey, string>> }
> = {
  1: { color: CLR.common, shade: {} },
  2: { color: CLR.common, shade: {} },
  3: { color: CLR.masc, pastAffix: CLR.mascDeep, shade: {} },
  4: {
    color: CLR.fem,
    shade: { pron: CLR.gray, raf: CLR.gray, amr: CLR.gray },
  },
  5: { color: CLR.masc, shade: {} },
  6: { color: CLR.fem, shade: {} },
  7: {
    color: CLR.masc,
    shade: { pron: CLR.gray, raf: CLR.gray, amr: CLR.gray },
  },
  8: {
    color: CLR.fem,
    shade: {
      num: CLR.peach,
      pron: CLR.peach,
      past: CLR.peach,
      raf: CLR.peach,
      jazm: CLR.peach,
      amr: CLR.peach,
    },
  },
  9: { color: CLR.masc, shade: { pron: CLR.gray, raf: CLR.gray } },
  10: {
    color: CLR.fem,
    shade: { pron: CLR.peach, past: CLR.peach, raf: CLR.peach },
  },
  11: {
    color: CLR.common,
    shade: { pron: CLR.gray, raf: CLR.gray, amr: CLR.gray },
  },
  12: {
    color: CLR.masc,
    pastAffix: CLR.mascDeep,
    shade: { pron: CLR.gray, raf: CLR.gray },
  },
  13: { color: CLR.fem, shade: { pron: CLR.gray, raf: CLR.gray } },
};

export const rowColor = (n: number) => ROW_STYLE[n]?.color ?? CLR.root;
export const pastAffixColor = (n: number) =>
  ROW_STYLE[n]?.pastAffix ?? rowColor(n);
export const shadeOf = (n: number, key: CellKey) => ROW_STYLE[n]?.shade[key];
