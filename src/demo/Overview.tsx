import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, CalendarClock, FileText, FlaskConical, MessageSquare, Plus, Send, Star, TrendingDown,
  TrendingUp, UserPlus, Workflow,
} from "lucide-react";
import { PageHeader } from "./Shell";
import { Avatar, ButtonLink, Card, cx, Sparkline, StageChip, TierBadge, TierBar } from "@/components/ui";
import {
  ACTIVITY, aTierPerDollar, boardById, BOARDS, CANDIDATES, LISTINGS, ROLES, STAGES, totals,
  type Activity, type StageId,
} from "@/data/mock";

/* ---------------------------------------------------------------------------
   Overview. Everything is derived from mock.ts; the week-over-week deltas are
   computed from the last 7 vs the previous 7 days of each listing's trend.
   --------------------------------------------------------------------------- */

const money = (n: number, dp = 0) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const int = (n: number) => Math.round(n).toLocaleString("en-US");

/** Daily series for a metric: each listing's applies trend scaled by its ratio to applies. */
function series(ratio: (l: (typeof LISTINGS)[number]) => number) {
  return Array.from({ length: 14 }, (_, i) => LISTINGS.reduce((a, l) => a + l.trend[i] * ratio(l), 0));
}

function delta(s: number[]) {
  const prev = s.slice(0, 7).reduce((a, b) => a + b, 0);
  const last = s.slice(7).reduce((a, b) => a + b, 0);
  return prev ? ((last - prev) / prev) * 100 : 0;
}

const STAGE_RANK: Record<StageId, number> = { offer: 0, interview: 1, assess: 2, screen: 3, new: 4, hired: 9, rejected: 9 };

const ACTIVITY_ICON: Record<Activity["kind"], typeof Send> = {
  applied: UserPlus,
  moved: Workflow,
  scored: Star,
  note: MessageSquare,
  listing: FlaskConical,
  offer: FileText,
};

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 md:px-5">
      <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">{title}</h2>
      {action}
    </div>
  );
}

function MoreLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-[12px] font-medium text-muted hover:text-foreground">
      {children} <ArrowRight className="size-3.5" />
    </Link>
  );
}

export default function Overview() {
  const t = totals();
  const activeCandidates = CANDIDATES.filter((c) => c.stage !== "hired" && c.stage !== "rejected");

  const appliesS = series(() => 1);
  const qualS = series((l) => l.qualified / l.applies);
  const intS = series((l) => l.interviews / l.applies);
  const offS = series((l) => (l.offers + 0.15) / l.applies);
  const spendS = series((l) => l.spend / l.applies);

  const kpis = [
    { label: "Applies", value: int(t.applies), s: appliesS, sub: `${((t.applies / t.views) * 100).toFixed(1)}% of ${int(t.views)} views` },
    { label: "Qualified", value: int(t.qualified), s: qualS, sub: `${Math.round((t.qualified / t.applies) * 100)}% of applies` },
    { label: "Interviews", value: int(t.interviews), s: intS, sub: `${activeCandidates.filter((c) => c.stage === "interview").length} scheduled this week` },
    { label: "Offers", value: int(t.offers), s: offS, sub: `${CANDIDATES.filter((c) => c.stage === "offer").length} awaiting a reply` },
    { label: "Spend", value: money(t.spend), s: spendS, sub: `${money(t.spend / t.qualified, 2)} per qualified` },
  ];

  /* funnel */
  const funnel = [
    { label: "Views", v: t.views },
    { label: "Applies", v: t.applies },
    { label: "Qualified", v: t.qualified },
    { label: "Interview", v: t.interviews },
    { label: "Offer", v: t.offers },
  ];
  const logMax = Math.log10(t.views);

  /* needs you */
  const today = activeCandidates
    .filter((c) => c.nextStep)
    .sort((a, b) => STAGE_RANK[a.stage] - STAGE_RANK[b.stage] || b.score - a.score)
    .slice(0, 6);

  /* board ROI */
  const roi = BOARDS.map((b) => {
    const ls = LISTINGS.filter((l) => l.board === b.id);
    const spend = ls.reduce((a, l) => a + l.spend, 0);
    const a = ls.reduce((s, l) => s + (l.applies * l.tierMix.A) / 100, 0);
    return { b, spend, a, cpa: a ? spend / a : 0 };
  }).sort((x, y) => x.cpa - y.cpa);
  const maxCpa = Math.max(...roi.map((r) => r.cpa));

  /* split test highlight */
  const vaArms = LISTINGS.filter((l) => l.roleId === "va-ops").sort((a, b) => aTierPerDollar(b) - aTierPerDollar(a));
  const [win, lose] = vaArms;
  const multiple = aTierPerDollar(win) / aTierPerDollar(lose);

  return (
    <div className="pb-16">
      <PageHeader
        title="Good morning"
        subtitle={`Thursday, 15 October · ${ROLES.length} roles open · ${activeCandidates.length} candidates in play`}
        actions={
          <>
            <ButtonLink to="/demo/pipeline" variant="secondary">Open pipeline</ButtonLink>
            <ButtonLink to="/demo/roles/new" variant="ink"><Plus className="size-4" /> New role</ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-4 px-4 md:px-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel bg-rim shadow-card sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k, i) => {
            const d = delta(k.s);
            const Icon = d >= 0 ? TrendingUp : TrendingDown;
            return (
              <div key={k.label} className={cx("flex min-w-0 flex-col bg-card p-4", i === 4 && "col-span-2 sm:col-span-1")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-muted">{k.label}</span>
                  <span
                    className={cx("tnum inline-flex items-center gap-0.5 rounded-chip px-1 py-px text-[11px] font-medium")}
                    style={{ color: "var(--muted)", background: "var(--inset)" }}
                    title="Last 7 days against the 7 before. Listings taper as they age, so volume falling is normal."
                  >
                    <Icon className="size-3" />
                    {d >= 0 ? "+" : ""}
                    {d.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <span className="tnum text-[24px] leading-none font-semibold tracking-[-0.025em]">{k.value}</span>
                  <Sparkline data={k.s} width={72} height={26} color={i === 0 ? "var(--primary)" : "var(--muted)"} />
                </div>
                <div className="tnum mt-2 truncate text-[11.5px] text-faint">{k.sub}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {/* Funnel */}
          <Card>
            <SectionTitle title="Funnel, all roles" action={<span className="text-[11.5px] text-faint">Bar length on a log scale</span>} />
            <div className="flex flex-col gap-2.5 px-4 pb-5 md:px-5">
              {funnel.map((f, i) => {
                const w = Math.max((Math.log10(Math.max(f.v, 1)) / logMax) * 100, 4);
                const conv = i ? (f.v / funnel[i - 1].v) * 100 : null;
                return (
                  <div key={f.label} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 sm:grid-cols-[88px_1fr_120px]">
                    <span className="text-[12.5px] text-muted">{f.label}</span>
                    <div className="flex h-7 min-w-0 items-center gap-2">
                      <div
                        className="h-full shrink-0 rounded-[7px] transition-[width] duration-700 ease-settle"
                        style={{
                          width: `calc(${w}% - 3.5rem)`,
                          minWidth: 6,
                          background: `color-mix(in oklch, var(--primary) ${92 - i * 16}%, var(--card))`,
                        }}
                      />
                      <span className="tnum text-[13px] font-semibold tracking-[-0.01em]">{int(f.v)}</span>
                    </div>
                    <span className="tnum text-right text-[11.5px] text-muted">
                      {conv == null ? "—" : (
                        <>
                          <span className="font-medium text-foreground">{conv < 10 ? conv.toFixed(1) : conv.toFixed(0)}%</span>
                          <span className="hidden sm:inline"> of {funnel[i - 1].label.toLowerCase()}</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Split test highlight */}
          <Link
            to="/demo/listings"
            className="group relative flex flex-col overflow-hidden rounded-panel bg-card p-4 shadow-card transition-shadow duration-200 hover:shadow-raised md:p-5"
          >
            <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary opacity-[0.07] blur-2xl" />
            <div className="flex items-center gap-2 text-[11.5px] font-medium text-primary">
              <FlaskConical className="size-3.5" /> Split test · {ROLES.find((r) => r.id === win.roleId)!.title}
            </div>
            <h3 className="mt-2 text-[17px] leading-snug font-semibold tracking-[-0.02em]">
              {boardById(win.board).name} · Variant {win.variant} is winning
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              It brings <span className="tnum font-medium text-foreground">{multiple.toFixed(1)}×</span> more A-tier candidates per dollar than variant{" "}
              {lose.variant}, on the same spend.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {[win, lose].map((l) => (
                <div key={l.id}>
                  <div className="flex items-baseline justify-between gap-2 text-[12px]">
                    <span className="min-w-0 truncate">
                      <span className="font-mono font-semibold">{l.variant}</span>
                      <span className="text-muted"> · {l.payBand} · {l.hypothesis.toLowerCase()}</span>
                    </span>
                    <span className="tnum shrink-0 font-medium">{l.tierMix.A}% A-tier</span>
                  </div>
                  <TierBar mix={l.tierMix} className="mt-1.5 h-2" />
                </div>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-1 pt-4 text-[12.5px] font-medium text-foreground">
              See all experiments <ArrowUpRight className="size-3.5 transition-transform duration-200 ease-settle group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {/* Needs you today */}
          <Card>
            <SectionTitle title="Needs you today" action={<MoreLink to="/demo/pipeline">Pipeline</MoreLink>} />
            <ul className="pb-2">
              {today.map((c) => {
                const role = ROLES.find((r) => r.id === c.roleId)!;
                return (
                  <li key={c.id}>
                    <Link
                      to={`/demo/candidates/${c.id}`}
                      className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--wash)] md:px-5"
                    >
                      <Avatar initials={c.initials} hue={c.hue} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium">{c.name}</span>
                          <TierBadge tier={c.tier} />
                        </div>
                        <div className="truncate text-[12px] text-muted">{role.title}</div>
                      </div>
                      <div className="hidden min-w-0 items-center gap-1.5 text-right text-[12.5px] sm:flex">
                        <CalendarClock className="size-3.5 shrink-0 text-faint" />
                        <span className="truncate">{c.nextStep}</span>
                      </div>
                      <StageChip stage={c.stage} className="shrink-0" />
                    </Link>
                    <div className="-mt-1.5 truncate pr-4 pb-2 pl-[60px] text-[12px] text-muted sm:hidden">{c.nextStep}</div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Board ROI */}
          <Card>
            <SectionTitle title="Board ROI" action={<MoreLink to="/demo/listings">Details</MoreLink>} />
            <div className="px-4 pb-4 md:px-5">
              <div className="grid grid-cols-[1fr_56px_44px_72px] gap-x-3 border-b border-rim pb-2 text-[11px] text-muted">
                <span>Board</span>
                <span className="text-right">Spend</span>
                <span className="text-right">A-tier</span>
                <span className="text-right">Per A-tier</span>
              </div>
              {roi.map((r, i) => (
                <div key={r.b.id} className="grid grid-cols-[1fr_56px_44px_72px] items-center gap-x-3 border-b border-rim py-2.5 text-[12.5px] last:border-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: r.b.color }} />
                    <span className="truncate">{r.b.name}</span>
                  </span>
                  <span className="tnum text-right text-muted">{money(r.spend)}</span>
                  <span className="tnum text-right">{int(r.a)}</span>
                  <span className="flex flex-col items-end gap-1">
                    <span className={cx("tnum", i === 0 ? "font-semibold text-primary" : "font-medium")}>{money(r.cpa, 2)}</span>
                    <span className="h-1 w-full overflow-hidden rounded-full bg-inset">
                      <span className="block h-full rounded-full" style={{ width: `${(r.cpa / maxCpa) * 100}%`, background: r.b.color }} />
                    </span>
                  </span>
                </div>
              ))}
              <p className="mt-3 text-[11.5px] text-faint">Sorted by cost per A-tier applicant. Lower is better.</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {/* Roles */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">Open roles</h2>
              <MoreLink to="/demo/roles/new">New role</MoreLink>
            </div>
            {ROLES.map((r) => {
              const cs = CANDIDATES.filter((c) => c.roleId === r.id);
              const ls = LISTINGS.filter((l) => l.roleId === r.id);
              const active = STAGES.filter((s) => s.id !== "rejected");
              const counts = active.map((s) => ({ s, n: cs.filter((c) => c.stage === s.id).length }));
              const total = counts.reduce((a, x) => a + x.n, 0);
              const aTier = cs.filter((c) => c.tier === "A" && c.stage !== "rejected").length;
              return (
                <Link
                  key={r.id}
                  to={`/demo/pipeline?role=${r.id}`}
                  className="group rounded-panel bg-card p-4 shadow-card transition-shadow duration-200 hover:shadow-raised"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium">{r.title}</div>
                      <div className="text-[12px] text-muted">
                        {r.team} · {r.location} · {r.target}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {ls.map((l) => (
                        <span
                          key={l.id}
                          title={`${boardById(l.board).name} · Variant ${l.variant}`}
                          className="inline-flex h-5 items-center rounded-[5px] px-1.5 font-mono text-[10px] font-semibold"
                          style={{ color: boardById(l.board).color, background: `color-mix(in oklch, ${boardById(l.board).color} 11%, transparent)` }}
                        >
                          {boardById(l.board).short}·{l.variant}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                    {counts.filter((x) => x.n).map(({ s, n }) => (
                      <span key={s.id} className="h-full first:rounded-l-full last:rounded-r-full" style={{ flexGrow: n, background: s.color }} />
                    ))}
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-y-1.5 text-[11.5px] sm:grid-cols-6">
                    {counts.map(({ s, n }) => (
                      <span key={s.id} className={cx("flex items-center gap-1.5", n ? "text-muted" : "text-faint")}>
                        <span className="size-1.5 rounded-full" style={{ background: n ? s.color : "var(--rim-strong)" }} />
                        {s.label}
                        <span className={cx("tnum", n && "font-medium text-foreground")}>{n}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-rim pt-2.5 text-[11.5px] text-muted">
                    <span className="tnum">{total} candidates · {aTier} A-tier</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground opacity-70 transition-opacity group-hover:opacity-100">
                      Open <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Activity */}
          <Card className="self-start">
            <SectionTitle title="Activity" />
            <ol className="relative px-4 pb-4 md:px-5">
              <span aria-hidden className="absolute top-2 bottom-6 left-[29px] w-px bg-rim md:left-[33px]" />
              {ACTIVITY.map((a) => {
                const Icon = ACTIVITY_ICON[a.kind];
                const c = a.candidateId ? CANDIDATES.find((x) => x.id === a.candidateId) : undefined;
                const body = (
                  <>
                    <span className="relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-muted shadow-card">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 pt-1 text-[12.5px] leading-snug">{a.text}</span>
                    <span className="tnum shrink-0 pt-1 text-[11.5px] text-faint">{a.when}</span>
                  </>
                );
                return (
                  <li key={a.id}>
                    {c ? (
                      <Link to={`/demo/candidates/${c.id}`} className="-mx-2 flex items-start gap-3 rounded-control px-2 py-2 hover:bg-[var(--wash)]">
                        {body}
                      </Link>
                    ) : (
                      <Link to="/demo/listings" className="-mx-2 flex items-start gap-3 rounded-control px-2 py-2 hover:bg-[var(--wash)]">
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
