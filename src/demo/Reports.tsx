import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "./Shell";
import { Button, Card, cx } from "@/components/ui";
import { ROLES, TIER_COLOR } from "@/data/mock";
import { usePeople } from "@/data/store";
import {
  boardCsv, boardRows, BOARD_SERIES, DAYS_IN_STAGE, download, funnelFor, HEAT_STAGES, int, listingsFor, median, money,
  OFFER_HISTORY, pct, rolesFor, timeToHire, type BoardRow, type RoleFilter,
} from "./reports/data";
import { AppliesLines, CostBars, HeatStrip, Legend, RoleFunnel, TierStacks } from "./reports/charts";

/* ---------------------------------------------------------------------------
   Reports. Where the hires come from, what each one costs and how long it
   takes. Every figure is derived from mock.ts; the two that can't be (days in
   stage, offer acceptance) carry an asterisk and a footnote.
   --------------------------------------------------------------------------- */

const RANGES = ["Last 30 days", "This quarter"] as const;

function Sample() {
  return <sup className="ml-0.5 text-[10px] font-normal text-faint" title="Sample figure">*</sup>;
}

function Section({ title, note, action, children, className }: { title: string; note?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cx("min-w-0", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 px-4 pt-4 pb-3 md:px-5">
        <div className="min-w-0">
          <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">{title}</h2>
          {note && <p className="mt-0.5 text-[11.5px] text-faint">{note}</p>}
        </div>
        {action}
      </div>
      <div className="px-4 pb-5 md:px-5">{children}</div>
    </Card>
  );
}

function readout(rows: BoardRow[], roleIds: string[]): string[] {
  const out: string[] = [];

  const priced = rows.filter((r) => r.costPerA != null).sort((a, b) => a.costPerA! - b.costPerA!);
  if (priced.length > 1) {
    const best = priced[0];
    const worst = priced[priced.length - 1];
    out.push(
      `${best.board.name} brings A-tier applicants at ${money(best.costPerA!)} each, ${(worst.costPerA! / best.costPerA!).toFixed(1)}× cheaper than ${worst.board.name} at ${money(worst.costPerA!)}.`,
    );
  } else if (priced.length === 1) {
    out.push(`${priced[0].board.name} is the only board running this role, at ${money(priced[0].costPerA!)} per A-tier applicant.`);
  }

  if (rows.length) {
    const vol = [...rows].sort((a, b) => b.applies - a.applies)[0];
    const share = (r: BoardRow) => r.tiers.A / r.applies;
    const qual = [...rows].sort((a, b) => share(b) - share(a))[0];
    out.push(
      vol === qual
        ? `${vol.board.name} sends both the most applies (${int(vol.applies)}) and the highest A-tier share (${pct(share(vol) * 100)}).`
        : `${vol.board.name} sends the most applies (${int(vol.applies)}), but only ${pct(share(vol) * 100)} are A-tier; ${qual.board.name} sends ${int(qual.applies)} and ${pct(share(qual) * 100)} are.`,
    );
  }

  let slow = { role: roleIds[0], stage: 0, d: 0 };
  for (const id of roleIds) DAYS_IN_STAGE[id].forEach((d, i) => { if (d > slow.d) slow = { role: id, stage: i, d }; });
  const title = ROLES.find((r) => r.id === slow.role)!.title;
  out.push(
    `The longest wait is ${HEAT_STAGES[slow.stage].label.toLowerCase()} for ${title}, ${slow.d.toFixed(1)} days, so that is the step to shorten if you want this hire sooner.`,
  );
  return out;
}

export default function Reports() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 30 days");
  const [role, setRole] = useState<RoleFilter>("all");
  const [people] = usePeople();

  const roles = rolesFor(role);
  const roleIds = roles.map((r) => r.id);
  const roleLabel = role === "all" ? "All roles" : roles[0].title;
  const rows = useMemo(() => boardRows(role), [role]);
  const listings = listingsFor(role);

  /* KPIs */
  const spend = listings.reduce((a, l) => a + l.spend, 0);
  const offers = listings.reduce((a, l) => a + l.offers, 0);
  const tth = median(roleIds.map(timeToHire));
  const stageDays = roleIds.flatMap((id) => DAYS_IN_STAGE[id]);
  const avgStage = stageDays.reduce((a, b) => a + b, 0) / stageDays.length;
  const active = people.filter((c) => roleIds.includes(c.roleId) && c.stage !== "hired" && c.stage !== "rejected");
  const activeA = active.filter((c) => c.tier === "A").length;
  const offersOut = active.filter((c) => c.stage === "offer").length;

  const kpis = [
    {
      label: "Median time to hire", sample: true,
      value: `${tth.toFixed(1)} days`,
      sub: role === "all" ? `Across ${roles.length} roles, new to accepted` : "New to accepted offer",
    },
    {
      label: "Time in stage", sample: true,
      value: `${avgStage.toFixed(1)} days`,
      sub: `Average of ${HEAT_STAGES.length} stages`,
    },
    {
      label: "Offer acceptance", sample: true,
      value: pct((OFFER_HISTORY.accepted / OFFER_HISTORY.made) * 100),
      sub: `${OFFER_HISTORY.accepted} of ${OFFER_HISTORY.made} last year · ${offersOut} out now`,
    },
    {
      label: "Cost per hire",
      value: offers ? money(spend / offers) : "—",
      sub: offers ? `${money(spend)} spend over ${offers} ${offers === 1 ? "offer" : "offers"}` : `No offer yet · ${money(spend)} spent`,
    },
    {
      label: "A-tier share of pipeline",
      value: active.length ? pct((activeA / active.length) * 100) : "—",
      sub: `${activeA} of ${active.length} active candidates`,
    },
  ];

  const lines = readout(rows, roleIds);

  const exportCsv = () => {
    const slug = role === "all" ? "all-roles" : role;
    download(`recruited-boards-${slug}.csv`, boardCsv(rows, roleLabel));
  };

  return (
    <div className="pb-16">
      <PageHeader
        title="Reports"
        subtitle={`${roleLabel} · ${listings.length} ${listings.length === 1 ? "listing" : "listings"} across ${rows.length} ${rows.length === 1 ? "board" : "boards"}`}
        actions={<Button onClick={exportCsv}><Download className="size-3.5" /> Export CSV</Button>}
      />

      <div className="flex flex-col gap-4 px-4 md:px-8">
        {/* Filters, one row above the charts */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-control bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)]" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r}
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={cx(
                  "inline-flex h-7 items-center rounded-[6px] px-2.5 text-[12.5px] font-medium transition-colors",
                  range === r ? "bg-card text-foreground shadow-card" : "text-muted hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <label className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted">
            <span className="sr-only sm:not-sr-only">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-8 min-w-0 max-w-[230px] rounded-control bg-card px-2 text-[12.5px] text-foreground shadow-card outline-none focus-visible:outline-2 focus-visible:outline-primary"
            >
              <option value="all">All roles</option>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </label>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel bg-rim shadow-card sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k, i) => (
            <div key={k.label} className={cx("flex min-w-0 flex-col bg-card p-4", i === 4 && "col-span-2 sm:col-span-1")}>
              <span className="truncate text-[12px] text-muted">{k.label}{k.sample && <Sample />}</span>
              <span className="tnum mt-1.5 text-[22px] leading-none font-semibold tracking-[-0.025em]">{k.value}</span>
              <span className="tnum mt-2 truncate text-[11.5px] text-faint" title={k.sub}>{k.sub}</span>
            </div>
          ))}
        </div>

        {/* Readout */}
        <Card className="p-4 md:p-5">
          <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">What this says</h2>
          <ol className="mt-2 flex flex-col gap-1.5 text-[13.5px] leading-relaxed">
            {lines.map((l, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="tnum mt-[3px] flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[10.5px] font-semibold text-primary">{i + 1}</span>
                <span className="min-w-0">{l}{i === 2 && <Sample />}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* Funnel */}
        <Section title="Stage conversion by role" note="Bar length on a log scale. The right column is the share that made it from the step above.">
          <div className={cx("grid gap-x-8 gap-y-6", roles.length > 1 && "md:grid-cols-2 xl:grid-cols-3")}>
            {roles.map((r) => <RoleFunnel key={r.id} title={r.title} values={funnelFor(r.id)} />)}
          </div>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Source of hire / quality */}
          <Section
            title="Source of quality"
            note="Applies per board, split by screening tier. Bar length is volume."
            action={<Legend items={(["A", "B", "C"] as const).map((t) => ({ label: `Tier ${t}`, color: TIER_COLOR[t] }))} />}
          >
            <TierStacks rows={rows} />
          </Section>

          {/* Cost */}
          <Section title="What each board costs" note="Listing spend divided by what it produced. The cheapest is highlighted.">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <h3 className="mb-2 text-[12px] font-medium">Per A-tier applicant</h3>
                <CostBars rows={rows} pick={(r) => r.costPerA} empty="No A-tier yet" />
              </div>
              <div className="min-w-0">
                <h3 className="mb-2 text-[12px] font-medium">Per hire</h3>
                <CostBars rows={rows} pick={(r) => r.costPerHire} empty="No offer yet" />
              </div>
            </div>
          </Section>
        </div>

        {/* Line chart */}
        <Section
          title="Applies per day"
          note="Last 14 days, every listing on the board summed. Hover for the day."
          action={<Legend items={rows.map((r) => ({ label: r.board.name, color: BOARD_SERIES[r.board.id] }))} />}
        >
          <AppliesLines rows={rows} />
        </Section>

        {/* Heat strip */}
        <Section title="Time in stage" note="Median days a candidate sits in each stage before moving on. Sample figures.">
          <HeatStrip roles={roles} />
        </Section>

        {/* Board table */}
        <Section
          title="By board"
          note="The table the CSV exports."
          action={<Button size="sm" variant="ghost" onClick={exportCsv}><Download className="size-3.5" /> CSV</Button>}
        >
          <div className="scroll-quiet -mx-4 overflow-x-auto px-4 md:-mx-5 md:px-5">
            <table className="tnum w-full min-w-[640px] text-[12.5px]">
              <thead>
                <tr className="border-b border-rim text-left text-[11.5px] text-muted">
                  {["Board", "Spend", "Applies", "Qualified", "A-tier", "Offers", "Per qualified", "Per A-tier", "Per hire"].map((h, i) => (
                    <th key={h} className={cx("pb-2 font-medium", i && "text-right")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.board.id} className="border-b border-rim last:border-0">
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-[2px]" style={{ background: BOARD_SERIES[r.board.id] }} />
                        {r.board.name}
                      </span>
                    </td>
                    <td className="py-2 text-right">${int(r.spend)}</td>
                    <td className="py-2 text-right">{int(r.applies)}</td>
                    <td className="py-2 text-right">{int(r.qualified)}</td>
                    <td className="py-2 text-right">{int(r.tiers.A)}</td>
                    <td className="py-2 text-right">{r.offers}</td>
                    <td className="py-2 text-right">{r.costPerQualified == null ? "—" : money(r.costPerQualified)}</td>
                    <td className="py-2 text-right font-medium">{r.costPerA == null ? "—" : money(r.costPerA)}</td>
                    <td className="py-2 text-right">{r.costPerHire == null ? "—" : money(r.costPerHire)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <p className="max-w-[72ch] text-[11.5px] leading-relaxed text-faint">
          * Sample figure. Days in stage and offer acceptance aren't in the demo data, because nobody has been hired yet;
          they're fixed numbers so this page reads the same every time. Everything else is computed from the {listingsFor("all").length} listings
          and the live pipeline. Every listing went live in the last 30 days, so both date ranges show the same figures.
          Cost per hire divides spend by offers made until an offer is accepted.
        </p>
      </div>
    </div>
  );
}
