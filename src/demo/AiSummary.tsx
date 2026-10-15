import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, CornerDownRight, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card, cx, SectionLabel, Tag } from "@/components/ui";
import { SCORECARDS, type Candidate, type SummaryLine } from "@/data/mock";
import { getSummary, SUMMARY_MODE, summarySources } from "@/lib/summarize";

/* ---------------------------------------------------------------------------
   A summary for the hiring team, streamed in like a model response. It opens
   with a short trace of what it read, then writes line by line. In demo mode
   the text is pre-written and nothing leaves the browser. Every line names
   the scorecard or application it came from.
   --------------------------------------------------------------------------- */

const CHARS_PER_SEC = 260;
const STEP_MS = 520;

const reduced = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const GROUPS: { kind: SummaryLine["kind"]; label?: string }[] = [
  { kind: "summary" },
  { kind: "strength", label: "What stands out" },
  { kind: "question", label: "Still open" },
];

export interface FollowUp {
  label: string;
  /** What clicking it does, said plainly, e.g. "Opens her profile". */
  hint: string;
  onClick: () => void;
}

function stepsFor(c: Candidate) {
  const n = SCORECARDS.filter((s) => s.candidateId === c.id).length;
  if (!n) return ["Reading the application", "Checking it against the role rubric", "Collecting open questions"];
  return [
    `Reading ${n} scorecard${n > 1 ? "s" : ""} and the application`,
    n > 1 ? "Comparing ratings across rounds" : "Reading the ratings",
    "Collecting open questions",
  ];
}

export default function AiSummary({ c, n, followUps = [] }: { c: Candidate; n?: number; followUps?: FollowUp[] }) {
  const [lines, setLines] = useState<SummaryLine[] | null>(null);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"thinking" | "writing" | "done">("thinking");
  const [stepsDone, setStepsDone] = useState(0);
  const [thoughtMs, setThoughtMs] = useState(0);
  const [traceOpen, setTraceOpen] = useState(true);
  const [run, setRun] = useState(0);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const raf = useRef(0);
  const cRef = useRef(c);
  cRef.current = c;
  const steps = stepsFor(c);

  // Restart only when the person changes or Regenerate is pressed, not on a stage move.
  useEffect(() => {
    let alive = true;
    const timers: number[] = [];
    setPhase("thinking");
    setShown(0);
    setStepsDone(0);
    setTraceOpen(true);
    setVote(null);
    const started = performance.now();
    const count = stepsFor(cRef.current).length;

    getSummary(cRef.current).then((ls) => {
      if (!alive) return;
      setLines(ls);
      const total = ls.reduce((a, l) => a + l.text.length, 0);
      if (reduced()) {
        setStepsDone(count);
        setThoughtMs(0);
        setShown(total);
        setPhase("done");
        return;
      }
      for (let i = 1; i <= count; i++) timers.push(window.setTimeout(() => alive && setStepsDone(i), i * STEP_MS));
      timers.push(window.setTimeout(() => {
        if (!alive) return;
        setThoughtMs(performance.now() - started);
        setPhase("writing");
        setTraceOpen(false);
        const t0 = performance.now();
        const tick = (t: number) => {
          const k = Math.min(total, Math.floor(((t - t0) / 1000) * CHARS_PER_SEC));
          setShown(k);
          if (k < total) raf.current = requestAnimationFrame(tick);
          else setPhase("done");
        };
        raf.current = requestAnimationFrame(tick);
      }, count * STEP_MS + 260));
    });
    return () => { alive = false; timers.forEach(clearTimeout); cancelAnimationFrame(raf.current); };
  }, [c.id, run]);

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
  const sourceCount = new Set(ordered.flatMap((l) => l.source.split(" · "))).size;
  const secs = Math.max(1, Math.round(thoughtMs / 1000));

  const copy = async () => {
    const text = GROUPS.flatMap((g) => ordered.filter((l) => l.kind === g.kind).map((l) => `${g.label ? "- " : ""}${l.text} (${l.source})`)).join("\n");
    try { await navigator.clipboard.writeText(text); } catch { /* Clipboard refused: still confirm, nothing to lose. */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel n={n} title="Summary for the hiring team">Drawn from {summarySources(c)}</SectionLabel>
      <Card className="px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag color="var(--primary)">{SUMMARY_MODE === "demo" ? "Demo mode · pre-written, no model call" : "AI draft"}</Tag>
        </div>

        {/* Thinking trace */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setTraceOpen((o) => !o)}
            aria-expanded={traceOpen}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-foreground"
          >
            {phase === "thinking"
              ? <span className={cx(!reduced() && "shimmer-once")}>Thinking</span>
              : <span>{thoughtMs ? `Thought for ${secs} second${secs > 1 ? "s" : ""}` : `Checked ${steps.length} steps`}</span>}
            <ChevronDown className={cx("size-3.5 transition-transform duration-200", traceOpen ? "rotate-0" : "-rotate-90")} />
          </button>
          {traceOpen && (
            <ol className="mt-2 ml-[5px] flex flex-col gap-1.5 border-l border-rim-strong pl-3.5">
              {steps.map((s, i) => {
                const done = i < stepsDone;
                const active = i === stepsDone && phase === "thinking";
                return (
                  <li key={s} className={cx("flex items-center gap-2 text-[12.5px]", done ? "text-muted" : active ? "text-foreground" : "text-faint")}>
                    <span className={cx(
                      "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
                      done ? "bg-success text-[var(--card)]" : active ? "shadow-[inset_0_0_0_1.5px_var(--primary)]" : "shadow-[inset_0_0_0_1.5px_var(--rim-strong)]",
                    )}>
                      {done && <Check className="size-2.5" strokeWidth={3.5} />}
                    </span>
                    {s}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Streamed lines */}
        <div className="mt-4" aria-live="polite" aria-busy={phase !== "done"}>
          {phase === "thinking" ? (
            <div className="space-y-2" aria-hidden>
              {[92, 78, 85].map((w, i) => <div key={i} className="h-2.5 rounded-full bg-inset" style={{ width: `${w}%` }} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {GROUPS.map((g) => {
                const items = (lines ?? []).filter((l) => l.kind === g.kind && visible.has(l));
                if (!items.length) return null;
                return (
                  <div key={g.kind}>
                    {g.label && <div className="mb-1.5 text-[12px] text-faint">{g.label}</div>}
                    <ul className={cx(g.kind === "summary" ? "space-y-1" : "space-y-1.5")}>
                      {items.map((l) => (
                        <li key={l.text} className={cx("flex items-start gap-2.5", g.kind === "summary" ? "text-[14px] leading-relaxed" : "text-[13px] leading-relaxed")}>
                          {g.kind !== "summary" && (
                            <span className={cx("mt-[7px] size-1.5 shrink-0 rounded-full", g.kind === "strength" ? "bg-success" : "bg-warning")} />
                          )}
                          <span className="min-w-0 flex-1">
                            {visible.get(l)}
                            {l === writingLine && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-primary" aria-hidden />}
                            {visible.get(l)!.length === l.text.length && l.source.split(" · ").map((s) => (
                              <span key={s} className="ml-1.5 inline-flex h-[18px] translate-y-[-1px] items-center rounded-[5px] bg-inset px-1.5 align-middle font-mono text-[10.5px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">
                                {s}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cx("mt-4 flex flex-wrap items-center gap-1 transition-opacity duration-200", phase === "done" ? "opacity-100" : "pointer-events-none opacity-0")}>
          <IconBtn label={copied ? "Copied" : "Copy summary"} onClick={copy} on={copied}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </IconBtn>
          <IconBtn label="Regenerate" onClick={() => setRun((r) => r + 1)}><RotateCcw className="size-3.5" /></IconBtn>
          <IconBtn label="Useful" onClick={() => setVote((v) => (v === "up" ? null : "up"))} on={vote === "up"} pressable>
            <ThumbsUp className="size-3.5" fill={vote === "up" ? "currentColor" : "none"} />
          </IconBtn>
          <IconBtn label="Not useful" onClick={() => setVote((v) => (v === "down" ? null : "down"))} on={vote === "down"} pressable>
            <ThumbsDown className="size-3.5" fill={vote === "down" ? "currentColor" : "none"} />
          </IconBtn>
          <span className="ml-1.5 text-[12px] text-faint">
            {copied ? "Copied with sources" : vote ? "Thanks. Kept in this browser only." : `${sourceCount} source${sourceCount === 1 ? "" : "s"}`}
          </span>
        </div>

        {/* Follow-ups */}
        {followUps.length > 0 && phase === "done" && (
          <div className="mt-4">
            <div className="text-[12px] text-faint">Follow-ups</div>
            <ul className="mt-1">
              {followUps.map((f) => (
                <li key={f.label} className="border-b border-rim last:border-b-0">
                  <button type="button" onClick={f.onClick} className="group flex w-full items-center gap-2 py-2 text-left text-[13px]">
                    <CornerDownRight className="size-3.5 shrink-0 text-faint group-hover:text-primary" />
                    <span className="min-w-0 flex-1 truncate group-hover:text-foreground">{f.label}</span>
                    <span className="hidden shrink-0 text-[11.5px] text-faint sm:inline">{f.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="rule-dashed mt-4 border-t pt-3 text-[11.5px] text-faint">
          Drawn only from {summarySources(c)}. A draft for you to check, not a decision.
        </p>
      </Card>
    </section>
  );
}

function IconBtn({ label, onClick, on, pressable, children }: { label: string; onClick: () => void; on?: boolean; pressable?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressable ? on : undefined}
      title={label}
      className={cx(
        "inline-flex size-7 items-center justify-center rounded-control transition-colors",
        on ? "bg-inset text-foreground" : "text-faint hover:bg-inset hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
