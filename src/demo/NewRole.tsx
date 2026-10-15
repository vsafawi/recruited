import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft, ArrowRight, Check, CircleCheck, Loader2, MapPin, Plus, RotateCcw, Sparkles, X,
} from "lucide-react";
import { PageHeader } from "./Shell";
import { Button, ButtonLink, Card, cx, TierBadge } from "@/components/ui";
import { BOARDS, TIER_COLOR, TIER_LABEL, type BoardId, type Tier } from "@/data/mock";

/* ---------------------------------------------------------------------------
   New role: basics -> scorecard -> variants -> boards. Local state only;
   publishing shows what would happen and saves nothing.
   --------------------------------------------------------------------------- */

const STEPS = [
  { id: 0, label: "Role basics", hint: "What you're hiring for" },
  { id: 1, label: "Scorecard", hint: "What makes A, B and C" },
  { id: 2, label: "Variants", hint: "Two ways to say it" },
  { id: 3, label: "Boards", hint: "Where each one runs" },
] as const;

type PayUnit = "yr" | "mo" | "hr";
type Variant = { headline: string; payBand: string; hypothesis: string; body: string };
type V = "A" | "B";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

function payLabel(min: number, max: number, unit: PayUnit) {
  if (unit === "yr") return `$${Math.round(min / 1000)}–${Math.round(max / 1000)}k`;
  return `${money(min)}–${money(max)} / ${unit}`;
}

const input =
  "h-9 w-full rounded-control bg-card px-3 text-[13.5px] shadow-[0_0_0_1px_var(--rim),0_1px_1px_oklch(0_0_0/0.03)] outline-none transition-shadow placeholder:text-faint focus:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_color-mix(in_oklch,var(--primary)_15%,transparent)]";

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-[12.5px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-faint">{hint}</span>}
    </label>
  );
}

/* --------------------------------------------------------------- toasts */

function useToast() {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number>(0);
  const push = (text: string) => {
    window.clearTimeout(timer.current);
    setMsg({ id: Date.now(), text });
    timer.current = window.setTimeout(() => setMsg(null), 3200);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node = (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
            className="flex items-center gap-2 rounded-card bg-foreground px-3.5 py-2.5 text-[13px] text-background shadow-overlay"
            role="status"
          >
            <Check className="size-4 text-ink-success" /> {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  return [node, push] as const;
}

/* -------------------------------------------------------------- stepper */

function Stepper({ step, maxReached, go }: { step: number; maxReached: number; go: (n: number) => void }) {
  return (
    <>
      {/* compact, under md */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between text-[12.5px]">
          <span className="font-medium">{STEPS[step].label}</span>
          <span className="tnum text-muted">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {STEPS.map((s) => (
            <span key={s.id} className={cx("h-1 rounded-full transition-colors duration-300", s.id <= step ? "bg-primary" : "bg-rim")} />
          ))}
        </div>
      </div>
      <ol className="hidden items-center gap-2 md:flex">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          const reachable = i <= maxReached;
          return (
            <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                disabled={!reachable}
                onClick={() => go(i)}
                className={cx(
                  "group flex min-w-0 flex-1 items-center gap-2.5 rounded-card px-2.5 py-2 text-left transition-colors",
                  current ? "bg-card shadow-card" : reachable ? "hover:bg-[var(--wash)]" : "cursor-default",
                )}
              >
                <span
                  className={cx(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold transition-colors duration-200",
                    done ? "bg-primary text-on-primary" : current ? "bg-foreground text-background" : "bg-inset text-faint shadow-[inset_0_0_0_1px_var(--rim)]",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cx("block truncate text-[13px] font-medium", !current && !done && "text-muted")}>{s.label}</span>
                  <span className="block truncate text-[11.5px] text-faint">{s.hint}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && <span className={cx("h-px w-4 shrink-0 lg:w-8", i < step ? "bg-primary" : "bg-rim-strong")} />}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ----------------------------------------------------------- step: basics */

type Basics = { title: string; team: string; location: string; min: number; max: number; unit: PayUnit };

function StepBasics({ b, set }: { b: Basics; set: (p: Partial<Basics>) => void }) {
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Role basics</h2>
      <p className="mt-0.5 text-[12.5px] text-muted">This is the part every variant shares. You'll vary the wording and the pay band in step 3.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Job title" className="sm:col-span-2">
          <input className={input} value={b.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Sync Licensing Coordinator" autoFocus />
        </Field>
        <Field label="Team">
          <input className={input} value={b.team} onChange={(e) => set({ team: e.target.value })} placeholder="e.g. Licensing" />
        </Field>
        <Field label="Location">
          <input className={input} value={b.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Remote" />
        </Field>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12.5px] font-medium">Pay range</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-32">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-faint">$</span>
              <input className={cx(input, "tnum pl-6")} inputMode="numeric" value={b.min || ""} onChange={(e) => set({ min: Number(e.target.value.replace(/\D/g, "")) })} aria-label="Minimum pay" />
            </div>
            <span className="text-faint">to</span>
            <div className="relative w-32">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-faint">$</span>
              <input className={cx(input, "tnum pl-6")} inputMode="numeric" value={b.max || ""} onChange={(e) => set({ max: Number(e.target.value.replace(/\D/g, "")) })} aria-label="Maximum pay" />
            </div>
            <div className="inline-flex rounded-control bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)]">
              {(["yr", "mo", "hr"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => set({ unit: u })}
                  className={cx("h-8 rounded-[6px] px-2.5 text-[12.5px] font-medium transition-colors", b.unit === u ? "bg-card text-foreground shadow-card" : "text-muted hover:text-foreground")}
                >
                  / {u}
                </button>
              ))}
            </div>
          </div>
          <span className={cx("text-[11.5px]", b.max && b.min > b.max ? "text-destructive" : "text-faint")}>
            {b.max && b.min > b.max ? "The minimum is above the maximum." : "The range you're prepared to pay. Each variant can show a band inside it, or none."}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------------------------------- step: rubric */

type Rubric = Record<Tier, string[]>;

function StepRubric({ rubric, setRubric }: { rubric: Rubric; setRubric: React.Dispatch<React.SetStateAction<Rubric>> }) {
  const [drafts, setDrafts] = useState<Record<Tier, string>>({ A: "", B: "", C: "" });
  const add = (t: Tier) => {
    const v = drafts[t].trim();
    if (!v) return;
    setRubric((r) => (r[t].includes(v) ? r : { ...r, [t]: [...r[t], v] }));
    setDrafts((d) => ({ ...d, [t]: "" }));
  };
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Scorecard rubric</h2>
      <p className="mt-0.5 text-[12.5px] text-muted">
        Every applicant gets scored against this, so you can compare boards on who they bring, not how many. Edit the signals to fit the role.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {(["A", "B", "C"] as const).map((t) => (
          <div key={t} className="rounded-card bg-inset/60 p-3.5 shadow-[inset_0_0_0_1px_var(--rim)]">
            <div className="flex items-center gap-2">
              <TierBadge tier={t} />
              <span className="text-[13px] font-medium">Tier {t}</span>
              <span className="truncate text-[12px] text-muted">{TIER_LABEL[t].split("—")[1]?.trim() ?? TIER_LABEL[t]}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <AnimatePresence initial={false}>
                {rubric[t].map((chip) => (
                  <motion.span
                    key={chip}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-card pr-1 pl-2.5 text-[12.5px] shadow-card"
                  >
                    <span className="size-1.5 rounded-full" style={{ background: TIER_COLOR[t] }} />
                    <span className="ml-0.5">{chip}</span>
                    <button
                      onClick={() => setRubric((r) => ({ ...r, [t]: r[t].filter((x) => x !== chip) }))}
                      className="inline-flex size-5 items-center justify-center rounded-full text-faint hover:bg-inset hover:text-foreground"
                      aria-label={`Remove ${chip}`}
                    >
                      <X className="size-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  add(t);
                }}
                className="flex h-7 items-center gap-1 rounded-full px-1 shadow-[inset_0_0_0_1px_var(--rim-strong)] focus-within:shadow-[inset_0_0_0_1px_var(--primary)]"
              >
                <Plus className="ml-1 size-3.5 text-faint" />
                <input
                  value={drafts[t]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [t]: e.target.value }))}
                  placeholder="Add a signal"
                  className="w-28 bg-transparent text-[12.5px] outline-none placeholder:text-faint"
                  aria-label={`Add a Tier ${t} signal`}
                />
              </form>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------- step: variants */

function ListingPreview({ v, letter, basics, active }: { v: Variant; letter: V; basics: Basics; active: boolean }) {
  return (
    <div
      className={cx(
        "rounded-card bg-card p-4 transition-shadow duration-200",
        active ? "shadow-[0_0_0_1.5px_var(--primary),0_6px_18px_color-mix(in_oklch,var(--primary)_12%,transparent)]" : "shadow-card",
      )}
    >
      <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.04em] text-faint uppercase">
        <span>Preview · Variant {letter}</span>
        {v.hypothesis && <span className="truncate pl-3 normal-case tracking-normal">Tests: {v.hypothesis}</span>}
      </div>
      <div className="mt-3 flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-foreground text-[12px] font-semibold text-background">MM</span>
        <div className="min-w-0">
          <div className={cx("text-[14.5px] leading-snug font-semibold tracking-[-0.01em]", !v.headline && "text-faint")}>
            {v.headline || "Your headline"}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
            <span>Music Market Agency</span>
            <span className="text-faint">·</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{basics.location || "Location"}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={cx("tnum rounded-chip px-1.5 py-0.5 text-[11.5px] font-medium", v.payBand ? "bg-[color-mix(in_oklch,var(--success)_12%,transparent)] text-success" : "bg-inset text-muted")}>
          {v.payBand || "Pay not shown"}
        </span>
        {basics.team && <span className="rounded-chip bg-inset px-1.5 py-0.5 text-[11.5px] text-muted">{basics.team}</span>}
        <span className="rounded-chip bg-inset px-1.5 py-0.5 text-[11.5px] text-muted">Full time</span>
      </div>
      <p className={cx("mt-3 line-clamp-4 text-[12.5px] leading-relaxed whitespace-pre-line", v.body ? "text-muted" : "text-faint")}>
        {v.body || "The body of the listing appears here."}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-rim pt-3">
        <span className="text-[11.5px] text-faint">Posted today</span>
        <span className="inline-flex h-7 items-center rounded-control bg-primary px-3 text-[12px] font-medium text-on-primary">Apply</span>
      </div>
    </div>
  );
}

function StepVariants({
  basics, rubric, variants, setVariant, drafted, setDrafted, toast,
}: {
  basics: Basics;
  rubric: Rubric;
  variants: Record<V, Variant>;
  setVariant: (k: V, p: Partial<Variant>) => void;
  drafted: boolean;
  setDrafted: (b: boolean) => void;
  toast: (t: string) => void;
}) {
  const [tab, setTab] = useState<V>("A");
  const [drafting, setDrafting] = useState(false);
  const v = variants[tab];

  const draftB = () => {
    setTab("B");
    setDrafting(true);
    window.setTimeout(() => {
      const signals = rubric.A.slice(0, 3);
      const top = Math.round((basics.max * 1.0) / (basics.unit === "yr" ? 1000 : 1));
      const low = Math.round(((basics.min + basics.max) / 2) / (basics.unit === "yr" ? 1000 : 1));
      const band = basics.unit === "yr" ? `$${low}–${top}k` : `$${low}–${top} / ${basics.unit}`;
      const tools = signals.find((s) => /DISCO|Synchtank|Notion|Asana|Airtable/i.test(s));
      setVariant("B", {
        headline: `${basics.title || "Coordinator"}${tools ? ` (${tools.replace(/^Knows\s+/i, "").replace(/\s+or\s+/i, ", ")})` : ""} — ${band}, ${basics.location.toLowerCase().startsWith("remote") ? "remote" : basics.location}`,
        payBand: band,
        hypothesis: "Upper half of the band, tools named in the headline",
        body:
          `You'll ${basics.team ? `join ${basics.team} and ` : ""}own the work end to end from week one.\n\n` +
          `You're a fit if you have:\n${signals.map((s) => `– ${s}`).join("\n")}\n\n` +
          `We pay ${band}. Tell us about one placement or project you're proud of in your first two lines.`,
      });
      setDrafting(false);
      setDrafted(true);
      toast("Variant B drafted. Read it through before you publish.");
    }, 900);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Card className="p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Variants</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Change one or two things between A and B so the result tells you something.</p>
          </div>
          <div className="inline-flex rounded-control bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)]">
            {(["A", "B"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cx(
                  "inline-flex h-7 items-center gap-1.5 rounded-[6px] px-3 text-[12.5px] font-medium transition-colors",
                  tab === k ? "bg-card text-foreground shadow-card" : "text-muted hover:text-foreground",
                )}
              >
                Variant {k}
                {variants[k].headline && <span className="size-1.5 rounded-full bg-success" />}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {tab === "B" && drafted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex items-start gap-2.5 rounded-card bg-primary-tint px-3 py-2.5 text-[12.5px]">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">Draft for you to edit.</span>{" "}
                  <span className="text-muted">
                    Written only from your role basics and Tier A signals. It doesn't know your company, so check every claim before it goes live.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setVariant("B", { headline: "", payBand: "", hypothesis: "", body: "" });
                    setDrafted(false);
                  }}
                  className="shrink-0 text-[12px] font-medium text-muted hover:text-foreground"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cx("relative mt-5 grid gap-4 transition-opacity", drafting && "opacity-40")}>
          <Field label="Headline" hint="What candidates see in search results. Most boards cut off around 70 characters.">
            <input className={input} value={v.headline} onChange={(e) => setVariant(tab, { headline: e.target.value })} placeholder={tab === "B" ? "Try different wording or a pay band in the title" : ""} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pay band shown" hint={`Your range: ${payLabel(basics.min, basics.max, basics.unit)}. Leave blank to hide it.`}>
              <input className={cx(input, "tnum")} value={v.payBand} onChange={(e) => setVariant(tab, { payBand: e.target.value })} />
            </Field>
            <Field label="What this variant tests">
              <input className={input} value={v.hypothesis} onChange={(e) => setVariant(tab, { hypothesis: e.target.value })} placeholder="e.g. Salary in the headline" />
            </Field>
          </div>
          <Field label="Body">
            <textarea
              className={cx(input, "h-auto min-h-36 resize-y py-2 leading-relaxed")}
              value={v.body}
              onChange={(e) => setVariant(tab, { body: e.target.value })}
            />
          </Field>
          {drafting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-[12.5px] shadow-raised">
                <Loader2 className="size-3.5 animate-spin text-primary" /> Drafting variant B
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-rim pt-4">
          <Button variant="secondary" onClick={draftB} disabled={drafting}>
            <Sparkles className="size-4 text-primary" /> {drafted ? "Draft variant B again" : "Ask the assistant to draft variant B"}
          </Button>
          <span className="text-[11.5px] text-faint">Uses only your basics and scorecard.</span>
        </div>
      </Card>

      <div className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
        {(["A", "B"] as const).map((k) => (
          <button key={k} className="text-left" onClick={() => setTab(k)}>
            <ListingPreview v={variants[k]} letter={k} basics={basics} active={tab === k} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- step: boards */

type Assign = Partial<Record<BoardId, V>>;

function StepBoards({ assign, setAssign, variants }: { assign: Assign; setAssign: React.Dispatch<React.SetStateAction<Assign>>; variants: Record<V, Variant> }) {
  const chosen = BOARDS.filter((b) => assign[b.id]);
  const spend = chosen.reduce((a, b) => a + b.costPerMonth, 0);
  const count = (k: V) => chosen.filter((b) => assign[b.id] === k).length;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card className="p-4 md:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Boards</h2>
        <p className="mt-0.5 text-[12.5px] text-muted">Pick where the role runs and which variant each board gets. Running both on one board is a separate listing per variant.</p>
        <div className="mt-5 flex flex-col gap-2">
          {BOARDS.map((b) => {
            const on = !!assign[b.id];
            return (
              <div
                key={b.id}
                className={cx(
                  "flex flex-wrap items-center gap-3 rounded-card p-3 transition-[box-shadow,background] duration-200",
                  on ? "bg-card shadow-[0_0_0_1.5px_var(--primary)]" : "bg-inset/50 shadow-[inset_0_0_0_1px_var(--rim)]",
                )}
              >
                <button
                  onClick={() => setAssign((a) => ({ ...a, [b.id]: on ? undefined : "A" }))}
                  className="flex min-w-0 flex-1 basis-full items-center gap-3 text-left sm:basis-0"
                  aria-pressed={on}
                >
                  <span
                    className={cx(
                      "inline-flex size-4.5 shrink-0 items-center justify-center rounded-[5px] transition-colors",
                      on ? "bg-primary text-on-primary" : "bg-card shadow-[inset_0_0_0_1px_var(--rim-strong)]",
                    )}
                  >
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] font-mono text-[10.5px] font-semibold text-white" style={{ background: b.color }}>
                    {b.short}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{b.name}</span>
                    <span className="block truncate text-[12px] text-muted">{b.audience}</span>
                  </span>
                </button>
                <span className="tnum pl-[60px] text-[12.5px] text-muted sm:ml-auto sm:pl-0">{money(b.costPerMonth)} / mo</span>
                <div className={cx("ml-auto inline-flex rounded-control bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)] transition-opacity sm:ml-0", !on && "pointer-events-none opacity-40")}>
                  {(["A", "B"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setAssign((a) => ({ ...a, [b.id]: k }))}
                      className={cx(
                        "h-7 w-9 rounded-[6px] font-mono text-[12px] font-semibold transition-colors",
                        assign[b.id] === k ? "bg-card text-foreground shadow-card" : "text-muted hover:text-foreground",
                      )}
                      aria-label={`Run variant ${k} on ${b.name}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 md:p-6 lg:sticky lg:top-6 lg:self-start">
        <div className="text-[12px] text-muted">Estimated monthly spend</div>
        <motion.div key={spend} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} className="tnum mt-1 text-[30px] leading-none font-semibold tracking-[-0.03em]">
          {money(spend)}
        </motion.div>
        <div className="mt-1 text-[12px] text-faint">Board fees only, billed by each board.</div>
        <div className="mt-5 flex flex-col gap-2 border-t border-rim pt-4">
          {chosen.length === 0 && <div className="text-[12.5px] text-muted">Pick at least one board.</div>}
          {chosen.map((b) => (
            <div key={b.id} className="flex items-center gap-2 text-[12.5px]">
              <span className="size-2 rounded-full" style={{ background: b.color }} />
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
              <span className="rounded-[5px] bg-inset px-1.5 font-mono text-[11px] font-semibold">{assign[b.id]}</span>
              <span className="tnum w-12 text-right text-muted">{money(b.costPerMonth)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["A", "B"] as const).map((k) => (
            <div key={k} className="rounded-control bg-inset px-3 py-2">
              <div className="text-[11.5px] text-muted">Variant {k}</div>
              <div className="tnum text-[13px] font-medium">{count(k)} {count(k) === 1 ? "board" : "boards"}</div>
              <div className="truncate text-[11px] text-faint">{variants[k].payBand || "Pay hidden"}</div>
            </div>
          ))}
        </div>
        {chosen.length > 0 && (count("A") === 0 || count("B") === 0) && (
          <p className="mt-3 text-[11.5px] text-warning">Only one variant is running, so there's nothing to compare yet.</p>
        )}
      </Card>
    </div>
  );
}

/* --------------------------------------------------------------- success */

function Published({ basics, assign, variants, reset }: { basics: Basics; assign: Assign; variants: Record<V, Variant>; reset: () => void }) {
  const chosen = BOARDS.filter((b) => assign[b.id]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}>
      <Card className="mx-auto max-w-2xl overflow-hidden">
        <div className="dot-grid flex flex-col items-center px-6 pt-10 pb-8 text-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.08 }}
            className="inline-flex size-12 items-center justify-center rounded-full bg-success text-white shadow-raised"
          >
            <CircleCheck className="size-6" />
          </motion.span>
          <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.02em]">
            {basics.title || "Your role"} is live on {chosen.length} {chosen.length === 1 ? "board" : "boards"}
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-muted">
            Applicants are scored against your rubric as they arrive. Give it a week before you call a winner; the first few days are noisy.
          </p>
        </div>
        <div className="border-t border-rim">
          {chosen.map((b) => {
            const k = assign[b.id]!;
            return (
              <div key={b.id} className="flex items-center gap-3 border-b border-rim px-5 py-3 last:border-0">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] font-mono text-[10px] font-semibold text-white" style={{ background: b.color }}>
                  {b.short}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{variants[k].headline || basics.title}</div>
                  <div className="text-[12px] text-muted">{b.name} · Variant {k} · {variants[k].payBand || "Pay hidden"}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-chip bg-[color-mix(in_oklch,var(--success)_11%,transparent)] px-1.5 py-0.5 text-[11.5px] font-medium text-success">
                  <span className="size-1.5 rounded-full bg-success" /> Live
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rim bg-inset/50 px-5 py-4">
          <Button variant="ghost" onClick={reset}><RotateCcw className="size-3.5" /> Post another role</Button>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/demo/pipeline">Open pipeline</ButtonLink>
            <ButtonLink to="/demo" variant="primary">See listings <ArrowRight className="size-4" /></ButtonLink>
          </div>
        </div>
      </Card>
      <p className="mt-4 text-center text-[12px] text-faint">This is a demo, so nothing was posted. On your own instance this step posts to each board you've connected.</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ page */

const INITIAL_BASICS: Basics = { title: "Sync Licensing Coordinator", team: "Licensing", location: "Remote · US hours", min: 48000, max: 58000, unit: "yr" };

const INITIAL_RUBRIC: Rubric = {
  A: ["Placed music in TV, film or ads", "Knows DISCO or Synchtank", "Has music supervisor contacts", "Clean metadata habits"],
  B: ["Adjacent licensing or publishing work", "Strong written pitches", "Organised in spreadsheets"],
  C: ["No industry exposure", "Needs supervision on outreach"],
};

const INITIAL_VARIANTS: Record<V, Variant> = {
  A: {
    headline: "Sync Licensing Coordinator",
    payBand: "",
    hypothesis: "Plain title, pay hidden",
    body:
      "Music Market Agency is looking for a Sync Licensing Coordinator to help pitch our artists' catalogue for TV, film, games and advertising.\n\nYou'll manage briefs, prepare playlists for supervisors and keep our metadata accurate.",
  },
  B: { headline: "", payBand: "", hypothesis: "", body: "" },
};

const INITIAL_ASSIGN: Assign = { mbw: "A", indeed: "B", roster: "A" };

export default function NewRole() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [basics, setBasics] = useState<Basics>(INITIAL_BASICS);
  const [rubric, setRubric] = useState<Rubric>(INITIAL_RUBRIC);
  const [variants, setVariants] = useState(INITIAL_VARIANTS);
  const [drafted, setDrafted] = useState(false);
  const [assign, setAssign] = useState<Assign>(INITIAL_ASSIGN);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [toastNode, toast] = useToast();

  const chosen = BOARDS.filter((b) => assign[b.id]);
  const valid = [
    basics.title.trim().length > 1 && (!basics.max || basics.min <= basics.max),
    rubric.A.length > 0,
    variants.A.headline.trim().length > 0 && variants.B.headline.trim().length > 0,
    chosen.length > 0,
  ];
  const blocker = [
    "Give the role a title to continue.",
    "Add at least one Tier A signal.",
    "Write a headline for both variants, or ask the assistant to draft B.",
    "Pick at least one board.",
  ][step];

  const go = (n: number) => {
    setStep(n);
    setMaxReached((m) => Math.max(m, n));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (!valid[step]) return;
    if (step < 3) return go(step + 1);
    setPublishing(true);
    window.setTimeout(() => {
      setPublishing(false);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1100);
  };

  const reset = () => {
    setBasics({ title: "", team: "", location: "Remote", min: 0, max: 0, unit: "yr" });
    setRubric(INITIAL_RUBRIC);
    setVariants({ A: { headline: "", payBand: "", hypothesis: "", body: "" }, B: { headline: "", payBand: "", hypothesis: "", body: "" } });
    setDrafted(false);
    setAssign(INITIAL_ASSIGN);
    setDone(false);
    setStep(0);
    setMaxReached(0);
  };

  const spend = chosen.reduce((a, b) => a + b.costPerMonth, 0);

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col md:min-h-dvh">
      <PageHeader
        title={done ? "Published" : "New role"}
        subtitle={done ? "Your listings are running. Results show up on the listings page as applicants arrive." : "Post one role as two variants across the boards you use, and let the results pick the wording."}
      />

      <div className="flex-1 px-4 pb-10 md:px-8">
        {done ? (
          <Published basics={basics} assign={assign} variants={variants} reset={reset} />
        ) : (
          <>
            <Stepper step={step} maxReached={maxReached} go={go} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="mt-5"
              >
                {step === 0 && <StepBasics b={basics} set={(p) => setBasics((b) => ({ ...b, ...p }))} />}
                {step === 1 && <StepRubric rubric={rubric} setRubric={setRubric} />}
                {step === 2 && (
                  <StepVariants
                    basics={basics}
                    rubric={rubric}
                    variants={variants}
                    setVariant={(k, p) => setVariants((v) => ({ ...v, [k]: { ...v[k], ...p } }))}
                    drafted={drafted}
                    setDrafted={setDrafted}
                    toast={toast}
                  />
                )}
                {step === 3 && <StepBoards assign={assign} setAssign={setAssign} variants={variants} />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      {!done && (
        <div className="sticky bottom-0 z-20 border-t border-rim bg-background/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-8">
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <div className="hidden min-w-0 flex-1 truncate text-right text-[12px] text-muted sm:block">
              {!valid[step] ? blocker : step === 3 ? <span className="tnum">{money(spend)} / mo across {chosen.length} {chosen.length === 1 ? "board" : "boards"}</span> : null}
            </div>
            <Button variant={step === 3 ? "primary" : "ink"} onClick={next} disabled={!valid[step] || publishing} className="ml-auto shrink-0" title={valid[step] ? undefined : blocker}>
              {publishing ? (
                <><Loader2 className="size-4 animate-spin" /> Publishing</>
              ) : step === 3 ? (
                <>Publish to {chosen.length} {chosen.length === 1 ? "board" : "boards"}</>
              ) : (
                <>Continue <ArrowRight className="size-4" /></>
              )}
            </Button>
          </div>
        </div>
      )}
      {toastNode}
    </div>
  );
}
