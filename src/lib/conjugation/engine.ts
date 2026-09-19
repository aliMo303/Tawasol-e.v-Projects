/**
 * Arabic verb conjugation engine (Qutrub-style rule engine).
 * Input: past tense, 3rd person masculine singular (e.g. كَتَبَ).
 */

export const FATHA = "\u064E";
export const DAMMA = "\u064F";
export const KASRA = "\u0650";
export const SUKUN = "\u0652";
export const SHADDA = "\u0651";
export const TANWEEN_F = "\u064B";
export const TANWEEN_D = "\u064C";
export const TANWEEN_K = "\u064D";

const HARAKAT = new Set([
  FATHA,
  DAMMA,
  KASRA,
  SUKUN,
  SHADDA,
  TANWEEN_F,
  TANWEEN_D,
  TANWEEN_K,
]);

export const TASHKEEL_BUTTONS = [
  { mark: FATHA, name: "فَتْحَة" },
  { mark: DAMMA, name: "ضَمَّة" },
  { mark: KASRA, name: "كَسْرَة" },
  { mark: SUKUN, name: "سُكُون" },
  { mark: SHADDA, name: "شَدَّة" },
  { mark: TANWEEN_F, name: "تَنْوِين فَتْح" },
  { mark: TANWEEN_K, name: "تَنْوِين كَسْر" },
  { mark: TANWEEN_D, name: "تَنْوِين ضَمّ" },
];

export type MiddleVowel = "u" | "a" | "i";

export type Gender = "m" | "f" | "c";

export type Segment = { text: string; role: "root" | "affix" };

export type PronounSpec = {
  n: number;
  label: string;
  gender: Gender;
  note?: string;
};

export type ConjRow = {
  pronoun: PronounSpec;
  past: Segment[];
  presentRaf: Segment[];
  presentJazm: Segment[];
  imperative: Segment[] | null;
};

type Kind = "I" | "IV" | "wasl" | "ta" | "heavy";
type Weak = "sound" | "assimilated" | "hollow" | "defective" | "doubled";

export type Analysis = {
  kind: Kind;
  weak: Weak;
  middleVowel: MiddleVowel;
  kindLabel: string;
  weakLabel: string;
};

export type ConjugationResult = {
  rows: ConjRow[];
  analysis: Analysis;
  error?: string;
};

type Unit = { c: string; m: string };

export const PRONOUNS: PronounSpec[] = [
  { n: 1, label: "أَنَا", gender: "c" },
  { n: 2, label: "نَحْنُ", gender: "c" },
  { n: 3, label: "أَنْتَ", gender: "m" },
  { n: 4, label: "أَنْتِ", gender: "f" },
  { n: 5, label: "هُوَ", gender: "m" },
  { n: 6, label: "هِيَ", gender: "f" },
  { n: 7, label: "أَنْتُمْ", gender: "m" },
  { n: 8, label: "أَنْتُنَّ", gender: "f" },
  { n: 9, label: "هُمْ", gender: "m" },
  { n: 10, label: "هُنَّ", gender: "f" },
  { n: 11, label: "أَنْتُمَا", gender: "c" },
  { n: 12, label: "هُمَا", gender: "m", note: "مذكر" },
  { n: 13, label: "هُمَا", gender: "f", note: "مؤنث" },
];

const GUTTURAL = new Set(["ء", "أ", "إ", "ؤ", "ئ", "ه", "ع", "ح", "غ", "خ"]);

function parseUnits(input: string): Unit[] {
  const out: Unit[] = [];
  for (const ch of input.trim()) {
    if (HARAKAT.has(ch)) {
      const prev = out[out.length - 1];
      if (prev) prev.m += ch;
    } else if (ch === "\u0640" || ch === " ") {
      continue;
    } else {
      out.push({ c: ch, m: "" });
    }
  }
  return out;
}

function at(u: Unit[], i: number): Unit {
  return u[i] ?? { c: "", m: "" };
}

const txt = (u: Unit) => u.c + u.m;
const isBareAlif = (u: Unit) => (u.c === "ا" || u.c === "ى") && u.m === "";
const hasShadda = (u: Unit) => u.m.includes(SHADDA);
const withHaraka = (u: Unit, h: string) =>
  u.c + (hasShadda(u) ? SHADDA : "") + h;
const join = (us: Unit[]) => us.map(txt).join("");

function detectKind(u: Unit[]): Kind {
  const first = at(u, 0);
  if (first.c === "ا" && !hasShadda(first)) return "wasl";
  const letters = u.filter((x) => !isBareAlif(x));
  if ((first.c === "أ" || first.c === "آ") && letters.length >= 4) return "IV";
  if (first.c === "ت" && u.length >= 4) return "ta";
  if (u.length >= 4) return "heavy";
  if (u.length === 3 && hasShadda(at(u, 1))) return "heavy";
  return "I";
}

function detectWeak(u: Unit[], kind: Kind): Weak {
  const n = u.length;
  const last = at(u, n - 1);
  if ((last.c === "ا" || last.c === "ى") && last.m === "" && n >= 3)
    return "defective";
  // فَعِلَ الناقص: خَشِيَ، رَضِيَ، نَسِيَ
  if (
    last.c === "ي" &&
    !hasShadda(last) &&
    n >= 3 &&
    at(u, n - 2).m.includes(KASRA)
  )
    return "defective";
  if (kind === "I") {
    if (n === 3 && isBareAlif(at(u, 1))) return "hollow";
    if (n === 2 && hasShadda(at(u, 1))) return "doubled";
    if (at(u, 0).c === "و") return "assimilated";
  }
  return "sound";
}

export function defaultMiddleVowel(input: string): MiddleVowel {
  const u = parseUnits(input);
  if (u.length < 2) return "u";
  const kind = detectKind(u);
  const weak = detectWeak(u, kind);
  if (kind !== "I") return kind === "ta" ? "a" : "i";
  if (weak === "defective") {
    const last = at(u, u.length - 1).c;
    if (last === "ا") return "u";
    if (at(u, u.length - 2).m.includes(KASRA)) return "a";
    return "i";
  }
  if (weak === "hollow") return "u";
  if (weak === "assimilated") return "i";
  if (weak === "doubled") return at(u, 1).m.includes(KASRA) ? "i" : "u";
  const c2 = at(u, 1);
  const c3 = at(u, 2);
  if (c2.m.includes(KASRA)) return "a";
  if (c2.m.includes(DAMMA)) return "u";
  if (GUTTURAL.has(c2.c) || GUTTURAL.has(c3.c)) return "a";
  return "u";
}

const vowelChar = (v: MiddleVowel) =>
  v === "u" ? DAMMA : v === "i" ? KASRA : FATHA;

type PastPlan =
  | { type: "plain"; pre: string; lastRad: string; consStem: string }
  | {
      type: "defective";
      base: string;
      baseD: string;
      weak: "w" | "y";
      tail: string;
      iType: boolean;
    };

type PresentPlan =
  | { type: "plain"; stem: string; short: string; doubled: boolean }
  | { type: "defective"; base: string; dtype: "w" | "y" | "a" };

function buildPlans(
  u: Unit[],
  kind: Kind,
  weak: Weak,
  v: MiddleVowel,
): { past: PastPlan; present: PresentPlan; prefixVowel: string } {
  const n = u.length;
  const vc = vowelChar(v);
  const prefixVowel = kind === "IV" || kind === "heavy" ? DAMMA : FATHA;

  // ---------- past ----------
  let past: PastPlan;
  if (weak === "defective") {
    const head = u.slice(0, n - 1);
    const lastHead = at(head, head.length - 1);
    const headStart = join(head.slice(0, head.length - 1));
    const tail = at(u, n - 1).c;
    const iType = tail === "ي" && lastHead.m.includes(KASRA);
    const base = iType ? headStart + txt(lastHead) : headStart + withHaraka(lastHead, FATHA);
    past = {
      type: "defective",
      base,
      baseD: headStart + withHaraka(lastHead, DAMMA),
      weak: tail === "ا" ? "w" : "y",
      tail,
      iType,
    };
  } else {
    const pre = join(u.slice(0, n - 1));
    const lastUnit = at(u, n - 1);
    const lastRad = lastUnit.c + (hasShadda(lastUnit) ? SHADDA : "");
    let consStem: string;
    if (weak === "doubled") {
      const c = at(u, 1).c;
      consStem = pre + c + FATHA + c + SUKUN;
    } else if (weak === "hollow") {
      consStem = at(u, 0).c + (v === "u" ? DAMMA : KASRA) + at(u, 2).c + SUKUN;
    } else {
      consStem = pre + lastRad + SUKUN;
    }
    past = { type: "plain", pre, lastRad, consStem };
  }

  // ---------- present ----------
  let present: PresentPlan;
  if (weak === "defective") {
    const head = u.slice(0, n - 1);
    let base: string;
    if (kind === "I") {
      base = at(head, 0).c + SUKUN + at(head, 1).c;
    } else {
      const rest = kind === "wasl" || kind === "IV" ? head.slice(1) : head;
      base = join(rest.slice(0, rest.length - 1)) + at(rest, rest.length - 1).c;
    }
    const dtype: "w" | "y" | "a" = v === "u" ? "w" : v === "i" ? "y" : "a";
    present = { type: "defective", base, dtype };
  } else if (kind === "I") {
    if (weak === "hollow") {
      const longLetter = v === "u" ? "و" : v === "i" ? "ي" : "ا";
      const c1v = vowelChar(v);
      const stem = at(u, 0).c + c1v + longLetter + at(u, 2).c;
      const short = at(u, 0).c + c1v + at(u, 2).c + SUKUN;
      present = { type: "plain", stem, short, doubled: false };
    } else if (weak === "doubled") {
      const c1 = at(u, 0).c;
      const c2 = at(u, 1).c;
      present = {
        type: "plain",
        stem: c1 + vc + c2 + SHADDA,
        short: c1 + SUKUN + c2 + vc + c2 + SUKUN,
        doubled: true,
      };
    } else if (weak === "assimilated") {
      const stem = at(u, 1).c + vc + at(u, 2).c;
      present = { type: "plain", stem, short: stem + SUKUN, doubled: false };
    } else {
      const stem = at(u, 0).c + SUKUN + at(u, 1).c + vc + at(u, 2).c;
      present = { type: "plain", stem, short: stem + SUKUN, doubled: false };
    }
  } else {
    let units = u.slice(0);
    if (kind === "wasl" || kind === "IV") units = units.slice(1);
    const body = units.slice(0, units.length - 1);
    const lastRad = at(units, units.length - 1);
    const stemHead =
      kind === "ta"
        ? join(body)
        : join(body.slice(0, body.length - 1)) +
          withHaraka(at(body, body.length - 1), KASRA);
    const stem = stemHead + lastRad.c + (hasShadda(lastRad) ? SHADDA : "");
    present = { type: "plain", stem, short: stem + SUKUN, doubled: false };
  }

  return { past, present, prefixVowel };
}

// ---------- form assembly ----------

type RowKind = "sg" | "fsg" | "mpl" | "nun" | "dual";

const ROW_KIND: Record<number, RowKind> = {
  1: "sg",
  2: "sg",
  3: "sg",
  4: "fsg",
  5: "sg",
  6: "sg",
  7: "mpl",
  8: "nun",
  9: "mpl",
  10: "nun",
  11: "dual",
  12: "dual",
  13: "dual",
};

const PREFIX_LETTER: Record<number, string> = {
  1: "أ",
  2: "ن",
  3: "ت",
  4: "ت",
  5: "ي",
  6: "ت",
  7: "ت",
  8: "ت",
  9: "ي",
  10: "ي",
  11: "ت",
  12: "ي",
  13: "ت",
};

const PAST_CONS_SUFFIX: Record<number, string> = {
  1: "تُ",
  2: "نَا",
  3: "تَ",
  4: "تِ",
  7: "تُمْ",
  8: "تُنَّ",
  10: "نَ",
  11: "تُمَا",
};

const seg = (root: string, affix: string): Segment[] =>
  affix
    ? [
        { text: root, role: "root" as const },
        { text: affix, role: "affix" as const },
      ]
    : [{ text: root, role: "root" as const }];

function pastSegments(plan: PastPlan, n: number): Segment[] {
  const cons = PAST_CONS_SUFFIX[n];
  if (plan.type === "plain") {
    const base = plan.pre + plan.lastRad;
    if (cons) return seg(plan.consStem, cons);
    switch (n) {
      case 5:
        return seg(base + FATHA, "");
      case 6:
        return seg(base + FATHA, "تْ");
      case 9:
        return seg(base + DAMMA, "وا");
      case 12:
        return seg(base + FATHA, "ا");
      case 13:
        return seg(base + FATHA, "تَا");
    }
  } else if (plan.iType) {
    // خَشِيَ / رَضِيَ
    if (cons) return seg(plan.base + "ي", cons);
    switch (n) {
      case 5:
        return seg(plan.base + "ي" + FATHA, "");
      case 6:
        return seg(plan.base + "ي" + FATHA, "تْ");
      case 9:
        return seg(plan.baseD, "وا");
      case 12:
        return seg(plan.base + "ي" + FATHA, "ا");
      case 13:
        return seg(plan.base + "ي" + FATHA, "تَا");
    }
  } else {
    const consStem = plan.base + (plan.weak === "w" ? "و" : "ي") + SUKUN;
    if (cons) return seg(consStem, cons);
    switch (n) {
      case 5:
        return seg(plan.base + plan.tail, "");
      case 6:
        return seg(plan.base, "تْ");
      case 9:
        return seg(plan.base + "و" + SUKUN, "ا");
      case 12:
        return seg(plan.base + (plan.weak === "w" ? "و" : "ي") + FATHA, "ا");
      case 13:
        return seg(plan.base, "تَا");
    }
  }
  return [];
}

function presentSegments(
  plan: PresentPlan,
  prefixVowel: string,
  n: number,
  mood: "raf" | "jazm",
): Segment[] {
  const prefix = (PREFIX_LETTER[n] ?? "ي") + prefixVowel;
  const rowKind: RowKind = ROW_KIND[n] ?? "sg";
  let stem = "";
  let ending = "";

  if (plan.type === "plain") {
    switch (rowKind) {
      case "sg":
        stem =
          mood === "raf"
            ? plan.stem + DAMMA
            : plan.doubled
              ? plan.stem + FATHA
              : plan.short;
        break;
      case "fsg":
        stem = plan.stem + KASRA;
        ending = mood === "raf" ? "ينَ" : "ي";
        break;
      case "mpl":
        stem = plan.stem + DAMMA;
        ending = mood === "raf" ? "ونَ" : "وا";
        break;
      case "nun":
        stem = plan.short;
        ending = "نَ";
        break;
      case "dual":
        stem = plan.stem + FATHA;
        ending = mood === "raf" ? "انِ" : "ا";
        break;
    }
  } else {
    const b = plan.base;
    const { dtype } = plan;
    switch (rowKind) {
      case "sg":
        if (mood === "raf") {
          stem =
            dtype === "w"
              ? b + DAMMA + "و"
              : dtype === "y"
                ? b + KASRA + "ي"
                : b + FATHA + "ى";
        } else {
          stem =
            dtype === "w" ? b + DAMMA : dtype === "y" ? b + KASRA : b + FATHA;
        }
        break;
      case "fsg":
        if (dtype === "a") {
          stem = b + FATHA;
          ending = mood === "raf" ? "يْنَ" : "يْ";
        } else {
          stem = b + KASRA;
          ending = mood === "raf" ? "ينَ" : "ي";
        }
        break;
      case "mpl":
        if (dtype === "a") {
          stem = b + FATHA;
          ending = mood === "raf" ? "وْنَ" : "وْا";
        } else {
          stem = b + DAMMA;
          ending = mood === "raf" ? "ونَ" : "وا";
        }
        break;
      case "nun":
        if (dtype === "w") {
          stem = b + DAMMA;
          ending = "ونَ";
        } else if (dtype === "y") {
          stem = b + KASRA;
          ending = "ينَ";
        } else {
          stem = b + FATHA;
          ending = "يْنَ";
        }
        break;
      case "dual":
        if (dtype === "w") {
          stem = b + DAMMA;
          ending = mood === "raf" ? "وَانِ" : "وَا";
        } else {
          stem = dtype === "y" ? b + KASRA : b + FATHA;
          ending = mood === "raf" ? "يَانِ" : "يَا";
        }
        break;
    }
  }

  const out: Segment[] = [
    { text: prefix, role: "affix" },
    { text: stem, role: "root" },
  ];
  if (ending) out.push({ text: ending, role: "affix" });
  return out;
}

/** vowel of هَمْزَة الوَصْل, taken from the 3rd radical vowel of the مضارع */
function waslVowelOf(jazmOfHuwa: Segment[]): string {
  const body = jazmOfHuwa
    .slice(1)
    .map((s) => s.text)
    .join("");
  for (let i = 1; i < body.length; i++) {
    const ch = body[i] ?? "";
    if (ch === SUKUN || ch === SHADDA) continue;
    if (HARAKAT.has(ch)) return ch === DAMMA ? DAMMA : KASRA;
  }
  return KASRA;
}

function imperativeSegments(
  jazm: Segment[],
  kind: Kind,
  waslVowel: string,
): Segment[] {
  // drop the مضارعة prefix, then restore the connecting alif when needed
  const rest = jazm.slice(1);
  const body = rest.map((s) => s.text).join("");
  const first = body[0] ?? "";
  const second = body[1];
  const startsWithSukun = second === SUKUN || second === undefined;
  const out: Segment[] = [];
  if (startsWithSukun && first) {
    if (kind === "IV") {
      out.push({ text: "أ" + FATHA, role: "affix" });
    } else {
      out.push({ text: "ا" + waslVowel, role: "affix" });
    }
  }
  return out.concat(rest);
}

/** تصحيح كرسي الهمزة: قَرَأُوا ← قَرَؤُوا، تَقْرَأِينَ ← تَقْرَئِينَ، قَرَأَا ← قَرَآ */
function fixHamza(segs: Segment[] | null): Segment[] | null {
  if (!segs) return segs;
  const out = segs.map((s) => ({ ...s }));
  for (const s of out) {
    s.text = s.text
      .replace(/أِ/g, "ئِ")
      .replace(/أَا/g, "آ")
      .replace(/أُو/g, "ؤُو");
  }
  for (let i = 0; i < out.length - 1; i++) {
    const cur = out[i];
    const nxt = out[i + 1];
    if (!cur || !nxt) continue;
    if (cur.text.endsWith("أ" + DAMMA) && nxt.text.startsWith("و")) {
      cur.text = cur.text.slice(0, -2) + "ؤ" + DAMMA;
    }
    if (cur.text.endsWith("أ" + FATHA) && nxt.text.startsWith("ا")) {
      cur.text = cur.text.slice(0, -2) + "آ";
      nxt.text = nxt.text.slice(1);
    }
  }
  return out.filter((s) => s.text.length > 0);
}

const KIND_LABELS: Record<Kind, string> = {
  I: "ثلاثي مجرد",
  IV: "مزيد (أَفْعَلَ)",
  wasl: "مزيد بهمزة وصل",
  ta: "مزيد بالتاء",
  heavy: "مزيد / رباعي",
};

const WEAK_LABELS: Record<Weak, string> = {
  sound: "صحيح",
  assimilated: "معتل مثال",
  hollow: "معتل أجوف",
  defective: "معتل ناقص",
  doubled: "مضعّف",
};

const IMPERATIVE_ROWS = new Set([3, 4, 7, 8, 11]);

export function conjugate(
  input: string,
  middleVowel?: MiddleVowel,
): ConjugationResult {
  const clean = input.trim();
  const u = parseUnits(clean);
  if (u.length < 2) {
    return {
      rows: [],
      analysis: {
        kind: "I",
        weak: "sound",
        middleVowel: middleVowel ?? "u",
        kindLabel: "",
        weakLabel: "",
      },
      error: "أَدْخِل فِعْلاً مَاضِياً لا يَقِلُّ عَن حَرْفَيْن",
    };
  }

  const kind = detectKind(u);
  const weak = detectWeak(u, kind);
  const v = middleVowel ?? defaultMiddleVowel(clean);
  const { past, present, prefixVowel } = buildPlans(u, kind, weak, v);

  const waslVowel = waslVowelOf(
    presentSegments(present, prefixVowel, 5, "jazm"),
  );

  const rows: ConjRow[] = PRONOUNS.map((p) => {
    const presentJazm = presentSegments(present, prefixVowel, p.n, "jazm");
    return {
      pronoun: p,
      past: fixHamza(pastSegments(past, p.n)) ?? [],
      presentRaf:
        fixHamza(presentSegments(present, prefixVowel, p.n, "raf")) ?? [],
      presentJazm: fixHamza(presentJazm) ?? [],
      imperative: IMPERATIVE_ROWS.has(p.n)
        ? fixHamza(imperativeSegments(presentJazm, kind, waslVowel))
        : null,
    };
  });

  return {
    rows,
    analysis: {
      kind,
      weak,
      middleVowel: v,
      kindLabel: KIND_LABELS[kind],
      weakLabel: WEAK_LABELS[weak],
    },
  };
}

export const segText = (segs: Segment[] | null) =>
  segs ? segs.map((s) => s.text).join("") : "";
