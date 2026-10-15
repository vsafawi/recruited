import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, CalendarClock, ChevronRight, FileText, FlaskConical, MessageSquare, Plus, Send, Star,
  TrendingDown, TrendingUp, UserPlus, Workflow,
} from "lucide-react";
import { PageHeader } from "./Shell";
import {
  Avatar, ButtonLink, Capsule, Card, cx, SectionLabel, Sparkline, Tag, TierBadge, TierBar,
} from "@/components/ui";
import {
  ACTIVITY, aTierPerDollar, boardById, BOARDS, CANDIDATES, LISTINGS, ROLES, STAGES, stageById, totals,
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

/** A numbered catalogue heading with an optional link on the right. */
function SectionHead({ n, title, children, action }: { n: number; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <SectionLabel n={n} title={title} className="min-w-0">{children}</SectionLabel>
      {action}
    </div>
  );
}

/** An inline entity chip, set into a sentence. */
function EntityChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex h-6 translate-y-[-1px] items-center gap-1.5 whitespace-nowrap rounded-full bg-inset px-2 align-middle text-[12.5px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--rim)]">
      {children}
    </span>
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

  const winRole = ROLES.find((r) => r.id === win.roleId)!;
  const winDeclared = win.status === "winner";

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

      <div className="flex flex-col px-4 md:px-8">
        {/* 01 KPIs */}
        <section>
          <SectionHead n={1} title="This fortnight">All roles, all boards. Change is the last 7 days against the 7 before.</SectionHead>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {kpis.map((k, i) => {
              const d = delta(k.s);
              const Icon = d >= 0 ? TrendingUp : TrendingDown;
              return (
                <div key={k.label} className={cx("flex min-w-0 flex-col rounded-card bg-card p-4 shadow-card", i === 4 && "col-span-2 sm:col-span-1")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-muted">{k.label}</span>
                    <span
                      className="font-mono tnum inline-flex items-center gap-0.5 text-[10.5px] text-faint"
                      title="Last 7 days against the 7 before. Listings taper as they age, so volume falling is normal."
                    >
                      <Icon className="size-3" />
                      {d >= 0 ? "+" : ""}
                      {d.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="font-mono tnum text-[20px] leading-none font-medium tracking-[-0.03em]">{k.value}</span>
                    <Sparkline data={k.s} width={64} height={22} color={i === 0 ? "var(--primary)" : "var(--muted)"} />
                  </div>
                  <div className="tnum mt-2.5 truncate text-[11.5px] text-faint">{k.sub}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="rule-dashed -mx-4 mt-8 grid gap-8 border-t px-4 pt-8 md:-mx-8 md:px-8 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
          {/* 02 Funnel */}
          <section className="min-w-0">
            <SectionHead n={2} title="Funnel">All roles. Bar length on a log scale.</SectionHead>
            <Card className="flex flex-col gap-2.5 p-4 md:p-5">
              {funnel.map((f, i) => {
                const w = Math.max((Math.log10(Math.max(f.v, 1)) / logMax) * 100, 4);
                const conv = i ? (f.v / funnel[i - 1].v) * 100 : null;
                return (
                  <div key={f.label} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 sm:grid-cols-[88px_1fr_120px]">
                    <span className="text-[12.5px] text-muted">{f.label}</span>
                    <div className="flex h-6 min-w-0 items-center gap-2">
                      <div
                        className="h-full shrink-0 rounded-[6px] transition-[width] duration-700 ease-settle"
                        style={{
                          width: `calc(${w}% - 3.5rem)`,
                          minWidth: 6,
                          background: `color-mix(in oklch, var(--primary) ${88 - i * 16}%, var(--card))`,
                        }}
                      />
                      <span className="font-mono tnum text-[12.5px] font-medium">{int(f.v)}</span>
                    </div>
                    <span className="tnum text-right text-[11.5px] text-muted">
                      {conv == null ? "—" : (
                        <>
                          <span className="font-mono font-medium text-foreground">{conv < 10 ? conv.toFixed(1) : conv.toFixed(0)}%</span>
                          <span className="hidden sm:inline"> of {funnel[i - 1].label.toLowerCase()}</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </Card>
          </section>

          {/* 03 Split test recommendation */}
          <section className="flex min-w-0 flex-col">
            <SectionHead n={3} title="Split test" action={<MoreLink to="/demo/listings">All experiments</MoreLink>}>{winRole.title}</SectionHead>
            <Link
              to="/demo/listings"
              className="group flex flex-1 flex-col rounded-panel bg-card p-4 shadow-card transition-colors duration-200 hover:bg-[var(--wash)] md:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <FlaskConical className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] leading-[1.7] font-semibold tracking-[-0.01em] text-balance">
                    <EntityChip>
                      <span className="size-2 rounded-full" style={{ background: boardById(win.board).color }} />
                      {boardById(win.board).name}
                    </EntityChip>
                    <EntityChip>Variant <span className="font-mono text-[11.5px]">{win.variant}</span></EntityChip>
                    {winDeclared ? " is the winner." : " is winning."}
                  </p>
                  <p className="mt-1 text-[13px] leading-[1.75] text-muted">
                    It brings{" "}
                    <Tag color="var(--success)" className="translate-y-[-1px] align-middle font-mono tnum">{multiple.toFixed(1)}× A-tier per dollar</Tag>{" "}
                    against variant {lose.variant}, on the same spend.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {[win, lose].map((l) => (
                  <div key={l.id}>
                    <div className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="min-w-0 truncate">
                        <span className="font-mono font-semibold">{l.variant}</span>
                        <span className="text-muted"> · {l.payBand} · {l.hypothesis.toLowerCase()}</span>
                      </span>
                      <span className="font-mono tnum shrink-0 text-[11.5px] font-medium">{l.tierMix.A}% A-tier</span>
                    </div>
                    <TierBar mix={l.tierMix} className="mt-1.5 h-1.5" />
                  </div>
                ))}
              </div>
              <div className="rule-dashed mt-auto flex items-center justify-between gap-3 border-t pt-3">
                <span className="font-mono tnum text-[11.5px] text-muted">
                  {aTierPerDollar(win).toFixed(2)} vs {aTierPerDollar(lose).toFixed(2)} A-tier per $
                </span>
                <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-[12.5px] font-medium text-on-primary">
                  Review <ArrowUpRight className="size-3.5 transition-transform duration-200 ease-settle group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          </section>
        </div>

        <div className="rule-dashed -mx-4 mt-8 grid gap-8 border-t px-4 pt-8 md:-mx-8 md:px-8 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
          {/* 04 Needs you today */}
          <section className="min-w-0">
            <SectionHead n={4} title="Needs you today" action={<MoreLink to="/demo/pipeline">Pipeline</MoreLink>}>
              {today.length} next steps, furthest along first.
            </SectionHead>
            <ul className="flex flex-col gap-2">
              {today.map((c, i) => {
                const role = ROLES.find((r) => r.id === c.roleId)!;
                const stage = stageById(c.stage);
                return (
                  <li key={c.id}>
                    <Link to={`/demo/candidates/${c.id}`} className="group block rounded-full focus-visible:outline-2 focus-visible:outline-primary">
                      <Capsule
                        state="active"
                        n={i + 1}
                        className="transition-colors group-hover:bg-inset"
                        title={
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Avatar initials={c.initials} hue={c.hue} size={24} />
                            <span className="min-w-0">
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate">{c.name}</span>
                                <TierBadge tier={c.tier} />
                              </span>
                              <span className="block truncate text-[12px] font-normal text-muted">
                                <span className="sm:hidden">{c.nextStep}</span>
                                <span className="hidden sm:inline">{role.title}</span>
                              </span>
                            </span>
                          </span>
                        }
                        meta={
                          <span className="inline-flex max-w-[220px] items-center gap-1.5 text-foreground">
                            <CalendarClock className="size-3.5 shrink-0 text-faint" />
                            <span className="truncate">{c.nextStep}</span>
                          </span>
                        }
                        trailing={
                          <span className="flex shrink-0 items-center gap-1">
                            <Tag color={stage.color}>
                              <span className="size-1.5 rounded-full" style={{ background: stage.color }} />
                              {stage.label}
                            </Tag>
                            <ChevronRight className="size-4 text-faint transition-transform duration-150 group-hover:translate-x-0.5" />
                          </span>
                        }
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 05 Board ROI */}
          <section className="min-w-0">
            <SectionHead n={5} title="Board ROI" action={<MoreLink to="/demo/listings">Details</MoreLink>}>Cost per A-tier applicant.</SectionHead>
            <Card className="overflow-hidden">
              <table className="w-full table-fixed text-[12.5px]">
                <thead>
                  <tr className="border-b border-rim text-left text-[11px] text-muted">
                    <th className="w-8 py-2.5 pl-3 font-medium"><span className="sr-only">Row</span></th>
                    <th className="py-2.5 pr-2 font-medium">Board</th>
                    <th className="w-[58px] px-2 text-right font-medium">Spend</th>
                    <th className="w-[50px] px-2 text-right font-medium">A-tier</th>
                    <th className="w-[84px] py-2.5 pr-3 pl-2 text-right font-medium">Per A-tier</th>
                  </tr>
                </thead>
                <tbody>
                  {roi.map((r, i) => (
                    <tr key={r.b.id} className="border-b border-rim last:border-0">
                      <td className="py-2.5 pl-3 font-mono tnum text-[11px] text-faint">{i + 1}</td>
                      <td className="py-2.5 pr-2">
                        <Tag color={r.b.color} className="max-w-full">
                          <span className="size-1.5 shrink-0 rounded-full" style={{ background: r.b.color }} />
                          <span className="truncate">{r.b.name}</span>
                        </Tag>
                      </td>
                      <td className="font-mono tnum px-2 text-right text-[12px] text-muted">{money(r.spend)}</td>
                      <td className="font-mono tnum px-2 text-right text-[12px]">{int(r.a)}</td>
                      <td className="py-2.5 pr-3 pl-2">
                        <span className="flex flex-col items-end gap-1">
                          <span className={cx("font-mono tnum text-[12px]", i === 0 ? "font-semibold text-primary" : "font-medium")}>{money(r.cpa, 2)}</span>
                          <span className="h-1 w-full overflow-hidden rounded-full bg-inset">
                            <span className="block h-full rounded-full" style={{ width: `${(r.cpa / maxCpa) * 100}%`, background: r.b.color }} />
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap items-center gap-x-2 border-t border-rim px-3 py-2.5 text-[11.5px] text-muted">
                <span><span className="font-mono tnum font-medium text-foreground">{roi.length}</span> count</span>
                <span className="text-faint">·</span>
                <span>Sorted by cost per A-tier applicant. Lower is better.</span>
              </div>
            </Card>
          </section>
        </div>

        <div className="rule-dashed -mx-4 mt-8 grid gap-8 border-t px-4 pt-8 md:-mx-8 md:px-8 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
          {/* 06 Roles */}
          <section className="min-w-0">
            <SectionHead n={6} title="Open roles" action={<MoreLink to="/demo/roles/new">New role</MoreLink>}>
              Candidates by stage, per role.
            </SectionHead>
            <div className="flex flex-col gap-3">
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
                    className="group rounded-panel bg-card p-4 shadow-card transition-colors duration-200 hover:bg-[var(--wash)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium">{r.title}</div>
                        <div className="text-[12px] text-muted">
                          {r.team} · {r.location} · {r.target}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {ls.map((l) => (
                          <span key={l.id} title={`${boardById(l.board).name} · Variant ${l.variant}`}>
                            <Tag color={boardById(l.board).color} className="font-mono text-[11px]">
                              {boardById(l.board).short}·{l.variant}
                            </Tag>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
                      {counts.filter((x) => x.n).map(({ s, n }) => (
                        <span key={s.id} className="h-full first:rounded-l-full last:rounded-r-full" style={{ flexGrow: n, background: s.color }} />
                      ))}
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-y-1.5 text-[11.5px] sm:grid-cols-6">
                      {counts.map(({ s, n }) => (
                        <span key={s.id} className={cx("flex items-center gap-1.5", n ? "text-muted" : "text-faint")}>
                          <span className="size-1.5 rounded-full" style={{ background: n ? s.color : "var(--rim-strong)" }} />
                          {s.label}
                          <span className={cx("font-mono tnum", n && "font-medium text-foreground")}>{n}</span>
                        </span>
                      ))}
                    </div>
                    <div className="rule-dashed mt-3 flex items-center justify-between border-t pt-2.5 text-[11.5px] text-muted">
                      <span className="tnum">{total} candidates · {aTier} A-tier</span>
                      <span className="inline-flex items-center gap-1 font-medium text-foreground opacity-70 transition-opacity group-hover:opacity-100">
                        Open <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 07 Activity */}
          <section className="min-w-0">
            <SectionHead n={7} title="Activity">What changed, newest first.</SectionHead>
            <Card>
              <ol className="relative px-4 py-3 md:px-5">
                <span aria-hidden className="absolute top-5 bottom-7 left-[29px] w-px bg-rim md:left-[33px]" />
                {ACTIVITY.map((a) => {
                  const Icon = ACTIVITY_ICON[a.kind];
                  const c = a.candidateId ? CANDIDATES.find((x) => x.id === a.candidateId) : undefined;
                  return (
                    <li key={a.id}>
                      <Link
                        to={c ? `/demo/candidates/${c.id}` : "/demo/listings"}
                        className="-mx-2 flex items-start gap-3 rounded-control px-2 py-2 hover:bg-[var(--wash)]"
                      >
                        <span className="relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-muted shadow-card">
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 pt-1 text-[12.5px] leading-snug">{a.text}</span>
                        <span className="font-mono tnum shrink-0 pt-1 text-[11px] text-faint">{a.when}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
