import { Equal, FlaskConical, Trophy } from "lucide-react";
import { Sparkline, TierBar, cx } from "@/components/ui";
import { TIER_COLOR, aTierPerDollar, boardById, costPerQualified, listingById, roleById, type Listing } from "@/data/mock";
import { useCountUp, useInView } from "./hooks";

const A = listingById("l1");
const B = listingById("l2");
const role = roleById(A.roleId);
const board = boardById(A.board);
const perHundred = (l: Listing) => aTierPerDollar(l) * 100;
const aCount = (l: Listing) => Math.round((l.applies * l.tierMix.A) / 100);
const LIFT = aTierPerDollar(B) / aTierPerDollar(A);

function Variant({ l, win, run }: { l: Listing; win?: boolean; run: boolean }) {
  const applies = useCountUp(l.applies, run);
  const aTier = useCountUp(aCount(l), run, 1400);
  return (
    <div
      className={cx(
        "relative flex flex-col rounded-panel bg-card p-4 sm:p-5",
        win
          ? "shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_45%,transparent),0_2px_6px_oklch(0_0_0/0.05),0_18px_40px_color-mix(in_oklch,var(--primary)_14%,transparent)]"
          : "shadow-card",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cx(
            "grid size-6 place-items-center rounded-[7px] font-mono text-[12px] font-semibold",
            win ? "bg-primary text-on-primary" : "bg-inset text-muted",
          )}
        >
          {l.variant}
        </span>
        <span className="text-[13px] font-medium">Version {l.variant}</span>
        {win ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-chip bg-primary-tint px-1.5 py-0.5 text-[11px] font-medium text-primary">
            <Trophy className="size-3" /> Better
          </span>
        ) : (
          <span className="ml-auto rounded-chip bg-inset px-1.5 py-0.5 text-[11px] text-muted">Original</span>
        )}
      </div>

      <div className="mt-3.5 min-h-[44px] text-[13.5px] leading-snug font-medium tracking-[-0.01em] text-pretty">“{l.headline}”</div>
      <div className="mt-1.5 text-[12px] text-muted">
        <span className="font-medium text-foreground">{l.payBand}</span> · {l.hypothesis}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-rim pt-4">
        <Stat label="Applicants" value={Math.round(applies).toString()} />
        <Stat label="Qualified" value={l.qualified.toString()} />
        <Stat label="Cost per qualified" value={`$${costPerQualified(l).toFixed(2)}`} />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-muted">
          <span>Candidate quality</span>
          <span className="flex gap-2.5">
            {(["A", "B", "C"] as const).map((t) => (
              <span key={t} className="tnum inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ background: TIER_COLOR[t] }} />
                {t} {l.tierMix[t]}%
              </span>
            ))}
          </span>
        </div>
        <div className="grow-x" style={{ ["--d" as string]: win ? "450ms" : "300ms" }}>
          <TierBar mix={l.tierMix} className="h-2" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 rounded-card bg-inset px-3 py-2.5">
        <div>
          <div className="text-[11px] text-muted">Strong candidates (tier A)</div>
          <div className="tnum text-[22px] leading-tight font-semibold tracking-[-0.03em]" style={{ color: win ? "var(--tier-a)" : undefined }}>
            {Math.round(aTier)}
          </div>
        </div>
        <div className="text-right">
          <div className="mb-0.5 text-[10.5px] text-faint">Applicants per day</div>
          <Sparkline data={l.trend} width={84} height={24} color={win ? "var(--primary)" : "var(--faint)"} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted">{label}</div>
      <div className="tnum text-[17px] font-semibold tracking-[-0.02em]">{value}</div>
    </div>
  );
}

export function SplitTest() {
  const [ref, run] = useInView<HTMLDivElement>();
  const lift = useCountUp(LIFT, run, 1600);
  const max = perHundred(B);

  return (
    <section id="split-tests" className="relative scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-[1120px]">
        <div className="reveal mx-auto max-w-[720px] text-center">
          <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary">
            <FlaskConical className="size-3.5" /> Try two versions
          </div>
          <h2 className="mt-3 text-[2rem] sm:text-[2.6rem] lg:text-[3.25rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
            Find out which version of your job post works.
          </h2>
          <p className="mx-auto mt-5 max-w-[600px] text-[16px] leading-relaxed text-pretty text-muted">
            Post the same job twice on one job site, worded or paid differently. Every applicant is scored against what
            the job needs, so you can see which version brings more strong candidates for what the site charges you.
          </p>
        </div>

        <div ref={ref} className={cx("reveal relative mt-14 sm:mt-16", run && "is-in")}>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 rounded-[48px] opacity-80 blur-[60px]"
            style={{
              background:
                "radial-gradient(60% 50% at 70% 40%, color-mix(in oklch, var(--primary) 16%, transparent), transparent), radial-gradient(40% 40% at 20% 70%, color-mix(in oklch, var(--tier-a) 10%, transparent), transparent)",
            }}
          />
          <div className="rounded-[22px] bg-card/55 p-2 shadow-lift backdrop-blur-sm">
            <div className="rounded-[16px] bg-canvas p-3 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
                <span className="text-[14px] font-semibold tracking-[-0.01em]">{role.title}</span>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                  <span className="size-1.5 rounded-full" style={{ background: board.color }} />
                  {board.name}
                </span>
                <span className="text-[12.5px] text-faint">${A.spend} per post, paid to the job site</span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <Equal className="size-3.5" /> Same site, same fee, same {A.daysLive} days
                </span>
              </div>

              <div className="relative grid gap-3 md:grid-cols-2">
                <Variant l={A} run={run} />
                <Variant l={B} win run={run} />
                <span className="absolute top-1/2 left-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-card text-[11px] font-semibold text-muted shadow-raised md:grid">
                  vs
                </span>
              </div>

              {/* The verdict */}
              <div className="mt-3 grid items-center gap-6 rounded-panel bg-card p-5 shadow-card sm:p-6 md:grid-cols-[auto_1fr] md:gap-10">
                <div>
                  <div className="text-[12px] font-medium text-muted">For the same fee, version B brought</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="violet-grad tnum text-[56px] sm:text-[72px] lg:text-[84px] leading-[0.9] font-semibold tracking-[-0.055em]">
                      {lift.toFixed(1)}×
                    </span>
                  </div>
                  <div className="mt-2 text-[14px] font-medium tracking-[-0.01em]">as many strong candidates</div>
                </div>
                <div className="space-y-4">
                  {[B, A].map((l, i) => (
                    <div key={l.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12.5px]">
                        <span>
                          <span className="font-medium">Version {l.variant}</span>{" "}
                          <span className="text-muted">· pays {l.payBand}</span>
                        </span>
                        <span className="tnum text-muted">
                          <span className="font-medium text-foreground">{perHundred(l).toFixed(1)}</span> strong per $100 spent
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-inset">
                        <div
                          className="grow-x h-full rounded-full"
                          style={{
                            width: `${(perHundred(l) / max) * 100}%`,
                            background: i === 0 ? "linear-gradient(90deg, oklch(0.62 0.2 290), var(--primary))" : "var(--rim-strong)",
                            ["--d" as string]: i === 0 ? "700ms" : "550ms",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="fade-in text-[13px] leading-relaxed text-pretty text-muted" style={{ ["--d" as string]: "1300ms" }}>
                    Version A got {(A.applies / B.applies).toFixed(1)} times the applicants, but {A.tierMix.C}% of them
                    were a poor fit. Version B got half as many and {aCount(B)} you would actually interview. Counting
                    applicants alone would have picked the wrong one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {[
            ["Change one thing at a time", "Pay, title, wording or job site. Keep the rest of the post the same, so you know what made the difference."],
            ["Every applicant is scored", "You set what a strong candidate looks like once. Each applicant is placed in tier A, B or C as they apply."],
            ["Only the job site costs money", "recruited is free. What you pay a job site to post goes in with the post, so you see what each strong candidate cost."],
          ].map(([t, d], i) => (
            <div key={t} className="reveal" style={{ ["--d" as string]: `${i * 90}ms` }}>
              <div className="text-[14px] font-semibold tracking-[-0.01em]">{t}</div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
