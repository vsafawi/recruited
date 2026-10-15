import { useState } from "react";
import { Plus, Scale, Trash2 } from "lucide-react";
import { Button, cx, TierBadge } from "@/components/ui";
import { ROLES, SCORE_CRITERIA, TIER_COLOR, TIER_LABEL } from "@/data/mock";
import { inputBase, inputCls, Section, Segmented } from "./parts";

export interface Criterion { id: string; name: string; weight: number }
export type Rubrics = Record<string, Criterion[]>;
export interface Tiers { a: number; b: number }

/** Starting weights per role, over the four criteria every scorecard rates. */
const START: Record<string, number[]> = {
  "va-ops": [40, 15, 25, 20],
  "campaign-mgr": [30, 30, 20, 20],
  playlist: [30, 35, 20, 15],
};

export const INITIAL_RUBRICS: Rubrics = Object.fromEntries(
  ROLES.map((r) => [r.id, SCORE_CRITERIA.map((name, i) => ({ id: `${r.id}-${i}`, name, weight: (START[r.id] ?? [25, 25, 25, 25])[i] }))]),
);
export const INITIAL_TIERS: Tiers = { a: 84, b: 60 };

/** Scale weights so they sum to exactly 100, keeping their proportions. */
function balance(list: Criterion[]): Criterion[] {
  const sum = list.reduce((s, c) => s + c.weight, 0);
  if (!list.length) return list;
  if (sum === 0) return list.map((c, i) => ({ ...c, weight: Math.floor(100 / list.length) + (i < 100 % list.length ? 1 : 0) }));
  const raw = list.map((c) => (c.weight / sum) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((s, n) => s + n, 0);
  raw.map((r, i) => [r - Math.floor(r), i] as const).sort((x, y) => y[0] - x[0]).forEach(([, i]) => { if (left-- > 0) out[i]++; });
  return list.map((c, i) => ({ ...c, weight: out[i] }));
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? Math.round(n) : lo));

export default function Scorecards({ rubrics, tiers, onRubrics, onTiers }: { rubrics: Rubrics; tiers: Tiers; onRubrics: (v: Rubrics) => void; onTiers: (v: Tiers) => void }) {
  const [roleId, setRoleId] = useState(ROLES[0].id);
  const list = rubrics[roleId] ?? [];
  const total = list.reduce((s, c) => s + c.weight, 0);
  const ok = total === 100;
  const role = ROLES.find((r) => r.id === roleId)!;

  const setList = (next: Criterion[]) => onRubrics({ ...rubrics, [roleId]: next });
  const patch = (id: string, p: Partial<Criterion>) => setList(list.map((c) => (c.id === id ? { ...c, ...p } : c)));

  return (
    <Section
      title="Scorecards"
      description="The rubric every interviewer fills in for a role. Each criterion is rated 1 to 4; the weights turn those ratings into the 0 to 100 score that sets a candidate's tier."
    >
      <Segmented label="Role" value={roleId} onChange={setRoleId} options={ROLES.map((r) => ({ id: r.id, label: r.title }))} />

      <div className="rounded-panel bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rim px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-medium">{role.title}</div>
            <div className="text-[12px] text-muted">{role.team} · owned by {role.hiringManager}</div>
          </div>
          <div className={cx("tnum flex items-center gap-2 text-[13px] font-medium", ok ? "text-success" : "text-warning")} aria-live="polite">
            Total {total} / 100
            {!ok && <Button size="sm" onClick={() => setList(balance(list))}><Scale className="size-3.5" /> Balance to 100</Button>}
          </div>
        </div>

        <ul className="divide-y divide-[var(--rim)]">
          {list.map((c) => (
            <li key={c.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <input value={c.name} onChange={(e) => patch(c.id, { name: e.target.value })} className={inputCls} aria-label="Criterion name" />
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="range" min={0} max={100} step={5} value={c.weight}
                  onChange={(e) => patch(c.id, { weight: Number(e.target.value) })}
                  className="h-1.5 min-w-0 flex-1 accent-[var(--primary)]"
                  aria-label={`Weight for ${c.name}`}
                />
                <div className="relative w-18 shrink-0">
                  <input
                    type="number" min={0} max={100} value={c.weight}
                    onChange={(e) => patch(c.id, { weight: clamp(Number(e.target.value), 0, 100) })}
                    className={cx(inputCls, "tnum pr-6 text-right")}
                    aria-label={`Weight for ${c.name}, percent`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[12px] text-faint">%</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setList(list.filter((x) => x.id !== c.id))}
                disabled={list.length <= 1}
                aria-label={`Remove ${c.name}`}
                className="justify-self-end rounded-control p-1.5 text-faint hover:bg-[var(--wash)] hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        {/* The weights as one stacked bar, so an uneven rubric shows at a glance. */}
        <div className="border-t border-rim px-4 py-3">
          <div className="flex h-2 overflow-hidden rounded-full bg-inset">
            {list.map((c, i) => (
              <span key={c.id} title={`${c.name} ${c.weight}%`} className="h-full transition-[width] duration-300 ease-settle" style={{ width: `${(c.weight / Math.max(total, 100)) * 100}%`, background: `oklch(${0.5 + i * 0.07} 0.15 285)` }} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] text-muted">{ok ? "Weights add up to 100." : total > 100 ? `${total - 100} over. Lower a weight or balance.` : `${100 - total} left to assign.`}</span>
            <Button size="sm" variant="ghost" onClick={() => setList([...list, { id: `${roleId}-${Date.now()}`, name: "New criterion", weight: 0 }])}>
              <Plus className="size-3.5" /> Add criterion
            </Button>
          </div>
        </div>
      </div>

      <TierScale tiers={tiers} onChange={onTiers} />
    </Section>
  );
}

function TierScale({ tiers, onChange }: { tiers: Tiers; onChange: (v: Tiers) => void }) {
  const bands = [
    { tier: "C" as const, from: 0, to: tiers.b },
    { tier: "B" as const, from: tiers.b, to: tiers.a },
    { tier: "A" as const, from: tiers.a, to: 100 },
  ];
  return (
    <div className="rounded-panel bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-medium">Tier thresholds</div>
          <p className="text-[12.5px] text-muted">The same for every role, so A-tier means one thing on every split test.</p>
        </div>
        <div className="flex gap-3">
          {(["a", "b"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <TierBadge tier={k === "a" ? "A" : "B"} />
              <span className="whitespace-nowrap text-[12.5px] text-muted">at least</span>
              <input
                type="number"
                value={tiers[k]}
                min={k === "a" ? tiers.b + 1 : 1}
                max={k === "a" ? 100 : tiers.a - 1}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  onChange(k === "a" ? { ...tiers, a: clamp(n, tiers.b + 1, 100) } : { ...tiers, b: clamp(n, 1, tiers.a - 1) });
                }}
                className={cx(inputBase, "tnum w-16 text-right")}
                aria-label={`Tier ${k.toUpperCase()} minimum score`}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="relative flex h-3 overflow-hidden rounded-full">
          {bands.map((b) => (
            <span key={b.tier} className="h-full transition-[width] duration-300 ease-settle" style={{ width: `${b.to - b.from}%`, background: `color-mix(in oklch, ${TIER_COLOR[b.tier]} ${b.tier === "C" ? 35 : 70}%, transparent)` }} />
          ))}
        </div>
        <div className="tnum relative mt-1 h-4 text-[11px] text-faint">
          <span className="absolute left-0">0</span>
          {[tiers.b, tiers.a].map((n) => (
            <span key={n} className="absolute -translate-x-1/2 font-medium text-foreground transition-[left] duration-300 ease-settle" style={{ left: `${n}%` }}>{n}</span>
          ))}
          <span className="absolute right-0">100</span>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {[...bands].reverse().map((b) => (
            <li key={b.tier} className="flex items-start gap-2 rounded-card bg-inset px-3 py-2">
              <TierBadge tier={b.tier} />
              <div className="min-w-0">
                <div className="tnum text-[12.5px] font-medium">{b.tier === "A" ? `${b.from} to 100` : `${b.from} to ${b.to - 1}`}</div>
                <div className="text-[12px] text-muted">{TIER_LABEL[b.tier]}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-muted">Changing a threshold re-tiers candidates on their existing scores. Nobody is re-scored.</p>
      </div>
    </div>
  );
}
