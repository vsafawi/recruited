import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Avatar, Button, Card, cx, SectionLabel, StatusMark, Tag } from "@/components/ui";
import AiSummary, { type FollowUp } from "./AiSummary";
import {
  CANDIDATES, ROUND_PLAN, roundsDone, SCORE_CRITERIA, SCORECARDS, STAGES, teamById, UPCOMING,
  type Candidate, type InterviewRound, type Recommendation, type Scorecard, type StageId,
} from "@/data/mock";

/* ---------------------------------------------------------------------------
   The interview loop on a candidate profile. Several people interview each
   candidate; every round leaves a scorecard, and the next interviewer gets a
   brief compiled only from what earlier rounds asked them to check.
   --------------------------------------------------------------------------- */

const REC: Record<Recommendation, { label: string; color: string }> = {
  "strong-yes": { label: "Strong yes", color: "var(--success)" },
  yes: { label: "Yes", color: "var(--tier-b)" },
  no: { label: "No", color: "color-mix(in oklch, var(--warning) 65%, var(--foreground))" },
  "strong-no": { label: "Strong no", color: "var(--destructive)" },
};

const FLOW: StageId[] = ["new", "screen", "assess", "interview", "offer", "hired"];
const stageOf = (s: StageId) => STAGES.find((x) => x.id === s)!;
const first = (name: string) => name.split(" ")[0];
const joinNames = (ids: string[]) => ids.map((o) => first(teamById(o).name)).join(" and ");

export function hasWrittenScorecards(c: Candidate) {
  return SCORECARDS.some((s) => s.candidateId === c.id);
}

export default function InterviewLoop({ c, stage, onStage, onTab, onNote }: {
  c: Candidate;
  stage: StageId;
  /** The profile's own stage change, so a decision here moves the candidate everywhere. */
  onStage: (s: StageId) => void;
  onTab: (t: "notes" | "scorecard") => void;
  onNote: (text: string) => void;
}) {
  const navigate = useNavigate();
  const plan = ROUND_PLAN[c.roleId];
  const cards = SCORECARDS.filter((s) => s.candidateId === c.id);
  const done = Math.min(roundsDone(c), plan.length);
  const upcoming = UPCOMING.find((u) => u.candidateId === c.id);
  const nextRound = done < plan.length ? plan[done] : undefined;
  const brief = cards.flatMap((s) => s.probeNext.map((p) => ({ text: p, from: s })));
  const showBrief = !!nextRound && stage !== "rejected";

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const say = (t: string) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // The closest other candidate for the same role, to compare against.
  const rival = CANDIDATES
    .filter((x) => x.roleId === c.roleId && x.id !== c.id && x.stage !== "rejected")
    .sort((a, b) => b.score - a.score)[0];

  const followUps: FollowUp[] = [
    ...(showBrief ? [{
      label: `See what to ask in the ${nextRound!.name.toLowerCase()}`,
      hint: "Jumps to the brief",
      onClick: () => document.getElementById("next-brief")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }),
    }] : []),
    ...(rival ? [{ label: `Compare with ${rival.name}`, hint: "Opens their profile", onClick: () => navigate(`/demo/candidates/${rival.id}`) }] : []),
    { label: "Read the team's notes", hint: "Switches tab", onClick: () => onTab("notes") },
  ];

  let n = 1;
  return (
    <div className="flex flex-col gap-8">
      <AiSummary c={c} n={n++} followUps={followUps} />

      <section className="flex flex-col gap-3">
        <SectionLabel n={n++} title="Interview loop">{done} of {plan.length} rounds done · open a round for its scorecard</SectionLabel>
        <Card className="px-3 py-3 md:px-5 md:py-5">
          <Rounds plan={plan} done={done} cards={cards} c={c} upcomingWhen={upcoming?.when} />
          {cards.length > 0 && <Verdict cards={cards} />}
          {done === 0 && (
            <p className="rule-dashed mt-4 border-t px-1 pt-3 text-[12.5px] text-muted">
              No rounds yet. {first(c.name)} scored {c.score} on the screening rubric; the first round is a {plan[0].name.toLowerCase()} with {first(teamById(plan[0].owners[0]).name)}.
            </p>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel n={n++} title="Next decision">Moves the candidate on the board, the table and this profile</SectionLabel>
        <Decision key={`${c.id}:${stage}`} c={c} stage={stage} nextRound={nextRound} when={upcoming?.when} onStage={onStage} onNote={onNote} say={say} />
      </section>

      {showBrief && (
        <section id="next-brief" className="flex scroll-mt-6 flex-col gap-3">
          <SectionLabel n={n++} title={`Brief for ${joinNames(nextRound!.owners)}`}>Compiled from earlier scorecards</SectionLabel>
          <NextBrief round={nextRound!} when={upcoming?.when} items={brief} c={c} />
        </section>
      )}

      <div
        aria-live="polite"
        className={cx(
          "pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition-[opacity,transform] duration-200 motion-reduce:transition-none",
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {toast && <div className="max-w-[calc(100vw-32px)] rounded-full bg-card px-4 py-2 text-[12.5px] shadow-overlay">{toast}</div>}
      </div>
    </div>
  );
}

/* --- Rounds as capsule rows ------------------------------------------------ */

function Rounds({ plan, done, cards, c, upcomingWhen }: {
  plan: InterviewRound[]; done: number; cards: Scorecard[]; c: Candidate; upcomingWhen?: string;
}) {
  // Open the latest written scorecard, so the first look shows what a round leaves behind.
  const latest = [...plan.slice(0, done)].reverse().find((r) => cards.some((s) => s.roundId === r.id));
  const [open, setOpen] = useState<string | null>(latest?.id ?? null);

  return (
    <ol className="flex flex-col gap-2">
      {plan.map((r, i) => {
        const state = i < done ? "done" : i === done ? "active" : "todo";
        const card = cards.find((s) => s.roundId === r.id);
        const isOpen = open === r.id;
        const lead = teamById(card?.by ?? r.owners[0]);
        const meta =
          state === "done" ? (
            <span className="inline-flex items-center gap-1.5">
              <Avatar initials={lead.initials} hue={lead.hue} size={18} />
              {first(lead.name)}{card ? ` · ${card.when}` : " · no written scorecard"}
            </span>
          ) : state === "active" ? (
            <span className="tnum">{upcomingWhen ?? "Not scheduled"} · {r.minutes} min</span>
          ) : (
            <span>{joinNames(r.owners)} · {r.minutes} min</span>
          );
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : r.id)}
              aria-expanded={isOpen}
              className={cx(
                "flex w-full items-center gap-3 rounded-full bg-card px-3 py-2.5 text-left shadow-[inset_0_0_0_1px_var(--rim)] transition-colors hover:bg-inset",
                state === "active" && "shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_45%,transparent)]",
                isOpen && "bg-inset",
              )}
            >
              <StatusMark state={state} n={i + 1} />
              <span className={cx("min-w-0 flex-1 truncate text-[13px] font-medium", state === "todo" && "text-muted")}>
                {r.name}
                <span className="ml-2 inline text-[12px] font-normal text-muted sm:hidden">{state === "active" ? upcomingWhen ?? "" : ""}</span>
              </span>
              <span className="hidden shrink-0 text-[12px] text-muted sm:inline-flex">{meta}</span>
              {state === "done" && <Tag color="var(--success)">Completed</Tag>}
              {state === "active" && <Tag color="var(--primary)">{upcomingWhen ? "Scheduled" : "Next"}</Tag>}
              <ChevronDown className={cx("size-4 shrink-0 text-faint transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")} />
            </button>
            {isOpen && (
              <div className="mx-2 mt-2 mb-1 rounded-card bg-inset px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--rim)] md:mx-4">
                <div className="mb-2 text-[12px] text-muted sm:hidden">{meta}</div>
                {card ? <RoundScorecard card={card} /> : (
                  <p className="text-[12.5px] text-muted">
                    {state === "done"
                      ? <>Passed with {first(lead.name)}. No written scorecard; the rubric score is {c.score}.</>
                      : <>This round is for: <span className="text-foreground">{r.focus}</span>. Run by {joinNames(r.owners)}, {r.minutes} minutes.</>}
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function RoundScorecard({ card }: { card: Scorecard }) {
  const by = teamById(card.by);
  const rec = REC[card.recommendation];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-muted">{by.name}, {by.title}</span>
        <Tag color={rec.color} className="ml-auto">{rec.label}</Tag>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed">{card.summary}</p>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {SCORE_CRITERIA.map((k, i) => (
          <div key={k} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-muted">{k}</span>
            <span className="flex items-center gap-1" aria-label={`${card.ratings[i]} of 4`}>
              {[1, 2, 3, 4].map((d) => (
                <span key={d} className={cx("h-1.5 w-4 rounded-full", d <= card.ratings[i] ? "bg-primary" : "bg-card shadow-[inset_0_0_0_1px_var(--rim-strong)]")} />
              ))}
              <span className="tnum ml-1 w-3 text-right font-mono text-[11px] text-faint">{card.ratings[i]}</span>
            </span>
          </div>
        ))}
      </div>
      {card.probeNext.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] text-faint">Next round, check:</span>
          {card.probeNext.map((p) => (
            <span key={p} className="rounded-[6px] bg-card px-1.5 py-0.5 text-[11.5px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Verdict({ cards }: { cards: Scorecard[] }) {
  const yes = cards.filter((s) => s.recommendation === "yes" || s.recommendation === "strong-yes").length;
  const avg = cards.reduce((a, s) => a + s.ratings.reduce((x, y) => x + y, 0) / 4, 0) / cards.length;
  return (
    <div className="rule-dashed mt-4 border-t px-1 pt-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[13px] font-semibold">Team verdict so far</span>
        <span className="tnum text-[12px] text-muted">{yes} of {cards.length} say hire · avg {avg.toFixed(1)} of 4</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {cards.map((s) => {
          const by = teamById(s.by);
          const rec = REC[s.recommendation];
          return (
            <li key={s.roundId} className="inline-flex items-center gap-2 rounded-full bg-inset py-1 pr-1 pl-1 text-[12.5px] shadow-[inset_0_0_0_1px_var(--rim)]">
              <Avatar initials={by.initials} hue={by.hue} size={20} />
              <span className="whitespace-nowrap">{first(by.name)} <span className="text-faint">· {by.title}</span></span>
              <Tag color={rec.color}>{rec.label}</Tag>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* --- Approval card for the next decision ---------------------------------- */

interface Choice { id: string; label: string; act: () => string }

function Decision({ c, stage, nextRound, when, onStage, onNote, say }: {
  c: Candidate; stage: StageId; nextRound?: InterviewRound; when?: string;
  onStage: (s: StageId) => void; onNote: (t: string) => void; say: (t: string) => void;
}) {
  const name = first(c.name);
  const nextStage = FLOW[FLOW.indexOf(stage) + 1] as StageId | undefined;
  const rejected = stage === "rejected";

  const question = rejected
    ? `Bring ${name} back?`
    : nextRound
      ? `Move ${name} to the ${nextRound.name.toLowerCase()}?`
      : nextStage
        ? `Advance ${name} to ${stageOf(nextStage).label}?`
        : `${name} is ${stageOf(stage).label.toLowerCase()}. Anything else?`;

  const choices: Choice[] = rejected
    ? [
        { id: "restore", label: "Restore to Screen", act: () => { onStage("screen"); return `${name} is back in Screen.`; } },
        { id: "keep", label: "Keep rejected", act: () => `${name} stays rejected. Nothing changed.` },
      ]
    : [
        ...(nextRound ? [{
          id: "round",
          label: `Yes, run the ${nextRound.name.toLowerCase()} with ${joinNames(nextRound.owners)}${when ? `, ${when}` : ""}`,
          act: () => `${nextRound.name} confirmed with ${joinNames(nextRound.owners)}. Demo only, no invite is sent.`,
        }] : []),
        ...(nextStage ? [{
          id: "advance",
          label: `Advance to ${stageOf(nextStage).label}${nextRound && (nextStage === "offer" || nextStage === "hired") ? " now, skip the remaining rounds" : ""}`,
          act: () => { onStage(nextStage); return `Moved ${name} to ${stageOf(nextStage).label}.`; },
        }] : []),
        { id: "hold", label: "Hold for now", act: () => `${name} stays in ${stageOf(stage).label}. Nothing changed.` },
        { id: "reject", label: "Reject", act: () => { onStage("rejected"); return `Rejected ${name}. Pick a stage above to undo.`; } },
      ];

  const [pick, setPick] = useState<string>(choices[0].id);
  const [other, setOther] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const go = () => {
    let msg: string;
    if (pick === "other") {
      const t = other.trim();
      if (!t) return;
      onNote(t);
      msg = "Added to notes for the team.";
    } else {
      msg = choices.find((ch) => ch.id === pick)!.act();
    }
    setResult(msg);
    say(msg);
  };

  if (result) {
    return (
      <Card className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-5">
        <StatusMark state="done" />
        <span className="min-w-0 flex-1 text-[13px]">{result}</span>
        <Button size="sm" variant="ghost" onClick={() => setResult(null)}>Decide again</Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-[560px] px-4 pt-4 pb-3 md:px-5">
      <h3 className="text-[14px] font-semibold">{question}</h3>
      <div role="radiogroup" aria-label={question} className="mt-3 flex flex-col gap-0.5">
        {choices.map((ch) => (
          <Radio key={ch.id} checked={pick === ch.id} onSelect={() => setPick(ch.id)} danger={ch.id === "reject"}>{ch.label}</Radio>
        ))}
        <label className={cx("mt-1 flex items-center gap-2.5 rounded-control px-1 py-1", pick === "other" && "bg-inset")}>
          <input
            value={other}
            onChange={(e) => { setOther(e.target.value); setPick("other"); }}
            onFocus={() => setPick("other")}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); go(); } }}
            placeholder="Something else… (saved as a note)"
            className="min-w-0 flex-1 bg-transparent px-1.5 text-[13px] outline-none placeholder:text-faint"
          />
        </label>
      </div>
      <div className="rule-dashed mt-3 flex items-center justify-end gap-2 border-t pt-3">
        <span className="mr-auto text-[11.5px] text-faint">Demo · nothing is sent</span>
        <Button size="sm" variant="ghost" onClick={() => { setResult("Skipped. Decide later."); }}>Skip</Button>
        <Button size="sm" variant="primary" disabled={pick === "other" && !other.trim()} onClick={go}>Continue</Button>
      </div>
    </Card>
  );
}

function Radio({ checked, onSelect, danger, children }: { checked: boolean; onSelect: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cx("flex items-center gap-2.5 rounded-control px-1 py-1.5 text-left text-[13px] transition-colors hover:bg-inset", danger && "text-[var(--destructive)]")}
    >
      <span className={cx(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full",
        checked ? "shadow-[inset_0_0_0_1.5px_var(--primary)]" : "shadow-[inset_0_0_0_1.5px_var(--rim-strong)]",
      )}>
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

/* --- Brief for the next interviewer --------------------------------------- */

function NextBrief({ round, when, items, c }: {
  round: InterviewRound; when?: string; items: { text: string; from: Scorecard }[]; c: Candidate;
}) {
  return (
    <Card className="px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex -space-x-1.5">
          {round.owners.map((o) => <Avatar key={o} initials={teamById(o).initials} hue={teamById(o).hue} size={22} />)}
        </div>
        <span className="text-[13px] font-medium">{round.name}</span>
        <span className="tnum text-[12px] text-muted">{when ?? "Not scheduled yet"} · {round.minutes} min</span>
      </div>
      <p className="mt-3 text-[12.5px] text-muted">This round is for: <span className="text-foreground">{round.focus}</span>.</p>
      {items.length ? (
        <>
          <div className="mt-4 text-[12px] text-faint">Earlier rounds asked you to check</div>
          <ul className="mt-1">
            {items.map((it, i) => {
              const by = teamById(it.from.by);
              const where = it.from.roundId === "screen" ? "screening" : "round " + (ROUND_PLAN[c.roleId].findIndex((r) => r.id === it.from.roundId) + 1);
              return (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-rim py-2 text-[13px] last:border-b-0">
                  <span className="font-mono text-[11px] text-faint tnum">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">{it.text}</span>
                  <span className="inline-flex h-[18px] items-center rounded-[5px] bg-inset px-1.5 font-mono text-[10.5px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">
                    {first(by.name)}, {where}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="rule-dashed mt-3 border-t pt-3 text-[11.5px] text-faint">Compiled from your team's scorecards. Nothing here is added or rewritten.</p>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-muted">No open questions from earlier rounds yet.</p>
      )}
    </Card>
  );
}
