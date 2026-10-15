import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Cloud, Container, Copy, Database, Megaphone, PencilLine, TrainFront, Triangle, Trophy, Waypoints } from "lucide-react";
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
            ["Deploy", "#deploy"],
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
    <section id="how" className="scroll-mt-20 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-[1120px]">
        <div className="reveal max-w-[600px]">
          <div className="text-[12.5px] font-medium text-primary">How it works</div>
          <h2 className="mt-3 text-[2rem] sm:text-[2.6rem] lg:text-[3.25rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
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

/* --- Deploy -------------------------------------------------------------- */

const TARGETS = [
  { icon: Cloud, name: "Cloudflare Pages", note: "Static, on the edge. wrangler.toml is in the repo.", cmd: "npx wrangler pages deploy" },
  { icon: TrainFront, name: "Railway", note: "Builds the Dockerfile and serves it with Caddy.", cmd: "railway up" },
  { icon: Triangle, name: "Vercel", note: "vercel.json sets the build and the SPA rewrite.", cmd: "npx vercel --prod" },
  { icon: Container, name: "Docker", note: "Any box with Docker. Fly, Render, a VPS.", cmd: "docker build -t recruited . && docker run -p 8080:8080 recruited" },
  { icon: Database, name: "Supabase", note: "Postgres for the backend. On the roadmap, not wired in yet.", cmd: "npx supabase init", soon: true },
];

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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div className="reveal min-w-0">
            <div className="text-[12.5px] font-medium text-primary">Deploy</div>
            <h2 className="mt-3 text-[2rem] sm:text-[2.6rem] lg:text-[3.25rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
              Your data, your server.
            </h2>
            <p className="mt-5 max-w-[460px] text-[16px] leading-relaxed text-pretty text-muted">
              Clone it, build it, put it anywhere that serves a static site. Candidate data never has to leave
              infrastructure you control.
            </p>
            <p className="mt-4 max-w-[460px] text-[13.5px] leading-relaxed text-pretty text-faint">
              Today recruited is a static frontend running on sample data, so nothing you click in the demo is saved.
              A Supabase Postgres backend is next on the roadmap.
            </p>

            <div className="mt-8 overflow-hidden rounded-panel bg-card shadow-raised">
              <div className="flex items-center gap-1.5 border-b border-rim bg-canvas px-3.5 py-2.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2 rounded-full bg-rim-strong/70" />
                ))}
                <span className="ml-2 font-mono text-[11px] text-faint">terminal</span>
              </div>
              <div className="flex items-start gap-2 p-4">
                <pre className="min-w-0 flex-1 font-mono text-[12.5px] leading-[1.75] whitespace-pre-wrap [overflow-wrap:anywhere]">
                  <span className="text-faint">$ </span>git clone {GITHUB}
                  {"\n"}
                  <span className="text-faint">$ </span>cd recruited && npm i
                  {"\n"}
                  <span className="text-faint">$ </span>npm run build
                  {"\n"}
                  <span className="text-success">✓ built in dist/</span>
                </pre>
                <CopyButton text={clone} />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 content-start gap-2.5 sm:grid-cols-2">
            {TARGETS.map((t, i) => (
              <div
                key={t.name}
                className={cx("reveal flex flex-col rounded-panel bg-card p-4 shadow-card", i === TARGETS.length - 1 && "sm:col-span-2")}
                style={{ ["--d" as string]: `${i * 70}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-[9px] bg-inset text-foreground shadow-[inset_0_0_0_1px_var(--rim)]">
                    <t.icon className="size-4" />
                  </span>
                  <span className="text-[14px] font-semibold tracking-[-0.01em]">{t.name}</span>
                  {t.soon && <span className="ml-auto rounded-chip bg-inset px-1.5 py-0.5 text-[10.5px] font-medium text-muted">Roadmap</span>}
                </div>
                <p className="mt-2.5 flex-1 text-[12.5px] leading-relaxed text-muted">{t.note}</p>
                <div className="mt-3 flex items-center gap-1 rounded-[9px] bg-inset py-1 pr-1 pl-3 shadow-[inset_0_0_0_1px_var(--rim)]">
                  <code className="min-w-0 flex-1 truncate font-mono text-[11.5px]" title={t.cmd}>
                    {t.cmd}
                  </code>
                  <CopyButton text={t.cmd} />
                </div>
              </div>
            ))}
          </div>
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
            <p className="mt-4 text-[1.5rem] sm:text-[1.9rem] lg:text-[2.25rem] leading-[1.15] font-semibold tracking-[-0.035em] text-balance">
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
    <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:pt-28">
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_50%_60%_at_50%_45%,#000,transparent)]" />
      <div className="reveal relative mx-auto flex max-w-[640px] flex-col items-center text-center">
        <Mark3D size={96} />
        <h2 className="mt-10 text-[2.1rem] sm:text-[2.8rem] lg:text-[3.5rem] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
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
            Deploy
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
