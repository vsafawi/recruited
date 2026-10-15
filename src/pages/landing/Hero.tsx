import { useEffect, useRef } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { ButtonLink, TierBadge, TierBar } from "@/components/ui";
import { Mark3D } from "@/components/mark";
import { aTierPerDollar, candidateById, listingById } from "@/data/mock";
import { prefersReducedMotion, useFit } from "./hooks";
import { CandidateCard, PipelineMock } from "./PipelineMock";

const A = listingById("l1");
const B = listingById("l2");
export const LIFT = aTierPerDollar(B) / aTierPerDollar(A);

const DESIGN_W = 1180;
const DESIGN_H = 660;

export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const [fitRef, fit] = useFit(DESIGN_W, 620);

  // One rAF loop: scroll settles the tilt flat, the pointer leans the stage.
  useEffect(() => {
    const el = stage.current;
    if (!el || prefersReducedMotion()) return;
    const fine = matchMedia("(pointer: fine)").matches;
    let raf = 0;
    let tp = 0, cp = -1, tx = 0, ty = 0, cx = 0, cy = 0;
    const tick = () => {
      cp = cp < 0 ? tp : cp + (tp - cp) * 0.14;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--rx", `${(14 * (1 - cp) - cy * 2.5).toFixed(3)}deg`);
      el.style.setProperty("--ry", `${(cx * 3).toFixed(3)}deg`);
      el.style.setProperty("--sc", (0.94 + 0.06 * cp).toFixed(4));
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      const moving = Math.abs(tp - cp) + Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0008;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      tp = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.55)));
      kick();
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const jasmine = candidateById("c8")!;
  const liza = candidateById("c7")!;

  return (
    <section className="relative overflow-x-clip pt-24 sm:pt-32">
      <div aria-hidden className="dot-grid dot-fade pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[420px] left-1/2 h-[520px] w-[min(1100px,140vw)] -translate-x-1/2 rounded-full opacity-70 blur-[80px]"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklch, var(--primary) 22%, transparent), transparent)" }}
      />

      <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-4 text-center">
        <div className="rise" style={{ ["--d" as string]: "0ms" }}>
          <Mark3D size={76} />
        </div>
        <a
          href="#split-tests"
          className="rise mt-8 inline-flex h-7 items-center gap-2 rounded-full bg-card/80 pr-3 pl-1 text-[12.5px] text-muted shadow-card backdrop-blur transition-colors hover:text-foreground"
          style={{ ["--d" as string]: "80ms" }}
        >
          <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-medium text-primary">New</span>
          Split tests for job listings
          <ArrowRight className="size-3" />
        </a>
        <h1
          className="rise mt-5 text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance"
          style={{ ["--d" as string]: "140ms" }}
        >
          <span className="ink-grad">Hire the right person, </span>
          <span className="text-faint">not the most applications.</span>
        </h1>
        <p
          className="rise mt-6 max-w-[600px] text-[clamp(15px,2vw,17.5px)] leading-[1.55] text-pretty text-muted"
          style={{ ["--d" as string]: "220ms" }}
        >
          One applicant tracker for every board you post on. Split-test your listings to see which board and which
          wording bring the candidates worth hiring, and what each one costs you.
        </p>
        <div className="rise mt-8 flex flex-wrap items-center justify-center gap-2.5" style={{ ["--d" as string]: "300ms" }}>
          <ButtonLink to="/demo" variant="primary" size="lg">
            Open the live demo <ArrowRight className="size-4" />
          </ButtonLink>
          <a
            href="#deploy"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-control bg-card px-5 text-[14.5px] font-medium shadow-card transition-colors hover:bg-inset"
          >
            Deploy in five minutes
          </a>
        </div>
        <p className="rise mt-4 text-[12.5px] text-faint" style={{ ["--d" as string]: "360ms" }}>
          Open source · MIT · No account needed for the demo
        </p>
      </div>

      {/* The product, tilted back and settling flat as you scroll. */}
      <div className="frame-in relative mx-auto mt-12 max-w-[1240px] px-4 sm:mt-16 sm:px-8">
        <div style={{ perspective: "2000px", perspectiveOrigin: "50% 0%" }}>
          <div ref={stage} className="hero-stage relative">
            <div className="rounded-[22px] bg-card/60 p-1.5 shadow-lift backdrop-blur-sm sm:p-2">
              <div ref={fitRef} className="overflow-hidden rounded-[16px] shadow-card" style={{ height: DESIGN_H * fit.scale }}>
                <div style={{ width: fit.w, height: DESIGN_H, transform: `scale(${fit.scale})`, transformOrigin: "0 0" }}>
                  <PipelineMock width={fit.w} />
                </div>
              </div>
            </div>

            {/* Floating cards at different depths. */}
            <div
              className="hero-float absolute top-[14%] -left-6 hidden w-[250px] md:block lg:-left-14"
              style={{ ["--z" as string]: "90px", ["--k" as string]: "-10" }}
            >
              <div className="float-in" style={{ ["--d" as string]: "1000ms" }}>
                <div className="mb-1.5 flex items-center gap-1.5 pl-1 text-[11px] font-medium text-muted">
                  <span className="size-1.5 rounded-full" style={{ background: "var(--stage-offer)" }} />
                  Moved to Offer
                </div>
                <CandidateCard c={jasmine} className="shadow-overlay" />
              </div>
            </div>

            <div
              className="hero-float absolute top-[6%] -right-4 hidden w-[272px] md:block lg:-right-12"
              style={{ ["--z" as string]: "150px", ["--k" as string]: "-16" }}
            >
              <div className="float-in rounded-panel bg-card p-4 shadow-overlay" style={{ ["--d" as string]: "1150ms" }}>
                <div className="flex items-center gap-2 text-[11.5px] font-medium text-muted">
                  <Trophy className="size-3.5 text-success" />
                  Split test · OnlineJobs.ph
                  <span className="ml-auto rounded-chip bg-[color-mix(in_oklch,var(--success)_12%,transparent)] px-1.5 py-0.5 text-[10.5px] text-success">
                    Winner
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[34px] leading-none font-semibold tracking-[-0.04em]">{LIFT.toFixed(1)}×</span>
                  <span className="text-[12px] leading-tight text-muted">
                    more A-tier
                    <br />
                    per dollar
                  </span>
                </div>
                <div className="mt-3.5 space-y-2.5">
                  {[
                    { l: B, label: "B · $950" },
                    { l: A, label: "A · $600" },
                  ].map(({ l, label }) => (
                    <div key={l.id}>
                      <div className="mb-1 flex justify-between text-[11px] text-muted">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="tnum">{l.tierMix.A}% tier A</span>
                      </div>
                      <TierBar mix={l.tierMix} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="hero-float absolute -bottom-6 left-[8%] hidden md:block"
              style={{ ["--z" as string]: "120px", ["--k" as string]: "-13" }}
            >
              <div
                className="float-in flex items-center gap-2.5 rounded-full bg-card py-1.5 pr-4 pl-1.5 shadow-overlay"
                style={{ ["--d" as string]: "1300ms" }}
              >
                <span className="relative grid size-7 place-items-center rounded-full bg-primary-tint text-[11px] font-semibold text-primary">
                  86
                </span>
                <span className="text-[12.5px]">
                  <span className="font-medium">{liza.name}</span> <span className="text-muted">scored from her application</span>
                </span>
                <TierBadge tier="A" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
