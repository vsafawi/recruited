import { Check, CircleDashed, ClipboardList } from "lucide-react";
import { Avatar, Card, cx } from "@/components/ui";
import {
  ROUND_PLAN, roundsDone, SCORE_CRITERIA, SCORECARDS, teamById, UPCOMING,
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
  no: { label: "No", color: "var(--warning)" },
  "strong-no": { label: "Strong no", color: "var(--destructive)" },
};

export function hasWrittenScorecards(c: Candidate) {
  return SCORECARDS.some((s) => s.candidateId === c.id);
}

export default function InterviewLoop({ c, stage }: { c: Candidate; stage: StageId }) {
  const plan = ROUND_PLAN[c.roleId];
  const cards = SCORECARDS.filter((s) => s.candidateId === c.id);
  const done = roundsDone(c);
  const upcoming = UPCOMING.find((u) => u.candidateId === c.id);
  const nextRound = done < plan.length ? plan[done] : undefined;
  const brief = cards.flatMap((s) => s.probeNext.map((p) => ({ text: p, from: s })));

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 md:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[14px] font-semibold">Interview loop</h2>
          <span className="text-[12px] text-muted">{Math.min(done, plan.length)} of {plan.length} rounds done</span>
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {plan.map((r, i) => {
            const state = i < done ? "done" : i === done ? "next" : "later";
            return (
              <li key={r.id} className={cx(
                "rounded-card px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--rim)]",
                state === "next" && "bg-primary-tint shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_35%,transparent)]",
                state === "later" && "opacity-60",
              )}>
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">
                  {state === "done" ? <Check className="size-3 text-success" /> : <CircleDashed className={cx("size-3", state === "next" && "text-primary")} />}
                  Round {i + 1}
                </div>
                <div className="mt-1 text-[13px] font-medium leading-snug">{r.name}</div>
                <div className="mt-1.5 flex -space-x-1.5">
                  {r.owners.map((o) => <Avatar key={o} initials={teamById(o).initials} hue={teamById(o).hue} size={20} />)}
                </div>
              </li>
            );
          })}
        </ol>
        {cards.length > 0 && <Verdict cards={cards} />}
      </Card>

      {nextRound && stage !== "rejected" && <NextBrief round={nextRound} when={upcoming?.when} items={brief} c={c} />}

      {plan.map((r, i) => (i < done ? <RoundCard key={r.id} n={i + 1} round={r} card={cards.find((s) => s.roundId === r.id)} c={c} /> : null))}

      {done === 0 && (
        <Card className="p-5 text-[13px] text-muted">
          No rounds yet. {c.name.split(" ")[0]} scored {c.score} on the screening rubric; the first round is a {plan[0].name.toLowerCase()} with {teamById(plan[0].owners[0]).name.split(" ")[0]}.
        </Card>
      )}
    </div>
  );
}

function NextBrief({ round, when, items, c }: {
  round: InterviewRound; when?: string; items: { text: string; from: Scorecard }[]; c: Candidate;
}) {
  const owners = round.owners.map(teamById);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rim bg-primary-tint px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <h2 className="text-[14px] font-semibold">Brief for {owners.map((o) => o.name.split(" ")[0]).join(" and ")}</h2>
        </div>
        <span className="text-[12px] text-muted">{round.name} · {when ?? "Not scheduled yet"} · {round.minutes} min</span>
      </div>
      <div className="px-4 py-4 md:px-5">
        <p className="text-[12.5px] text-muted">This round is for: <span className="text-foreground">{round.focus}</span>.</p>
        {items.length ? (
          <>
            <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">Earlier rounds asked you to check</div>
            <ul className="mt-2 space-y-2">
              {items.map((it, i) => {
                const by = teamById(it.from.by);
                return (
                  <li key={i} className="flex items-start gap-2.5 text-[13px]">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="min-w-0 flex-1">
                      {it.text}
                      <span className="ml-1.5 text-[11.5px] text-faint">from {by.name.split(" ")[0]}, {it.from.roundId === "screen" ? "screening" : "round " + (ROUND_PLAN[c.roleId].findIndex((r) => r.id === it.from.roundId) + 1)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-[11.5px] text-faint">Compiled from your team's scorecards. Nothing here is added or rewritten.</p>
          </>
        ) : (
          <p className="mt-3 text-[13px] text-muted">No open questions from earlier rounds yet.</p>
        )}
      </div>
    </Card>
  );
}

function RoundCard({ n, round, card, c }: { n: number; round: InterviewRound; card?: Scorecard; c: Candidate }) {
  if (!card) {
    const by = teamById(round.owners[0]);
    return (
      <Card className="flex items-center gap-3 px-4 py-3 md:px-5">
        <Check className="size-4 text-success" />
        <div className="min-w-0 flex-1 text-[13px]">
          <span className="font-medium">Round {n} · {round.name}</span>
          <span className="text-muted"> passed with {by.name.split(" ")[0]}. No written scorecard.</span>
        </div>
        <span className="text-[12px] text-faint">Score {c.score}</span>
      </Card>
    );
  }
  const by = teamById(card.by);
  const rec = REC[card.recommendation];
  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Avatar initials={by.initials} hue={by.hue} size={30} />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">Round {n} · {round.name}</div>
          <div className="text-[12px] text-muted">{by.name}, {by.title} · {card.when}</div>
        </div>
        <span className="rounded-chip px-2 py-0.5 text-[12px] font-medium" style={{ color: rec.color, background: `color-mix(in oklch, ${rec.color} 12%, transparent)` }}>
          {rec.label}
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed">{card.summary}</p>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {SCORE_CRITERIA.map((k, i) => (
          <div key={k} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-muted">{k}</span>
            <span className="flex gap-1" aria-label={`${card.ratings[i]} of 4`}>
              {[1, 2, 3, 4].map((d) => (
                <span key={d} className={cx("h-1.5 w-4 rounded-full", d <= card.ratings[i] ? "bg-primary" : "bg-inset shadow-[inset_0_0_0_1px_var(--rim)]")} />
              ))}
            </span>
          </div>
        ))}
      </div>
      {card.probeNext.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[11.5px] text-faint">Next round, check:</span>
          {card.probeNext.map((p) => (
            <span key={p} className="rounded-chip bg-inset px-2 py-0.5 text-[11.5px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">{p}</span>
          ))}
        </div>
      )}
    </Card>
  );
}

function Verdict({ cards }: { cards: Scorecard[] }) {
  if (!cards.length) return null;
  const yes = cards.filter((s) => s.recommendation === "yes" || s.recommendation === "strong-yes").length;
  const avg = cards.reduce((a, s) => a + s.ratings.reduce((x, y) => x + y, 0) / 4, 0) / cards.length;
  return (
    <div className="mt-4 border-t border-rim pt-4">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] font-semibold">Team verdict so far</span>
        <span className="text-[12px] text-muted">{yes} of {cards.length} say hire · avg {avg.toFixed(1)} of 4</span>
      </div>
      <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
        {cards.map((s) => {
          const by = teamById(s.by);
          const rec = REC[s.recommendation];
          return (
            <li key={s.roundId} className="flex items-center gap-2 text-[12.5px]">
              <Avatar initials={by.initials} hue={by.hue} size={22} />
              <span className="min-w-0 flex-1 truncate">{by.name.split(" ")[0]} <span className="text-faint">· {by.title}</span></span>
              <span className="font-medium" style={{ color: rec.color }}>{rec.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

