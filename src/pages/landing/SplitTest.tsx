import { useState } from "react";
import { Capsule, Segmented, Sparkline, Tag, TierBar, cx } from "@/components/ui";
import { BOARDS, TIER_COLOR, aTierPerDollar, boardById, costPerQualified, listingById, roleById, type Listing } from "@/data/mock";
import { RoiMock } from "./Bento";
import { useCountUp, useInView } from "./hooks";

const A = listingById("l1");
const B = listingById("l2");
const role = roleById(A.roleId);
const board = boardById(A.board);
const perHundred = (l: Listing) => aTierPerDollar(l) * 100;
const aCount = (l: Listing) => Math.round((l.applies * l.tierMix.A) / 100);
export const LIFT = aTierPerDollar(B) / aTierPerDollar(A);

function Variant({ l, win, run }: { l: Listing; win?: boolean; run: boolean }) {
  const applies = useCountUp(l.applies, run);
  const aTier = useCountUp(aCount(l), run, 1400);
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col rounded-card bg-background p-4",
        win ? "shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_55%,transparent)]" : "shadow-card",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cx(
            "grid size-5.5 place-items-center rounded-[6px] font-mono text-[11.5px] font-semibold",
            win ? "bg-primary text-on-primary" : "bg-inset text-muted",
          )}
        >
          {l.variant}
        </span>
        <span className="text-[12.5px] font-medium">{l.payBand}</span>
        <span className="ml-auto">{win ? <Tag color="var(--primary)">Winner</Tag> : <Tag>Control</Tag>}</span>
      </div>

      <div className="mt-3 min-h-[38px] text-[13px] leading-snug font-medium text-pretty">“{l.headline}”</div>
      <div className="mt-1 text-[11.5px] text-muted">{l.hypothesis}</div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-rim pt-3">
        <Stat label="Applies" value={Math.round(applies).toString()} />
        <Stat label="Qualified" value={l.qualified.toString()} />
        <Stat label="Per qualified" value={`$${costPerQualified(l).toFixed(2)}`} />
      </div>

      <div className="mt-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-muted">
          <span>Tier mix</span>
          <span className="flex gap-2">
            {(["A", "B", "C"] as const).map((t) => (
              <span key={t} className="tnum inline-flex items-center gap-1 font-mono">
                <span className="size-1.5 rounded-full" style={{ background: TIER_COLOR[t] }} />
                {l.tierMix[t]}
              </span>
            ))}
          </span>
        </div>
        <div className="grow-x" style={{ ["--d" as string]: win ? "350ms" : "250ms" }}>
          <TierBar mix={l.tierMix} className="h-1.5" />
        </div>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-3 border-t border-rim pt-3">
        <div>
          <div className="text-[11px] text-muted">A-tier candidates</div>
          <div className="tnum font-mono text-[20px] leading-tight font-medium" style={{ color: win ? "var(--tier-a)" : undefined }}>
            {Math.round(aTier)}
          </div>
        </div>
        <Sparkline data={l.trend} width={84} height={24} color={win ? "var(--primary)" : "var(--faint)"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[11px] text-muted">{label}</div>
      <div className="tnum font-mono text-[14px] font-medium">{value}</div>
    </div>
  );
}

function Verdict({ run }: { run: boolean }) {
  const lift = useCountUp(LIFT, run, 1400);
  const max = perHundred(B);
  const l3 = listingById("l3");
  const l5 = listingById("l5");
  return (
    <div className="w-full max-w-[560px]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tnum font-mono text-[44px] leading-none font-medium tracking-[-0.04em] text-primary">{lift.toFixed(1)}×</span>
        <span className="text-[13px] text-muted">more A-tier candidates per dollar from variant B</span>
      </div>
      <div className="mt-5 space-y-3">
        {[B, A].map((l, i) => (
          <div key={l.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px]">
              <span>
                <span className="font-medium">Variant {l.variant}</span> <span className="text-muted">· {l.payBand}</span>
              </span>
              <span className="tnum font-mono text-muted">{perHundred(l).toFixed(1)} per $100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-inset">
              <div
                className="grow-x h-full rounded-full"
                style={{
                  width: `${(perHundred(l) / max) * 100}%`,
                  background: i === 0 ? "var(--primary)" : "var(--rim-strong)",
                  ["--d" as string]: i === 0 ? "300ms" : "200ms",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12.5px] leading-relaxed text-pretty text-muted">
        Variant A got {(A.applies / B.applies).toFixed(1)}× the applies and {A.tierMix.C}% of them were tier C. Variant B got
        half the inbox and {aCount(B)} candidates you would interview. An applies count would have picked the wrong one.
      </p>
      <div className="mt-4 space-y-1.5">
        <Capsule state="done" title={`Kept the ${B.payBand} band on ${board.name}`} trailing={<Tag color="var(--success)">Kept</Tag>} />
        <Capsule
          state="failed"
          title={`Indeed, salary hidden: ${l3.tierMix.C}% tier C`}
          meta={`${l3.applies} applies`}
          trailing={<Tag color="var(--destructive)">Paused</Tag>}
        />
        <Capsule
          state="active"
          n={3}
          title={`Music Business Worldwide: ${l5.tierMix.A}% tier A`}
          meta={`${l5.applies} applies`}
          trailing={<Tag color="var(--primary)">Learned</Tag>}
        />
      </div>
    </div>
  );
}

export function SplitTestMock() {
  const [ref, run] = useInView<HTMLDivElement>();
  const [view, setView] = useState<"variants" | "verdict" | "boards">("variants");
  return (
    <div ref={ref} className="flex w-full flex-col items-center gap-5">
      <div className="flex w-full max-w-[640px] flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px]">
        <span className="font-medium">{role.title}</span>
        <Tag color={board.color}>{board.name}</Tag>
        <span className="text-muted sm:ml-auto">
          Same board, same ${A.spend} spend, same {A.daysLive} days
        </span>
      </div>
      <div key={view} className="panel-in flex w-full justify-center">
        {view === "variants" && (
          <div className="grid w-full max-w-[640px] gap-3 md:grid-cols-2">
            <Variant l={A} run={run} />
            <Variant l={B} win run={run} />
          </div>
        )}
        {view === "verdict" && <Verdict run={run} />}
        {view === "boards" && <RoiMock />}
      </div>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: "variants", label: "Variants", count: 2 },
          { id: "verdict", label: "Verdict" },
          { id: "boards", label: "Boards", count: BOARDS.length },
        ]}
      />
    </div>
  );
}
