import { useRef } from "react";
import {
  TASHKEEL_BUTTONS,
  type MiddleVowel,
} from "@/lib/conjugation/engine";

const PRESETS = [
  "كَتَبَ",
  "قَرَأَ",
  "قَالَ",
  "رَمَى",
  "مَدَّ",
  "وَعَدَ",
  "دَعَا",
  "اسْتَغْفَرَ",
];

const VOWELS: { key: MiddleVowel; label: string }[] = [
  { key: "u", label: "ضَمَّة — يَفْعُلُ" },
  { key: "a", label: "فَتْحَة — يَفْعَلُ" },
  { key: "i", label: "كَسْرَة — يَفْعِلُ" },
];

export function VerbControls({
  verb,
  onVerb,
  vowel,
  onVowel,
  autoVowel,
}: {
  verb: string;
  onVerb: (v: string) => void;
  vowel: MiddleVowel | "auto";
  onVowel: (v: MiddleVowel | "auto") => void;
  autoVowel: MiddleVowel;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const insert = (mark: string) => {
    const el = inputRef.current;
    if (!el) return onVerb(verb + mark);
    const start = el.selectionStart ?? verb.length;
    const end = el.selectionEnd ?? start;
    const next = verb.slice(0, start) + mark + verb.slice(end);
    onVerb(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + mark.length, start + mark.length);
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <label
        htmlFor="verb"
        className="mb-2 block text-sm font-semibold text-brand-deep"
      >
        الفِعْل المَاضِي (للغائب المفرد المذكر)
      </label>
      <input
        id="verb"
        ref={inputRef}
        value={verb}
        onChange={(e) => onVerb(e.target.value)}
        dir="rtl"
        placeholder="مثال: كَتَبَ"
        className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-center font-[family-name:var(--font-quran)] text-3xl outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
      />

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-brand-deep">
          التَّشْكِيل السَّرِيع
        </p>
        <div className="flex flex-wrap gap-2">
          {TASHKEEL_BUTTONS.map((b) => (
            <button
              key={b.mark}
              type="button"
              title={b.name}
              onClick={() => insert(b.mark)}
              className="min-w-11 rounded-lg border border-border bg-secondary px-3 py-2 font-[family-name:var(--font-quran)] text-xl text-brand-deep transition hover:border-brand hover:bg-brand hover:text-primary-foreground"
            >
              {"\u25CC" + b.mark}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onVerb("")}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-destructive hover:text-destructive"
          >
            مَسْح
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-brand-deep">
          عَيْن المُضَارِع
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onVowel("auto")}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              vowel === "auto"
                ? "border-brand bg-brand text-primary-foreground"
                : "border-border bg-background hover:border-brand"
            }`}
          >
            تلقائي (
            {VOWELS.find((v) => v.key === autoVowel)?.label.split(" ")[0]})
          </button>
          {VOWELS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => onVowel(v.key)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                vowel === v.key
                  ? "border-brand bg-brand text-primary-foreground"
                  : "border-border bg-background hover:border-brand"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-brand-deep">
          أَمْثِلَة جَاهِزَة
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onVerb(p);
                onVowel("auto");
              }}
              className="rounded-full border border-accent/60 bg-accent/15 px-4 py-1.5 font-[family-name:var(--font-quran)] text-xl text-brand-deep transition hover:bg-accent/40"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
