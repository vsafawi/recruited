import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, Copy } from "lucide-react";
import { ButtonLink, GithubIcon, SectionLabel, Segmented, Tag } from "@/components/ui";
import { Wordmark } from "@/components/mark";
import { BOARDS, CANDIDATES, LISTINGS, ROLES, totals } from "@/data/mock";
import { ApplyMock, InboxMock, InterviewLoopMock, RubricMock } from "./Bento";
import { ENTRIES, GITHUB } from "./Hero";
import { PipelineMock } from "./PipelineMock";
import { SplitTestMock } from "./SplitTest";
import { useFit } from "./hooks";

export { GITHUB };

/* --- Catalogue entry ----------------------------------------------------- */

/** One numbered entry: a quiet heading, then a hairline card holding a small live mock. */
function Entry({
  id,
  desc,
  action,
  children,
}: {
  id: (typeof ENTRIES)[number]["id"];
  desc: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const n = ENTRIES.findIndex((e) => e.id === id) + 1;
  return (
    <section id={id} className="scroll-mt-4 border-b rule-dashed px-4 py-10 sm:px-8 lg:py-12">
      <div className="reveal">
        <div className="flex items-start gap-3">
          <SectionLabel n={n} title={ENTRIES[n - 1].title} className="min-w-0 flex-1">
            {desc}
          </SectionLabel>
          {action}
        </div>
        <div className="mt-4 flex min-h-[320px] items-center justify-center rounded-panel bg-card px-3 py-6 shadow-card sm:px-8 sm:py-8">
          {children}
        </div>
      </div>
    </section>
  );
}

function DemoLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-6.5 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] text-muted shadow-[inset_0_0_0_1px_var(--rim)] transition-colors hover:bg-[var(--wash)] hover:text-foreground"
    >
      {children} <ArrowUpRight className="size-3" />
    </Link>
  );
}

/* --- The scenario strip -------------------------------------------------- */

export function Scenario() {
  const t = totals();
  const stats = [
    [ROLES.length, "roles open"],
    [LISTINGS.length, "listings live"],
    [BOARDS.length, "boards"],
    [t.applies, "applicants scored"],
    [`$${t.spend}`, "spent"],
  ] as const;
  return (
    <section className="border-b rule-dashed px-4 py-8 sm:px-8">
      <div className="reveal">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Tag color="var(--primary)">Sample data</Tag>
          Music Market Agency, a music marketing agency, hiring per position
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-x-4 gap-y-4 sm:grid-cols-5">
          {stats.map(([n, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="tnum font-mono text-[20px] leading-none font-medium">{n}</dd>
              <div className="mt-1.5 text-[12px] text-muted">{l}</div>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {BOARDS.map((b) => (
            <Tag key={b.id} color={b.color}>
              <span className="size-1.5 rounded-full" style={{ background: b.color }} />
              {b.name}
            </Tag>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- 01 Split tests ------------------------------------------------------ */

export function SplitTests() {
  return (
    <Entry id="split-tests" desc="See which listing brings A-tier candidates per dollar." action={<DemoLink to="/demo">Listings</DemoLink>}>
      <SplitTestMock />
    </Entry>
  );
}

/* --- 02 Pipeline --------------------------------------------------------- */

const DESIGN_W = 1080;
const DESIGN_H = 560;

function BoardFrame() {
  const [fitRef, fit] = useFit(DESIGN_W, 620);
  return (
    <div ref={fitRef} className="frame-fade w-full overflow-hidden rounded-card shadow-card" style={{ height: DESIGN_H * fit.scale }}>
      <div style={{ width: fit.w, height: DESIGN_H, transform: `scale(${fit.scale})`, transformOrigin: "0 0" }}>
        <PipelineMock width={fit.w} />
      </div>
    </div>
  );
}

export function Pipeline() {
  const [view, setView] = useState<"board" | "inbox" | "rubric">("board");
  return (
    <Entry
      id="pipeline"
      desc="Every applicant from every board in one place, scored A, B or C."
      action={<DemoLink to="/demo/pipeline">Pipeline</DemoLink>}
    >
      <div className="flex w-full flex-col items-center gap-5">
        <div key={view} className="panel-in flex w-full justify-center">
          {view === "board" && <BoardFrame />}
          {view === "inbox" && <InboxMock />}
          {view === "rubric" && <RubricMock />}
        </div>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { id: "board", label: "Board" },
            { id: "inbox", label: "Inbox", count: CANDIDATES.length },
            { id: "rubric", label: "Rubric", count: 3 },
          ]}
        />
      </div>
    </Entry>
  );
}

/* --- 03 Interview loop --------------------------------------------------- */

export function InterviewLoop() {
  return (
    <Entry
      id="interview-loop"
      desc="Every round leaves a scorecard, so the next interviewer starts with the full picture."
      action={<DemoLink to="/demo/candidates/c2">Jomar's profile</DemoLink>}
    >
      <InterviewLoopMock />
    </Entry>
  );
}

/* --- 04 Apply page ------------------------------------------------------- */

export function ApplyPage() {
  return (
    <Entry
      id="apply-page"
      desc="One link per board and variant. Every applicant arrives tagged with where they came from."
      action={<DemoLink to="/jobs/l2">Apply page</DemoLink>}
    >
      <ApplyMock />
    </Entry>
  );
}

/* --- 05 Deploy ----------------------------------------------------------- */

const TARGETS = [
  { id: "cloudflare", name: "Cloudflare", note: "Static, on the edge. wrangler.toml is in the repo.", cmd: "npx wrangler pages deploy" },
  { id: "railway", name: "Railway", note: "Builds the Dockerfile and serves it with Caddy.", cmd: "railway up" },
  { id: "vercel", name: "Vercel", note: "vercel.json sets the build and the SPA rewrite.", cmd: "npx vercel --prod" },
  { id: "docker", name: "Docker", note: "Any box with Docker. Fly, Render, a VPS.", cmd: "docker build -t recruited . && docker run -p 8080:8080 recruited" },
  { id: "supabase", name: "Supabase", note: "Postgres for the backend. On the roadmap, not wired in yet.", cmd: "npx supabase init" },
] as const;

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy command"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1400);
          },
          () => {},
        );
      }}
      className="grid size-7 shrink-0 place-items-center rounded-[7px] text-faint transition-colors hover:bg-[var(--wash)] hover:text-foreground"
    >
      {done ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function Deploy() {
  const [target, setTarget] = useState<(typeof TARGETS)[number]["id"]>("cloudflare");
  const t = TARGETS.find((x) => x.id === target)!;
  const all = `git clone ${GITHUB} && cd recruited && npm i && npm run build && ${t.cmd}`;
  return (
    <Entry
      id="deploy"
      desc="Clone it, build it, serve it from anywhere that hosts a static site."
      action={
        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-full px-2 text-[12px] text-muted shadow-[inset_0_0_0_1px_var(--rim)] transition-colors hover:bg-[var(--wash)] hover:text-foreground"
        >
          <GithubIcon className="size-3" /> GitHub
        </a>
      }
    >
      <div className="flex w-full flex-col items-center gap-5">
        <div className="w-full max-w-[600px] overflow-hidden rounded-card bg-background shadow-card">
          <div className="flex items-center gap-1.5 border-b border-rim px-3.5 py-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full bg-rim-strong" />
            ))}
            <span className="ml-2 font-mono text-[11px] text-faint">terminal</span>
            <span className="ml-auto">
              <CopyButton text={all} />
            </span>
          </div>
          <pre className="p-4 font-mono text-[12px] leading-[1.8] whitespace-pre-wrap [overflow-wrap:anywhere]">
            <span className="text-faint">$ </span>git clone {GITHUB}
            {"\n"}
            <span className="text-faint">$ </span>cd recruited && npm i && npm run build
            {"\n"}
            <span className="text-success">✓ built in dist/</span>
            {"\n"}
            <span key={t.id} className="panel-in inline">
              <span className="text-faint">$ </span>
              {t.cmd}
            </span>
          </pre>
          <div className="border-t border-rim px-4 py-2.5 text-[12px] text-muted">
            {t.id === "supabase" && <Tag className="mr-1.5">Roadmap</Tag>}
            {t.note}
          </div>
        </div>
        <Segmented value={target} onChange={setTarget} options={TARGETS.map((x) => ({ id: x.id, label: x.name }))} className="max-w-full overflow-x-auto" />
        <p className="max-w-[520px] text-center text-[12px] leading-relaxed text-pretty text-faint">
          Today recruited is a static frontend running on sample data, so candidate data never has to leave infrastructure
          you control. A Supabase Postgres backend is next on the roadmap.
        </p>
      </div>
    </Entry>
  );
}

/* --- Closing + footer ---------------------------------------------------- */

export function Closing() {
  return (
    <section className="border-b rule-dashed px-4 py-12 sm:px-8">
      <div className="reveal flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Run your next hire in it.</h2>
          <p className="mt-1 text-[13px] text-muted">The demo is the whole product on sample data. Open it, drag a candidate, read the split test.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/demo" variant="primary">
            Open the demo <ArrowRight className="size-3.5" />
          </ButtonLink>
          <ButtonLink to={GITHUB}>
            <GithubIcon className="size-3.5" /> Star on GitHub
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div>
          <Wordmark className="text-[13px]" />
          <p className="mt-1.5 text-[12px] text-faint">The open-source applicant tracker for small teams. MIT licensed.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-muted sm:ml-auto">
          <Link to="/demo" className="hover:text-foreground">
            Open the demo
          </Link>
          <a href="#split-tests" className="hover:text-foreground">
            Split tests
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
