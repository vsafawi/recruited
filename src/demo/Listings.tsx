import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown, ArrowUp, Check, ChevronDown, Copy, FlaskConical, Pause, Plus, Rows3, Sparkles, Trophy,
} from "lucide-react";
import { PageHeader } from "./Shell";
import { Button, ButtonLink, Card, cx, Sparkline, TierBar } from "@/components/ui";
import {
  aTierPerDollar, boardById, BOARDS, costPerQualified, LISTINGS, ROLES, TIER_COLOR,
  type BoardId, type Listing,
} from "@/data/mock";

/* ---------------------------------------------------------------------------
   Listings & split tests. Every number on this page is derived from LISTINGS;
   the only thing that isn't is the confidence figure, which says so.
   --------------------------------------------------------------------------- */

type Status = Listing["status"];

/** Illustrative, fixed per experiment. Labelled as such in the UI. */
const CONFIDENCE: Record<string, number> = { "va-ops": 94, "campaign-mgr": 81, playlist: 88 };

const money = (n: number, dp = 0) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const int = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;
const aCount = (l: Listing) => (l.applies * l.tierMix.A) / 100;
const applyRate = (l: Listing) => (l.views ? (l.applies / l.views) * 100 : 0);
const costPerA = (l: Listing) => (aCount(l) ? l.spend / aCount(l) : Infinity);

/* ------------------------------------------------------------------ toasts */

type Toast = { id: number; text: string };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  };
  const node = (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 500, damping: 38 }}
            className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-card bg-foreground px-3.5 py-2.5 text-[13px] text-background shadow-overlay"
            role="status"
          >
            <Check className="size-4 shrink-0 text-[oklch(0.8_0.13_152)]" />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  return [node, push] as const;
}

/* ------------------------------------------------------------------- bits */

function BoardDot({ id, className }: { id: BoardId; className?: string }) {
  return <span className={cx("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: boardById(id).color }} />;
}

function VariantTile({ v, active }: { v: "A" | "B"; active?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-[7px] font-mono text-[12px] font-semibold",
        active ? "bg-primary text-on-primary" : "bg-inset text-muted shadow-[inset_0_0_0_1px_var(--rim)]",
      )}
    >
      {v}
    </span>
  );
}

const STATUS_STYLE: Record<Status, { label: string; color: string }> = {
  live: { label: "Live", color: "var(--success)" },
  paused: { label: "Paused", color: "var(--muted)" },
  winner: { label: "Winner", color: "var(--primary)" },
};

function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-chip px-1.5 py-0.5 text-[11.5px] font-medium"
      style={{ color: s.color, background: `color-mix(in oklch, ${s.color} 11%, transparent)` }}
    >
      {status === "live" ? (
        <span className="size-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 0 2.5px color-mix(in oklch, ${s.color} 22%, transparent)` }} />
      ) : status === "winner" ? (
        <Trophy className="size-3" />
      ) : (
        <Pause className="size-3" />
      )}
      {s.label}
    </span>
  );
}

function TierLegend({ mix }: { mix: Listing["tierMix"] }) {
  return (
    <div className="mt-2 flex items-center gap-3 text-[11.5px] text-muted">
      {(["A", "B", "C"] as const).map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full" style={{ background: TIER_COLOR[t] }} />
          <span className="font-mono text-[10.5px]">{t}</span>
          <span className="tnum text-foreground">{mix[t]}%</span>
        </span>
      ))}
    </div>
  );
}

function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon: typeof Rows3 }[] }) {
  return (
    <div className="inline-flex rounded-control bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)]" role="tablist">
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={cx(
            "relative inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-medium transition-colors",
            value === v ? "text-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {value === v && (
            <motion.span layoutId="seg" className="absolute inset-0 rounded-[6px] bg-card shadow-card" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
          )}
          <Icon className="relative size-3.5" />
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- variant */

function VariantCard({ l, status, leading }: { l: Listing; status: Status; leading: boolean }) {
  const b = boardById(l.board);
  const paused = status === "paused";
  return (
    <div
      className={cx(
        "relative flex min-w-0 flex-col rounded-card bg-card p-4 transition-[opacity,box-shadow] duration-300",
        leading ? "shadow-[0_0_0_1.5px_var(--primary),0_4px_14px_color-mix(in_oklch,var(--primary)_14%,transparent)]" : "shadow-card",
        paused && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <VariantTile v={l.variant} active={leading} />
        <div className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted">
          <BoardDot id={l.board} />
          <span className="truncate">{b.name}</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {leading && (
            <span className="hidden rounded-chip bg-primary-tint px-1.5 py-0.5 text-[11px] font-medium text-primary sm:inline">Leading</span>
          )}
          <StatusPill status={status} />
        </div>
      </div>

      <h4 className="mt-3 text-[14px] leading-snug font-medium tracking-[-0.01em] text-balance">{l.headline}</h4>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
        <span>
          Testing: <span className="text-foreground">{l.hypothesis}</span>
        </span>
        <span className="text-faint">·</span>
        <span>
          Pay <span className="tnum text-foreground">{l.payBand}</span>
        </span>
        <span className="text-faint">·</span>
        <span className="tnum">{l.daysLive} days live</span>
      </div>

      {/* views -> applies -> qualified */}
      <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-control bg-inset text-center shadow-[inset_0_0_0_1px_var(--rim)]">
        {[
          ["Views", l.views],
          ["Applies", l.applies],
          ["Qualified", l.qualified],
        ].map(([k, v], i) => (
          <div key={k} className={cx("relative px-2 py-2", i > 0 && "border-l border-rim")}>
            <div className="tnum text-[15px] font-semibold tracking-[-0.01em]">{int(v as number)}</div>
            <div className="text-[11px] text-muted">{k}</div>
          </div>
        ))}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
        <Metric label="Apply rate" value={pct(applyRate(l))} />
        <Metric label="Cost / qualified" value={money(costPerQualified(l), 2)} />
        <Metric label="A-tier per $" value={aTierPerDollar(l).toFixed(2)} hint={`1 per ${money(costPerA(l), 2)}`} strong={leading} />
      </dl>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-[11.5px] text-muted">
          <span>Tier mix of applicants</span>
          <span className="tnum">{int(aCount(l))} A-tier</span>
        </div>
        <TierBar mix={l.tierMix} className="mt-1.5 h-2" />
        <TierLegend mix={l.tierMix} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-rim pt-3">
        <div className="text-[11.5px] text-muted">
          Applies per day
          <div className="text-faint">Last 14 days</div>
        </div>
        <Sparkline data={l.trend} width={120} height={30} color={leading ? "var(--primary)" : "var(--muted)"} />
      </div>
    </div>
  );
}

function Metric({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-muted">{label}</dt>
      <dd className={cx("tnum text-[14px] font-semibold tracking-[-0.01em]", strong && "text-primary")}>{value}</dd>
      {hint && <div className="tnum truncate text-[11px] text-faint">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ experiment */

function armName(l: Listing, arms: Listing[]) {
  const oneBoard = arms.every((a) => a.board === l.board);
  return oneBoard ? `Variant ${l.variant}` : `${boardById(l.board).name} · ${l.variant}`;
}

function Experiment({
  roleId, statuses, setStatuses, toast,
}: {
  roleId: string;
  statuses: Record<string, Status>;
  setStatuses: React.Dispatch<React.SetStateAction<Record<string, Status>>>;
  toast: (t: string) => void;
}) {
  const role = ROLES.find((r) => r.id === roleId)!;
  const arms = LISTINGS.filter((l) => l.roleId === roleId).sort((a, b) => a.variant.localeCompare(b.variant) || a.id.localeCompare(b.id));
  const ranked = [...arms].sort((a, b) => aTierPerDollar(b) - aTierPerDollar(a));
  const leader = ranked[0];
  const runner = ranked[1];
  const multiple = aTierPerDollar(leader) / aTierPerDollar(runner);
  const confidence = CONFIDENCE[roleId] ?? 80;
  const losers = arms.filter((a) => a.id !== leader.id);
  const st = (l: Listing) => statuses[l.id] ?? l.status;
  const declared = st(leader) === "winner";
  const losersPaused = losers.every((l) => st(l) === "paused");
  const spend = arms.reduce((a, l) => a + l.spend, 0);
  const [clones, setClones] = useState<BoardId[]>([]);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const cloneTargets = BOARDS.filter((b) => b.id !== leader.board && !clones.includes(b.id));

  const leaderName = armName(leader, arms);
  const runnerName = armName(runner, arms);

  return (
    <section className="scroll-mt-6" id={`exp-${roleId}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{role.title}</h3>
          <span className="text-[12.5px] text-muted">
            {arms.length} arms · {role.location}
          </span>
        </div>
        <div className="tnum text-[12.5px] text-muted">
          {money(spend)} spent · {role.target}
        </div>
      </div>

      {/* Verdict */}
      <div className="mt-3 overflow-hidden rounded-panel bg-card shadow-card">
        <div className="relative flex flex-col gap-4 p-4 md:flex-row md:items-center md:p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1"
            style={{ background: declared ? "var(--primary)" : "linear-gradient(var(--primary), color-mix(in oklch, var(--primary) 30%, transparent))" }}
          />
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-control bg-primary-tint text-primary">
              {declared ? <Trophy className="size-4" /> : <FlaskConical className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-[14.5px] leading-snug font-medium tracking-[-0.01em] text-balance">
                {leaderName} brings <span className="tnum text-primary">{multiple.toFixed(1)}×</span> more A-tier candidates per dollar
                {arms.length > 2 ? ` than ${runnerName}, the next best arm.` : "."}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted">
                <span className="inline-flex items-center gap-2">
                  Confidence: <span className="tnum font-medium text-foreground">{confidence}%</span>
                  <span className="relative h-1 w-16 overflow-hidden rounded-full bg-inset">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${confidence}%` }} />
                  </span>
                  <span className="text-faint">(illustrative figure)</span>
                </span>
                <span className="tnum">
                  {aTierPerDollar(leader).toFixed(2)} vs {aTierPerDollar(runner).toFixed(2)} A-tier per $
                </span>
                {clones.length > 0 && (
                  <span className="inline-flex flex-wrap items-center gap-1">
                    {clones.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 rounded-chip bg-inset px-1.5 py-0.5 text-[11px] text-foreground shadow-[inset_0_0_0_1px_var(--rim)]">
                        <BoardDot id={c} className="size-1.5" /> Draft on {boardById(c).name}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
            <Button
              size="sm"
              variant={declared ? "secondary" : "primary"}
              disabled={declared}
              onClick={() => {
                setStatuses((s) => {
                  const next = { ...s, [leader.id]: "winner" as Status };
                  for (const l of losers) if ((s[l.id] ?? l.status) === "winner") next[l.id] = "live";
                  return next;
                });
                toast(`${leaderName} is the winner for ${role.title}.`);
              }}
            >
              {declared ? <Check className="size-3.5" /> : <Trophy className="size-3.5" />}
              {declared ? "Winner declared" : "Declare winner"}
            </Button>
            <Button
              size="sm"
              disabled={losersPaused}
              onClick={() => {
                setStatuses((s) => {
                  const next = { ...s };
                  for (const l of losers) next[l.id] = "paused";
                  return next;
                });
                toast(
                  losers.length === 1
                    ? `Paused ${armName(losers[0], arms)}. It stops spending today.`
                    : `Paused ${losers.length} arms. They stop spending today.`,
                );
              }}
            >
              <Pause className="size-3.5" />
              {losersPaused ? (losers.length > 1 ? "Losers paused" : "Loser paused") : losers.length > 1 ? "Pause losers" : "Pause loser"}
            </Button>
            <div className="relative" ref={menuRef}>
              <Button size="sm" onClick={() => setMenu((m) => !m)} disabled={!cloneTargets.length} aria-expanded={menu} aria-haspopup="menu">
                <Copy className="size-3.5" /> Clone winner <ChevronDown className="size-3.5 text-faint" />
              </Button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                    role="menu"
                    className="absolute right-0 z-30 mt-1.5 w-64 origin-top-right rounded-card bg-card p-1 shadow-overlay max-md:left-0 max-md:right-auto max-md:origin-top-left"
                  >
                    <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[0.04em] text-faint uppercase">Clone to another board</div>
                    {cloneTargets.map((b) => (
                      <button
                        key={b.id}
                        role="menuitem"
                        onClick={() => {
                          setClones((c) => [...c, b.id]);
                          setMenu(false);
                          toast(`Cloned ${leaderName} to ${b.name} as a draft. It goes live when you publish it.`);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left text-[13px] hover:bg-inset"
                      >
                        <BoardDot id={b.id} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{b.name}</span>
                          <span className="block truncate text-[11.5px] text-muted">{b.audience}</span>
                        </span>
                        <span className="tnum text-[12px] text-muted">{money(b.costPerMonth)}/mo</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className={cx("mt-3 grid gap-3", arms.length > 2 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2")}>
        {arms.map((l) => (
          <VariantCard key={l.id} l={l} status={st(l)} leading={l.id === leader.id} />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- all listings */

type SortKey = "views" | "applies" | "rate" | "qualified" | "aShare" | "cpq" | "apd" | "spend";

const COLS: { key: SortKey; label: string; get: (l: Listing) => number; fmt: (n: number) => string; better: "high" | "low" | "none" }[] = [
  { key: "views", label: "Views", get: (l) => l.views, fmt: int, better: "high" },
  { key: "applies", label: "Applies", get: (l) => l.applies, fmt: int, better: "high" },
  { key: "rate", label: "Apply rate", get: applyRate, fmt: (n) => pct(n), better: "high" },
  { key: "qualified", label: "Qualified", get: (l) => l.qualified, fmt: int, better: "high" },
  { key: "aShare", label: "A-tier", get: (l) => l.tierMix.A, fmt: (n) => `${n}%`, better: "high" },
  { key: "spend", label: "Spend", get: (l) => l.spend, fmt: (n) => money(n), better: "none" },
  { key: "cpq", label: "Cost / qual.", get: costPerQualified, fmt: (n) => money(n, 2), better: "low" },
  { key: "apd", label: "A-tier per $", get: aTierPerDollar, fmt: (n) => n.toFixed(2), better: "high" },
];

function AllListings({ statuses }: { statuses: Record<string, Status> }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "apd", dir: -1 });
  const col = COLS.find((c) => c.key === sort.key)!;
  const rows = [...LISTINGS].sort((a, b) => (col.get(a) - col.get(b)) * sort.dir);
  const best = Object.fromEntries(
    COLS.map((c) => {
      const vals = LISTINGS.map(c.get);
      return [c.key, c.better === "high" ? Math.max(...vals) : Math.min(...vals)];
    }),
  ) as Record<SortKey, number>;

  return (
    <Card className="overflow-hidden">
      <div className="scroll-quiet overflow-x-auto">
        <table className="w-full min-w-[980px] text-[12.5px]">
          <thead>
            <tr className="border-b border-rim text-left text-[11.5px] text-muted">
              <th className="py-2.5 pr-3 pl-4 font-medium">Listing</th>
              <th className="px-3 font-medium">Status</th>
              {COLS.map((c) => (
                <th key={c.key} className="px-3 text-right font-medium">
                  <button
                    className={cx("inline-flex items-center gap-1 hover:text-foreground", sort.key === c.key && "text-foreground")}
                    onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : c.better === "high" ? -1 : 1 }))}
                  >
                    {c.label}
                    {sort.key === c.key && (sort.dir === -1 ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
                  </button>
                </th>
              ))}
              <th className="px-4 text-right font-medium">14 days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const role = ROLES.find((r) => r.id === l.roleId)!;
              return (
                <tr key={l.id} className="border-b border-rim last:border-0 hover:bg-[var(--wash)]">
                  <td className="py-2.5 pr-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      <VariantTile v={l.variant} />
                      <div className="min-w-0 max-w-[300px]">
                        <div className="truncate font-medium" title={l.headline}>{l.headline}</div>
                        <div className="flex items-center gap-1.5 truncate text-[11.5px] text-muted">
                          <BoardDot id={l.board} className="size-1.5" /> {boardById(l.board).name} · {role.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3"><StatusPill status={statuses[l.id] ?? l.status} /></td>
                  {COLS.map((c) => {
                    const v = c.get(l);
                    return (
                      <td key={c.key} className={cx("tnum px-3 text-right", c.better !== "none" && v === best[c.key] ? "font-semibold text-primary" : "text-foreground")}>
                        {c.fmt(v)}
                      </td>
                    );
                  })}
                  <td className="px-4">
                    <div className="flex justify-end"><Sparkline data={l.trend} width={72} height={22} color="var(--muted)" /></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-rim px-4 py-2.5 text-[11.5px] text-muted">
        The best value in each column is highlighted. Click a column to sort.
      </div>
    </Card>
  );
}

/* --------------------------------------------------------- board matrix */

function boardStats() {
  return BOARDS.map((b) => {
    const ls = LISTINGS.filter((l) => l.board === b.id);
    const spend = ls.reduce((a, l) => a + l.spend, 0);
    const views = ls.reduce((a, l) => a + l.views, 0);
    const applies = ls.reduce((a, l) => a + l.applies, 0);
    const qualified = ls.reduce((a, l) => a + l.qualified, 0);
    const a = ls.reduce((s, l) => s + aCount(l), 0);
    return {
      board: b,
      listings: ls.length,
      spend,
      applies,
      rate: views ? (applies / views) * 100 : 0,
      qualified,
      a,
      aShare: applies ? (a / applies) * 100 : 0,
      cpq: qualified ? spend / qualified : 0,
      cpa: a ? spend / a : 0,
      apd: spend ? a / spend : 0,
    };
  });
}

type BoardRow = ReturnType<typeof boardStats>[number];

const BCOLS: { key: keyof BoardRow; label: string; fmt: (n: number) => string; better?: "high" | "low" }[] = [
  { key: "listings", label: "Listings", fmt: int },
  { key: "spend", label: "Spend", fmt: (n) => money(n) },
  { key: "applies", label: "Applies", fmt: int, better: "high" },
  { key: "rate", label: "Apply rate", fmt: (n) => pct(n), better: "high" },
  { key: "qualified", label: "Qualified", fmt: int, better: "high" },
  { key: "aShare", label: "A-tier share", fmt: (n) => pct(n, 0), better: "high" },
  { key: "cpq", label: "Cost / qual.", fmt: (n) => money(n, 2), better: "low" },
  { key: "cpa", label: "Cost / A-tier", fmt: (n) => money(n, 2), better: "low" },
  { key: "apd", label: "A-tier per $", fmt: (n) => n.toFixed(2), better: "high" },
];

function BoardMatrix() {
  const rows = useMemo(boardStats, []);
  const best: Partial<Record<keyof BoardRow, number>> = {};
  for (const c of BCOLS) {
    if (!c.better) continue;
    const vals = rows.map((r) => r[c.key] as number);
    best[c.key] = c.better === "high" ? Math.max(...vals) : Math.min(...vals);
  }
  const maxApd = Math.max(...rows.map((r) => r.apd));
  return (
    <Card className="overflow-hidden">
      <div className="scroll-quiet overflow-x-auto">
        <table className="w-full min-w-[860px] text-[12.5px]">
          <thead>
            <tr className="border-b border-rim text-left text-[11.5px] text-muted">
              <th className="py-2.5 pr-3 pl-4 font-medium">Board</th>
              {BCOLS.map((c) => (
                <th key={c.key} className="px-3 text-right font-medium whitespace-nowrap">{c.label}</th>
              ))}
              <th className="w-36 px-4 font-medium">Relative return</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.board.id} className="border-b border-rim last:border-0">
                <td className="py-3 pr-3 pl-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] font-mono text-[10px] font-semibold text-white"
                      style={{ background: r.board.color }}
                    >
                      {r.board.short}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium whitespace-nowrap">{r.board.name}</div>
                      <div className="tnum text-[11.5px] text-muted">{money(r.board.costPerMonth)} / mo</div>
                    </div>
                  </div>
                </td>
                {BCOLS.map((c) => {
                  const v = r[c.key] as number;
                  const isBest = c.better && v === best[c.key];
                  return (
                    <td key={c.key} className={cx("tnum px-3 text-right", isBest ? "font-semibold text-primary" : "")}>
                      {c.fmt(v)}
                    </td>
                  );
                })}
                <td className="px-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-inset">
                    <div className="h-full rounded-full" style={{ width: `${(r.apd / maxApd) * 100}%`, background: r.board.color }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** A plain-language reading of the matrix, built from the same numbers. */
function BoardReadout() {
  const rows = boardStats();
  const byCpa = [...rows].sort((a, b) => a.cpa - b.cpa);
  const cheap = byCpa.slice(0, 2);
  const volume = [...rows].sort((a, b) => b.applies - a.applies)[0];
  const share = [...rows].sort((a, b) => b.aShare - a.aShare)[0];
  return (
    <div className="flex items-start gap-2.5 rounded-card bg-primary-tint/60 px-4 py-3 text-[12.5px] text-foreground">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        {cheap[0].board.name} and {cheap[1].board.name} buy A-tier applicants for {money(cheap[0].cpa, 2)} and{" "}
        {money(cheap[1].cpa, 2)} each. {volume.board.name} brings the most applies, {int(volume.applies)}, but only{" "}
        {pct(volume.aShare, 0)} are A-tier, so each one costs {money(volume.cpa, 2)}. {share.board.name} has the highest A-tier
        share at {pct(share.aShare, 0)}, at {money(share.cpq, 2)} per qualified candidate. Worked out from the table above.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- scatter */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Scatter() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const narrow = width < 520;
  const H = narrow ? 260 : 320;
  const pad = { l: 44, r: 16, t: 16, b: 36 };
  const xMax = 14;
  const yMax = 40;
  const iw = Math.max(width - pad.l - pad.r, 10);
  const ih = H - pad.t - pad.b;
  const x = (v: number) => pad.l + (Math.min(v, xMax) / xMax) * iw;
  const y = (v: number) => pad.t + ih - (v / yMax) * ih;
  const maxApplies = Math.max(...LISTINGS.map((l) => l.applies));
  const r = (a: number) => (narrow ? 5 : 7) + Math.sqrt(a / maxApplies) * (narrow ? 13 : 20);
  const pts = LISTINGS.map((l) => ({ l, cx: x(costPerQualified(l)), cy: y(l.tierMix.A), r: r(l.applies) })).sort((a, b) => b.r - a.r);
  const h = pts.find((p) => p.l.id === hover);

  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-[-0.01em]">Where each listing lands</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Cost per qualified candidate against A-tier share. Bubble size is applies. You want up and to the left.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted">
          {BOARDS.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1.5"><BoardDot id={b.id} /> {b.name}</span>
          ))}
        </div>
      </div>

      <div ref={ref} className="relative mt-4 w-full select-none">
        <svg width={width} height={H} className="block overflow-visible" role="img" aria-label="Scatter plot of listings by cost per qualified candidate and A-tier share">
          {/* sweet spot */}
          <rect x={pad.l} y={pad.t} width={x(4) - pad.l} height={y(15) - pad.t} rx={6} fill="var(--primary)" opacity={0.05} />
          <text x={pad.l + 8} y={pad.t + 16} fontSize={10.5} fill="var(--primary)" opacity={0.8} fontWeight={500}>
            Cheap and strong
          </text>
          {[0, 10, 20, 30, 40].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke="var(--grid-line)" />
              <text x={pad.l - 8} y={y(t) + 3.5} fontSize={10.5} textAnchor="end" fill="var(--faint)" className="tnum">{t}%</text>
            </g>
          ))}
          {[0, 2, 4, 6, 8, 10, 12, 14].filter((t) => !narrow || t % 4 === 0 || t === 14).map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={pad.t} y2={pad.t + ih} stroke="var(--grid-line)" />
              <text x={x(t)} y={pad.t + ih + 16} fontSize={10.5} textAnchor="middle" fill="var(--faint)" className="tnum">${t}</text>
            </g>
          ))}
          <text x={pad.l + iw} y={H - 2} fontSize={10.5} textAnchor="end" fill="var(--muted)">Cost per qualified →</text>
          <text transform={`translate(10 ${pad.t + ih / 2}) rotate(-90)`} fontSize={10.5} textAnchor="middle" fill="var(--muted)">A-tier share →</text>

          {pts.map(({ l, cx, cy, r: rr }) => {
            const col = boardById(l.board).color;
            const dim = hover && hover !== l.id;
            return (
              <g
                key={l.id}
                onMouseEnter={() => setHover(l.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setHover((h) => (h === l.id ? null : l.id))}
                className="cursor-pointer"
                style={{ transition: "opacity 160ms", opacity: dim ? 0.35 : 1 }}
              >
                <circle cx={cx} cy={cy} r={rr} fill={col} fillOpacity={0.18} stroke={col} strokeWidth={hover === l.id ? 2 : 1.25} />
                <text x={cx} y={cy + 3.5} fontSize={10} textAnchor="middle" fill={col} fontWeight={600} className="pointer-events-none font-mono">
                  {boardById(l.board).short}·{l.variant}
                </text>
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {h && (
            <motion.div
              key={h.l.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              transition={{ duration: 0.14 }}
              className="pointer-events-none absolute z-10 w-60 rounded-card bg-card p-3 text-[12px] shadow-overlay"
              style={{
                left: Math.min(Math.max(h.cx - 120, 0), width - 240),
                top: h.cy - h.r - 10,
                transform: "translateY(-100%)",
              }}
            >
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <BoardDot id={h.l.board} /> {boardById(h.l.board).name} · Variant {h.l.variant}
              </div>
              <div className="mt-1 line-clamp-2 font-medium leading-snug">{h.l.headline}</div>
              <div className="tnum mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-muted">Cost / qualified</span><span className="text-right">{money(costPerQualified(h.l), 2)}</span>
                <span className="text-muted">A-tier share</span><span className="text-right">{h.l.tierMix.A}%</span>
                <span className="text-muted">Applies</span><span className="text-right">{int(h.l.applies)}</span>
                <span className="text-muted">A-tier per $</span><span className="text-right font-medium text-primary">{aTierPerDollar(h.l).toFixed(2)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- page */

export default function Listings() {
  const [view, setView] = useState<"experiments" | "all">("experiments");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [toastNode, toast] = useToasts();

  const spend = LISTINGS.reduce((a, l) => a + l.spend, 0);
  const aTotal = LISTINGS.reduce((a, l) => a + aCount(l), 0);
  const qualified = LISTINGS.reduce((a, l) => a + l.qualified, 0);
  const bestListing = [...LISTINGS].sort((a, b) => aTierPerDollar(b) - aTierPerDollar(a))[0];
  const live = LISTINGS.filter((l) => (statuses[l.id] ?? l.status) !== "paused").length;

  return (
    <div className="pb-16">
      <PageHeader
        title="Listings & split tests"
        subtitle="The same role, posted as different variants on different boards. Judge them on A-tier candidates per dollar, not applies."
        actions={
          <ButtonLink to="/demo/roles/new" variant="ink" size="md">
            <Plus className="size-4" /> New role
          </ButtonLink>
        }
      />

      <div className="px-4 md:px-8">
        {/* summary strip */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel bg-rim shadow-card lg:grid-cols-4">
          {[
            { k: "Listings running", v: `${live} of ${LISTINGS.length}`, s: `${ROLES.length} experiments across ${BOARDS.length} boards` },
            { k: "Spend to date", v: money(spend), s: `${money(spend / qualified, 2)} per qualified` },
            { k: "A-tier applicants", v: int(aTotal), s: `${(aTotal / spend).toFixed(2)} per $ overall` },
            {
              k: "Best listing",
              v: `${boardById(bestListing.board).short} · ${bestListing.variant}`,
              s: `${aTierPerDollar(bestListing).toFixed(2)} A-tier per $ · ${boardById(bestListing.board).name}`,
            },
          ].map((m) => (
            <div key={m.k} className="min-w-0 bg-card p-4">
              <div className="text-[11.5px] text-muted">{m.k}</div>
              <div className="tnum mt-1 text-[20px] font-semibold tracking-[-0.02em]">{m.v}</div>
              <div className="tnum truncate text-[11.5px] text-faint">{m.s}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold tracking-[-0.015em]">Experiments</h2>
            <p className="text-[12.5px] text-muted">One per role. The leading arm is outlined.</p>
          </div>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "experiments", label: "By experiment", icon: FlaskConical },
              { value: "all", label: "All listings", icon: Rows3 },
            ]}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="mt-4"
          >
            {view === "experiments" ? (
              <div className="flex flex-col gap-10">
                {ROLES.map((r) => (
                  <Experiment key={r.id} roleId={r.id} statuses={statuses} setStatuses={setStatuses} toast={toast} />
                ))}
              </div>
            ) : (
              <AllListings statuses={statuses} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.015em]">Board performance</h2>
              <p className="text-[12.5px] text-muted">Every listing on a board, added up. The best value in each column is highlighted.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <BoardMatrix />
            <Scatter />
            <BoardReadout />
          </div>
        </div>
      </div>
      {toastNode}
    </div>
  );
}
