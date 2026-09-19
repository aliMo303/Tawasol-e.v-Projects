import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Copy, FileDown, FileText, Printer } from "lucide-react";

import logo from "@/assets/tawasol-logo.png.asset.json";
import { ConjugationTable } from "@/components/ConjugationTable";
import { VerbControls } from "@/components/VerbControls";
import {
  conjugate,
  defaultMiddleVowel,
  type MiddleVowel,
} from "@/lib/conjugation/engine";
import { downloadDocx } from "@/lib/export/exportDocx";
import { copyTable, printConjugation } from "@/lib/export/exportPrint";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تواصل صرف | تصريف الأفعال العربية بالتشكيل الكامل" },
      {
        name: "description",
        content:
          "صرّف أي فعل عربي في الماضي والمضارع والأمر مع ضبط التشكيل وتلوين الزوائد، وحمّل الجدول بصيغة Word أو PDF.",
      },
      {
        property: "og:title",
        content: "تواصل صرف | تصريف الأفعال العربية",
      },
      {
        property: "og:description",
        content:
          "أداة تواصل لتصريف الأفعال العربية في جدول مشكول ملوّن قابل للتنزيل بصيغة Word أو PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [verb, setVerb] = useState("كَتَبَ");
  const [vowel, setVowel] = useState<MiddleVowel | "auto">("auto");
  const [showJazm, setShowJazm] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const autoVowel = useMemo(() => defaultMiddleVowel(verb), [verb]);
  const result = useMemo(
    () => conjugate(verb, vowel === "auto" ? undefined : vowel),
    [verb, vowel],
  );

  const onCopy = async () => {
    const ok = await copyTable(verb);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const onWord = async () => {
    setBusy(true);
    try {
      await downloadDocx(verb, result.rows, showJazm);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="no-print bg-brand text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-5">
          <img
            src={logo.url}
            alt="شعار جمعية تواصل"
            className="h-14 w-14 rounded-xl bg-card object-contain p-1.5"
            width={56}
            height={56}
          />
          <div>
            <p className="font-[family-name:var(--font-quran)] text-3xl font-bold leading-tight">
              تَوَاصُل صَرْف
            </p>
            <p className="text-sm opacity-90">Tawasol Sarf</p>
          </div>
          <a
            href="https://tawasol.de/"
            target="_blank"
            rel="noreferrer"
            className="mr-auto rounded-lg border border-primary-foreground/40 px-4 py-2 text-sm transition hover:bg-primary-foreground/10"
          >
            tawasol.de
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="no-print mb-8 rounded-3xl bg-mint p-8 text-center">
          <h1 className="font-[family-name:var(--font-quran)] text-4xl font-bold text-brand-deep sm:text-5xl">
            تَصْرِيف الأَفْعَال العَرَبِيَّة
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            تصريف الأفعال العربية وفق أحدث المعايير الصرفية — الماضي والمضارع
            والأمر مع تشكيل كامل وتلوين الزوائد.
          </p>
        </section>

        <div className="no-print mb-8">
          <VerbControls
            verb={verb}
            onVerb={setVerb}
            vowel={vowel}
            onVowel={setVowel}
            autoVowel={autoVowel}
          />
        </div>

        {result.error ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-destructive">
            {result.error}
          </p>
        ) : (
          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-brand-deep">
                  {result.analysis.kindLabel}
                </span>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-brand-deep">
                  {result.analysis.weakLabel}
                </span>
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showJazm}
                    onChange={(e) => setShowJazm(e.target.checked)}
                    className="size-4 accent-[oklch(0.452_0.0767_187.5)]"
                  />
                  إظهار المجزوم
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onWord}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-semibold text-primary-foreground shadow-sm transition hover:bg-brand-deep disabled:opacity-60"
                >
                  <FileText className="size-4" />
                  تحميل Word
                </button>
                <button
                  type="button"
                  onClick={() => printConjugation(verb)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-semibold text-accent-foreground shadow-sm transition hover:brightness-95"
                >
                  <FileDown className="size-4" />
                  تحميل PDF
                </button>
                <button
                  type="button"
                  onClick={() => printConjugation(verb)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 font-semibold text-brand-deep transition hover:border-brand"
                >
                  <Printer className="size-4" />
                  طباعة
                </button>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 font-semibold text-brand-deep transition hover:border-brand"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "تم النسخ" : "نسخ الجدول"}
                </button>
              </div>
            </div>

            <ConjugationTable
              rows={result.rows}
              verb={verb}
              showJazm={showJazm}
            />
          </section>
        )}
      </main>

      <footer className="no-print py-8 text-center text-sm text-muted-foreground">
        تواصل صرف — بُني على خوارزمية قُطرُب الصرفية.
      </footer>
    </div>
  );
}
