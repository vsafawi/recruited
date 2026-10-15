import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Check, Copy, Megaphone, PencilLine, Server, ShieldCheck, Trophy, Waypoints } from "lucide-react";
import { ButtonLink, GithubIcon, TierBadge, cx } from "@/components/ui";
import { Mark3D, Wordmark } from "@/components/mark";
import { BOARDS, LISTINGS, ROLES, aTierPerDollar, listingById, totals } from "@/data/mock";

export const GITHUB = "https://github.com/vsafawi/recruited";

/* --- Nav ----------------------------------------------------------------- */

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <nav
        className={cx(
          "mx-auto flex h-12 max-w-[1120px] items-center gap-2 rounded-[14px] pr-1.5 pl-3.5 transition-[background,box-shadow,backdrop-filter] duration-300 ease-settle",
          scrolled ? "bg-card/75 shadow-raised backdrop-blur-xl backdrop-saturate-150" : "bg-transparent",
        )}
      >
        <a href="#top" className="mr-3" aria-label="recruited.tools home">
          <Wordmark className="text-[14.5px]" />
        </a>
        <div className="hidden items-center md:flex">
          {[
            ["Product", "#product"],
            ["How it works", "#how"],
            ["Pricing", "#deploy"],
          ].map(([l, h]) => (
            <a key={h} href={h} className="rounded-control px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-[var(--wash)] hover:text-foreground">
              {l}
            </a>
          ))}
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="rounded-control px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-[var(--wash)] hover:text-foreground"
          >
            GitHub
          </a>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label="recruited on GitHub"
            className="grid size-8.5 place-items-center rounded-control text-muted transition-colors hover:bg-[var(--wash)] hover:text-foreground md:hidden"
          >
            <GithubIcon className="size-4" />
          </a>
          <ButtonLink to="/demo" variant="ink">
            Open the demo
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}

/* --- Board strip --------------------------------------------------------- */

const MORE_BOARDS = ["LinkedIn", "Wellfound", "Craigslist", "Upwork", "Your careers page"];

export function BoardStrip() {
  const live = BOARDS.map((b) => b.name);
  return (
    <section className="px-4 pt-10 pb-6 sm:pt-16">
      <div className="reveal mx-auto max-w-[1000px] text-center">
        <div className="text-[12.5px] font-medium text-faint">Works with the job sites you already use</div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {live.map((n, i) => {
            const b = BOARDS[i];
            return (
              <span
                key={n}
                className="fade-in inline-flex h-9 items-center gap-2 rounded-full bg-card px-3.5 text-[13.5px] font-medium tracking-[-0.01em] shadow-card"
                style={{ ["--d" as string]: `${i * 70}ms` }}
              >
                <span className="size-2 rounded-full" style={{ background: b.color }} />
                {n}
              </span>
            );
          })}
          {MORE_BOARDS.map((n, i) => (
            <span
              key={n}
              className="fade-in inline-flex h-9 items-center rounded-full px-3.5 text-[13.5px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]"
              style={{ ["--d" as string]: `${(live.length + i) * 70}ms` }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- How it works -------------------------------------------------------- */

const STEP_TONES = ["sky", "lavender", "mint"] as const;

export function HowItWorks() {
  const l2 = listingById("l2");
  const steps = [
    {
      icon: PencilLine,
      title: "Describe the job",
      body: "The title, the pay, and what a strong candidate looks like. You do this once per job.",
      mock: (
        <div className="space-y-1.5 text-[11.5px]">
          <div className="rounded-[7px] bg-card px-2.5 py-1.5 font-medium shadow-card">{ROLES[0].title}</div>
          <div className="flex gap-1.5">
            <span className="rounded-[7px] bg-card px-2.5 py-1.5 text-muted shadow-card">{ROLES[0].location}</span>
            <span className="rounded-[7px] bg-card px-2.5 py-1.5 text-muted shadow-card">{ROLES[0].target}</span>
          </div>
        </div>
      ),
    },
    {
      icon: Megaphone,
      title: "Post two versions",
      body: "Write the post two ways and pick the job sites. Each applicant is marked with the version that brought them.",
      mock: (
        <div className="space-y-1.5 text-[11.5px]">
          {LISTINGS.filter((l) => l.roleId === "va-ops").map((l) => (
            <div key={l.id} className="flex items-center gap-2 rounded-[7px] bg-card px-2.5 py-1.5 shadow-card">
              <span className="grid size-4 place-items-center rounded-[4px] bg-inset font-mono text-[10px]">{l.variant}</span>
              <span className="truncate text-muted">{l.payBand}</span>
              <span className="ml-auto text-faint">OnlineJobs.ph</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Trophy,
      title: "Keep what works",
      body: "Keep the version and the sites that bring strong candidates for the least money. Pause the rest.",
      mock: (
        <div className="flex items-center gap-2 rounded-[7px] bg-card px-2.5 py-2 text-[11.5px] shadow-card">
          <TierBadge tier="A" />
          <span className="truncate">
            Version {l2.variant} · {(aTierPerDollar(l2) * 100).toFixed(1)} strong per $100
          </span>
          <Check className="ml-auto size-3.5 text-success" />
        </div>
      ),
    },
  ];
  return (
    <section id="how" className="band band-peach scroll-mt-20 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-[1120px]">
        <div className="reveal max-w-[600px]">
          <div className="text-[12.5px] font-medium" style={{ color: "var(--peach-ink)" }}>How it works</div>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
            Three steps, then you know.
          </h2>
        </div>
        <ol className="relative mt-12 grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="reveal flex flex-col rounded-[18px] bg-card p-5 shadow-card" style={{ ["--d" as string]: `${i * 110}ms` }}>
              <div className="flex items-center gap-2.5">
                <span className={`tone tone-${STEP_TONES[i]} tnum size-8 rounded-full text-[13px] font-semibold`}>{i + 1}</span>
                <s.icon className="size-4 text-faint" />
              </div>
              <div className="mt-4 text-[15px] font-semibold tracking-[-0.015em]">{s.title}</div>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
              <div className="mt-5 rounded-card bg-canvas p-2.5">{s.mock}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --- Pricing and hosting ------------------------------------------------ */

const PROMISES = [
  { icon: BadgeCheck, tone: "mint", title: "Free to use", body: "No plans, no per-seat pricing, no trial that runs out. The whole product is free." },
  { icon: Server, tone: "sky", title: "Run it on your own site", body: "Put it on any web host you already pay for. The setup steps are on GitHub." },
  { icon: ShieldCheck, tone: "lavender", title: "Candidate details stay with you", body: "Applicants’ information lives where you host it, not on someone else’s servers." },
] as const;

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy command"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }, () => {});
      }}
      className="grid size-7 shrink-0 place-items-center rounded-[7px] text-faint transition-colors hover:bg-[var(--wash)] hover:text-foreground"
    >
      {done ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function Deploy() {
  const clone = `git clone ${GITHUB} && cd recruited && npm i && npm run build`;
  return (
    <section id="deploy" className="scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-[1120px]">
        <div className="reveal mx-auto max-w-[640px] text-center">
          <div className="text-[12.5px] font-medium text-primary">Pricing</div>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
            Free, and yours to keep.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-pretty text-muted">
            recruited is open source. Use it as it is, or run it on your own website. The only money you spend is what
            job sites charge to post.
          </p>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {PROMISES.map((p, i) => (
            <div key={p.title} className="reveal rounded-[18px] bg-card p-6 shadow-card" style={{ ["--d" as string]: `${i * 90}ms` }}>
              <span className={`tone tone-${p.tone} size-10 rounded-[12px]`}>
                <p.icon className="size-5" />
              </span>
              <div className="mt-4 text-[15.5px] font-semibold tracking-[-0.015em]">{p.title}</div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-pretty text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="reveal mx-auto mt-8 flex max-w-[760px] flex-col items-center gap-3 text-center">
          <p className="text-[13px] leading-relaxed text-pretty text-faint">
            Today recruited runs on sample data, so nothing you change in the demo is saved. Saving to a database is next
            on the roadmap.
          </p>
          <details className="group w-full max-w-[560px] text-left">
            <summary className="mx-auto w-fit cursor-pointer list-none rounded-control px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-[var(--wash)] hover:text-foreground">
              For developers: set it up yourself
            </summary>
            <div className="mt-3 rounded-panel bg-card p-4 shadow-card">
              <p className="text-[12.5px] leading-relaxed text-muted">
                It builds to a static site. Deploy files for Cloudflare Pages, Vercel, Netlify, Railway and Docker are in
                the repository.
              </p>
              <div className="mt-3 flex items-center gap-1 rounded-[9px] bg-inset py-1 pr-1 pl-3 shadow-[inset_0_0_0_1px_var(--rim)]">
                <code className="min-w-0 flex-1 truncate font-mono text-[11.5px]" title={clone}>
                  {clone}
                </code>
                <CopyButton text={clone} />
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

/* --- Case study ---------------------------------------------------------- */

export function CaseStudy() {
  const t = totals();
  const l2 = listingById("l2");
  const l1 = listingById("l1");
  const l3 = listingById("l3");
  const lift = aTierPerDollar(l2) / aTierPerDollar(l1);
  const stats = [
    [ROLES.length, "jobs open"],
    [LISTINGS.length, "job posts"],
    [BOARDS.length, "job sites"],
    [t.applies, "applicants scored"],
  ] as const;
  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="reveal mx-auto max-w-[1120px] overflow-hidden rounded-[22px] bg-card shadow-raised">
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <div className="p-6 sm:p-10">
            <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
              <Waypoints className="size-3.5 text-primary" /> In use
            </div>
            <p className="mt-4 text-[clamp(1.5rem,3.4vw,2.25rem)] leading-[1.15] font-semibold tracking-[-0.035em] text-balance">
              Music Market Agency runs seven job posts on four job sites with it.
            </p>
            <p className="mt-4 max-w-[520px] text-[14.5px] leading-relaxed text-pretty text-muted">
              A music marketing agency hiring an operations VA, an artist campaign manager and a playlist pitching
              coordinator. The demo shows their search: the jobs, the posts and the sites.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {stats.map(([n, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="tnum text-[28px] leading-none font-semibold tracking-[-0.04em]">{n}</dd>
                  <div className="mt-1.5 text-[12px] text-muted">{l}</div>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-2.5 border-t border-rim bg-canvas p-6 sm:p-10 lg:border-t-0 lg:border-l">
            <div className="text-[12px] font-medium text-faint">What they learned</div>
            {[
              {
                k: "Kept",
                tone: "var(--success)",
                text: `Offering ${l2.payBand.replace(" / mo", " a month")} on OnlineJobs.ph drew half the applicants of ${l1.payBand.replace(" / mo", " a month")}, and ${lift.toFixed(1)} times the strong candidates for the same fee.`,
              },
              {
                k: "Paused",
                tone: "var(--destructive)",
                text: `Indeed with the salary hidden: ${l3.applies} applicants, ${l3.tierMix.C}% of them a poor fit.`,
              },
              {
                k: "Learned",
                tone: "var(--primary)",
                text: `Music Business Worldwide brought the fewest applicants of any post, ${listingById("l5").applies}, and the highest share of strong ones, ${listingById("l5").tierMix.A}%.`,
              },
            ].map((r) => (
              <div key={r.k} className="rounded-card bg-card p-3.5 shadow-card">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: r.tone }}>
                  {r.k}
                </span>
                <p className="mt-1 text-[13.5px] leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Final CTA + footer -------------------------------------------------- */

export function FinalCta() {
  return (
    <section className="band band-mint relative mb-12 overflow-hidden px-4 py-20 sm:py-24">
      <div className="reveal relative mx-auto flex max-w-[640px] flex-col items-center text-center">
        <Mark3D size={80} />
        <h2 className="mt-10 text-[clamp(2.1rem,5.5vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
          Run your next hire in it.
        </h2>
        <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-pretty text-muted">
          The demo is the whole product, filled with an example company’s hiring. No sign-up needed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <ButtonLink to="/demo" variant="primary" size="lg">
            Open the demo <ArrowRight className="size-4" />
          </ButtonLink>
          <ButtonLink to={GITHUB} size="lg">
            <GithubIcon className="size-4" /> View on GitHub
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-rim px-4 py-10">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 sm:flex-row sm:items-center">
        <div>
          <Wordmark className="text-[14px]" />
          <p className="mt-2 text-[12.5px] text-faint">Free, open-source hiring software for small teams.</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted sm:ml-auto">
          <Link to="/demo" className="hover:text-foreground">
            Open the demo
          </Link>
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#deploy" className="hover:text-foreground">
            Pricing
          </a>
          <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <GithubIcon className="size-3.5" /> GitHub
          </a>
          <a href={`${GITHUB}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-foreground">
            MIT license
          </a>
        </div>
      </div>
    </footer>
  );
}
