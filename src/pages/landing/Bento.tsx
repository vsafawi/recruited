import { useState } from "react";
import { Check, CircleHelp, Lock, Sparkles } from "lucide-react";
import { Avatar, Capsule, Segmented, Tag, TierBadge } from "@/components/ui";
import {
  AI_SUMMARIES,
  BOARDS,
  CANDIDATES,
  LISTINGS,
  ROUND_PLAN,
  SCORECARDS,
  SCORE_CRITERIA,
  TIER_COLOR,
  TIER_LABEL,
  UPCOMING,
  boardById,
  candidateById,
  listingById,
  roleById,
  teamById,
  type Recommendation,
} from "@/data/mock";
import { BoardChip } from "./PipelineMock";

/* Small, live-looking mocks for the catalogue. Every value comes from mock.ts. */

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/* --- 02 Pipeline: inbox and rubric --------------------------------------- */

export function InboxMock() {
  const recent = [...CANDIDATES].sort((a, b) => a.appliedDaysAgo - b.appliedDaysAgo).slice(0, 6);
  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-card bg-background shadow-card">
      <div className="flex items-center gap-2 border-b border-rim px-3.5 py-2.5 text-[12px]">
        <span className="font-medium">Newest applicants</span>
        <span className="tnum rounded-[5px] bg-inset px-1.5 font-mono text-[11px] text-muted">{CANDIDATES.length}</span>
        <span className="ml-auto text-faint">All boards</span>
      </div>
      {recent.map((c, i) => {
        const b = boardById(listingById(c.listingId).board);
        return (
          <div
            key={c.id}
            className="fade-in flex items-center gap-2.5 border-b border-rim px-3.5 py-2 last:border-b-0"
            style={{ ["--d" as string]: `${150 + i * 70}ms` }}
          >
            <span className="tnum w-4 font-mono text-[11px] text-faint">{i + 1}</span>
            <Avatar initials={c.initials} hue={c.hue} size={22} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium">{c.name}</div>
              <div className="truncate text-[11px] text-faint">via {b.name}</div>
            </div>
            <BoardChip id={c.listingId} className="hidden sm:inline-flex" />
            <TierBadge tier={c.tier} />
            <span className="tnum w-7 text-right font-mono text-[11px] text-faint">{c.appliedDaysAgo ? `${c.appliedDaysAgo}d` : "now"}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RubricMock() {
  return (
    <div className="w-full max-w-[460px] space-y-2">
      {(["A", "B", "C"] as const).map((t, i) => {
        const n = CANDIDATES.filter((c) => c.tier === t).length;
        return (
          <div
            key={t}
            className="fade-in flex items-center gap-3 rounded-card bg-background px-3.5 py-3 shadow-card"
            style={{ ["--d" as string]: `${150 + i * 90}ms` }}
          >
            <TierBadge tier={t} />
            <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-muted">{cap(TIER_LABEL[t].split(" — ")[1])}</span>
            <span className="tnum font-mono text-[12.5px] font-medium" style={{ color: TIER_COLOR[t] }}>
              {n}
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-center text-[12px] text-faint">Scored against the role’s rubric the moment they apply, whichever board they came from.</p>
    </div>
  );
}

/* --- 01 Split tests: board ROI ------------------------------------------- */

export function RoiMock() {
  const rows = BOARDS.map((b) => {
    const ls = LISTINGS.filter((l) => l.board === b.id);
    const aTier = ls.reduce((s, l) => s + (l.applies * l.tierMix.A) / 100, 0);
    const spend = ls.reduce((s, l) => s + l.spend, 0);
    return { b, per100: (aTier / spend) * 100, spend, n: ls.length };
  }).sort((x, y) => y.per100 - x.per100);
  const max = rows[0].per100;
  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-3 flex justify-between text-[11.5px] text-faint">
        <span>Board · spend</span>
        <span>A-tier per $100</span>
      </div>
      <div className="space-y-3">
        {rows.map(({ b, per100, spend, n }, i) => (
          <div key={b.id} className="grid grid-cols-[minmax(0,120px)_1fr_36px] items-center gap-3 sm:grid-cols-[180px_1fr_40px]">
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium">{b.name}</div>
              <div className="tnum text-[11px] text-faint">
                ${spend} · {n} listing{n > 1 ? "s" : ""}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-inset">
              <div
                className="grow-x h-full rounded-full"
                style={{ width: `${(per100 / max) * 100}%`, background: b.color, ["--d" as string]: `${150 + i * 90}ms` }}
              />
            </div>
            <span className="tnum text-right font-mono text-[12px] font-medium">{per100.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- 03 Interview loop --------------------------------------------------- */

const REC: Record<Recommendation, { label: string; color: string }> = {
  "strong-yes": { label: "Strong yes", color: "var(--success)" },
  yes: { label: "Yes", color: "var(--success)" },
  no: { label: "No", color: "var(--destructive)" },
  "strong-no": { label: "Strong no", color: "var(--destructive)" },
};

const LOOP_ID = "c2";

export function InterviewLoopMock() {
  const [view, setView] = useState<"rounds" | "scores" | "summary">("rounds");
  const c = candidateById(LOOP_ID)!;
  const rounds = ROUND_PLAN[c.roleId];
  const cards = SCORECARDS.filter((s) => s.candidateId === c.id);
  const next = UPCOMING.find((u) => u.candidateId === c.id);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-[540px]">
        <div className="mb-3 flex items-center gap-2.5">
          <Avatar initials={c.initials} hue={c.hue} size={26} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{c.name}</div>
            <div className="truncate text-[11.5px] text-muted">
              {roleById(c.roleId).title} · {cards.length} of {rounds.length} rounds
            </div>
          </div>
          <TierBadge tier={c.tier} />
        </div>

        <div key={view} className="panel-in">
          {view === "rounds" && (
            <div className="space-y-1.5">
              {rounds.map((r, i) => {
                const card = cards.find((s) => s.roundId === r.id);
                const upcoming = next?.roundId === r.id;
                const who = r.owners.map((o) => teamById(o).name.split(" ")[0]).join(", ");
                return (
                  <Capsule
                    key={r.id}
                    state={card ? "done" : upcoming ? "active" : "todo"}
                    n={i + 1}
                    title={r.name}
                    meta={card ? `${who} · ${card.when}` : upcoming ? `${who} · ${next!.when}` : who}
                    trailing={
                      card ? (
                        <Tag color={REC[card.recommendation].color}>{REC[card.recommendation].label}</Tag>
                      ) : upcoming ? (
                        <Tag color="var(--primary)">Next</Tag>
                      ) : (
                        <Tag>To do</Tag>
                      )
                    }
                  />
                );
              })}
            </div>
          )}

          {view === "scores" && (
            <div className="overflow-hidden rounded-card bg-background shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,52px)] items-center gap-2 border-b border-rim px-3.5 py-2 text-[11px] text-faint sm:grid-cols-[minmax(0,1fr)_repeat(3,72px)]">
                <span>Criterion</span>
                {cards.map((s, i) => (
                  <span key={s.roundId} className="truncate text-center" title={rounds.find((r) => r.id === s.roundId)?.name}>
                    R{i + 1} · {teamById(s.by).name.split(" ")[0]}
                  </span>
                ))}
              </div>
              {SCORE_CRITERIA.map((k, ki) => (
                <div
                  key={k}
                  className="grid grid-cols-[minmax(0,1fr)_repeat(3,52px)] items-center gap-2 border-b border-rim px-3.5 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_repeat(3,72px)]"
                >
                  <span className="truncate text-[12.5px]">{k}</span>
                  {cards.map((s) => (
                    <span key={s.roundId} className="flex justify-center gap-[3px]" aria-label={`${s.ratings[ki]} of 4`}>
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className="size-[7px] rounded-full"
                          style={{
                            background: n <= s.ratings[ki] ? "var(--primary)" : "transparent",
                            boxShadow: n <= s.ratings[ki] ? undefined : "inset 0 0 0 1px var(--rim-strong)",
                          }}
                        />
                      ))}
                    </span>
                  ))}
                </div>
              ))}
              <div className="border-t border-rim px-3.5 py-2 text-[11.5px] text-faint">
                {cards.length} scorecards · rated 1 to 4 on the same criteria
              </div>
            </div>
          )}

          {view === "summary" && (
            <div className="rounded-card bg-background p-3.5 shadow-card">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <Sparkles className="size-3.5 text-faint" />
                Read {cards.length} scorecards
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-faint">
                  <Lock className="size-3" /> Drawn only from what the candidate sent and what the team wrote
                </span>
              </div>
              <ul className="mt-3 space-y-2.5 border-l border-rim-strong pl-3.5">
                {AI_SUMMARIES[c.id].map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
                    {l.kind === "question" ? (
                      <CircleHelp className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    ) : l.kind === "strength" ? (
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                    ) : (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <span className="min-w-0 flex-1">
                      {l.text}{" "}
                      <span className="rounded-[5px] bg-inset px-1 py-px font-mono text-[10.5px] whitespace-nowrap text-faint">{l.source}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: "rounds", label: "Rounds", count: rounds.length },
          { id: "scores", label: "Scorecards", count: cards.length },
          { id: "summary", label: "Summary" },
        ]}
      />
    </div>
  );
}

/* --- 04 Apply page ------------------------------------------------------- */

export function ApplyMock() {
  const [v, setV] = useState<"l1" | "l2">("l2");
  const l = listingById(v);
  const role = roleById(l.roleId);
  const board = boardById(l.board);
  const src = `/jobs/${l.id}?src=${board.id}&v=${l.variant}`;
  const fields = ["Full name", "Email", "Portfolio or LinkedIn", "Tools you use every day"];
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div key={v} className="panel-in grid w-full max-w-[640px] gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0 overflow-hidden rounded-card bg-background shadow-card">
          <div className="flex items-center gap-2 border-b border-rim px-3 py-2">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 rounded-full bg-rim-strong" />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate rounded-[6px] bg-inset px-2 py-0.5 font-mono text-[10.5px] text-muted">
              recruited.tools{src}
            </span>
          </div>
          <div className="p-4">
            <div className="text-[11.5px] text-faint">Music Market Agency · {role.team}</div>
            <div className="mt-1 text-[14px] leading-snug font-semibold tracking-[-0.01em] text-pretty">{l.headline}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tag color="var(--foreground)">{l.payBand}</Tag>
              <Tag>{role.location}</Tag>
            </div>
            <div className="mt-4 space-y-2">
              {fields.map((f) => (
                <div key={f}>
                  <div className="mb-1 text-[11px] text-muted">{f}</div>
                  <div className="h-7 rounded-[7px] bg-card shadow-[inset_0_0_0_1px_var(--rim)]" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-8 items-center justify-center rounded-control bg-primary text-[12.5px] font-medium text-on-primary">
              Send application
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-card bg-background p-3.5 shadow-card">
          <div className="text-[11.5px] text-faint">Arrives in the tracker as</div>
          <dl className="mt-3 space-y-2.5 text-[12px]">
            <div>
              <dt className="text-faint">Board</dt>
              <dd className="mt-0.5">
                <Tag color={board.color}>{board.name}</Tag>
              </dd>
            </div>
            <div>
              <dt className="text-faint">Variant</dt>
              <dd className="mt-0.5 font-medium">
                {l.variant} · {l.hypothesis}
              </dd>
            </div>
            <div>
              <dt className="text-faint">Scored</dt>
              <dd className="mt-0.5">Against the {role.title} rubric</dd>
            </div>
            <div>
              <dt className="text-faint">Stage</dt>
              <dd className="mt-0.5">New</dd>
            </div>
          </dl>
        </div>
      </div>
      <Segmented
        value={v}
        onChange={setV}
        options={[
          { id: "l1", label: "Variant A" },
          { id: "l2", label: "Variant B" },
        ]}
      />
    </div>
  );
}

