import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button, Card, cx } from "@/components/ui";
import type { Candidate, SummaryLine } from "@/data/mock";
import { getSummary, SUMMARY_MODE, summarySources } from "@/lib/summarize";

/* ---------------------------------------------------------------------------
   A summary for the hiring team, streamed in like a model response. In demo
   mode the text is pre-written and nothing leaves the browser. Every line
   names the scorecard or application it came from.
   --------------------------------------------------------------------------- */

const CHARS_PER_SEC = 260;
const THINK_MS = 700;

const reduced = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const GROUPS: { kind: SummaryLine["kind"]; label?: string }[] = [
  { kind: "summary" },
  { kind: "strength", label: "What stands out" },
  { kind: "question", label: "Still open" },
];

export default function AiSummary({ c }: { c: Candidate }) {
  const [lines, setLines] = useState<SummaryLine[] | null>(null);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"thinking" | "writing" | "done">("thinking");
  const [run, setRun] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let alive = true;
    setPhase("thinking");
    setShown(0);
    const started = performance.now();
    getSummary(c).then((ls) => {
      if (!alive) return;
      setLines(ls);
      const total = ls.reduce((a, l) => a + l.text.length, 0);
      if (reduced()) { setShown(total); setPhase("done"); return; }
      const wait = Math.max(0, THINK_MS - (performance.now() - started));
      window.setTimeout(() => {
        if (!alive) return;
        setPhase("writing");
        const t0 = performance.now();
        const tick = (t: number) => {
          const n = Math.min(total, Math.floor(((t - t0) / 1000) * CHARS_PER_SEC));
          setShown(n);
          if (n < total) raf.current = requestAnimationFrame(tick);
          else setPhase("done");
        };
        raf.current = requestAnimationFrame(tick);
      }, wait);
    });
    return () => { alive = false; cancelAnimationFrame(raf.current); };
  }, [c, run]);

  // Hand out the revealed characters line by line, in display order.
  let budget = shown;
  const ordered = GROUPS.flatMap((g) => (lines ?? []).filter((l) => l.kind === g.kind));
  const visible = new Map<SummaryLine, string>();
  for (const l of ordered) {
    if (budget <= 0) break;
    visible.set(l, l.text.slice(0, budget));
    budget -= l.text.length;
  }
  const writingLine = phase === "writing" ? ordered.find((l) => (visible.get(l)?.length ?? 0) < l.text.length && visible.has(l)) : undefined;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-rim px-4 py-3 md:px-5">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-[14px] font-semibold">Summary for the hiring team</h2>
        <span className="rounded-chip bg-inset px-1.5 py-0.5 text-[11px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">
          {SUMMARY_MODE === "demo" ? "Demo mode · pre-written, no model call" : "AI draft"}
        </span>
        <Button size="sm" variant="ghost" className="ml-auto" disabled={phase !== "done"} onClick={() => setRun((r) => r + 1)}>
          <RotateCcw className="size-3.5" /> Regenerate
        </Button>
      </div>

      <div className="px-4 py-4 md:px-5" aria-live="polite" aria-busy={phase !== "done"}>
        {phase === "thinking" ? (
          <div>
            <p className="text-[12.5px] text-muted">Reading {summarySources(c)}…</p>
            <div className="mt-3 space-y-2" aria-hidden>
              {[92, 78, 85, 60].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full bg-inset" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {GROUPS.map((g) => {
              const items = (lines ?? []).filter((l) => l.kind === g.kind && visible.has(l));
              if (!items.length) return null;
              return (
                <div key={g.kind}>
                  {g.label && <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">{g.label}</div>}
                  <ul className={cx(g.kind === "summary" ? "space-y-1" : "space-y-1.5")}>
                    {items.map((l) => (
                      <li key={l.text} className={cx("flex items-start gap-2.5", g.kind === "summary" ? "text-[13.5px] leading-relaxed" : "text-[13px]")}>
                        {g.kind !== "summary" && (
                          <span className={cx("mt-1.5 size-1.5 shrink-0 rounded-full", g.kind === "strength" ? "bg-success" : "bg-warning")} />
                        )}
                        <span className="min-w-0 flex-1">
                          {visible.get(l)}
                          {l === writingLine && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-primary" aria-hidden />}
                          {visible.get(l)!.length === l.text.length && (
                            <span className="ml-1.5 whitespace-nowrap text-[11.5px] text-faint">{l.source}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-[11.5px] text-faint">
          Drawn only from {summarySources(c)}. A draft for you to check, not a decision.
        </p>
      </div>
    </Card>
  );
}
