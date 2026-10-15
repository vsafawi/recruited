import { useRef, type PointerEvent, type ReactNode } from "react";
import { ChartNoAxesColumn, ClipboardCheck, Inbox, Quote, Sparkles, SquareKanban, Star } from "lucide-react";
import { Avatar, TierBadge, cx } from "@/components/ui";
import { BOARDS, CANDIDATES, LISTINGS, TIER_COLOR, TIER_LABEL, boardById, candidateById, listingById } from "@/data/mock";
import { BoardChip } from "./PipelineMock";

function Tile({
  icon: Icon,
  title,
  body,
  children,
  className,
  d = 0,
  tone = "sky",
}: {
  icon: typeof Inbox;
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  d?: number;
  tone?: "peach" | "mint" | "lavender" | "sky" | "butter";
}) {
  return (
    <div
      className={cx("spot reveal flex flex-col overflow-hidden rounded-[18px] bg-card shadow-card", className)}
      style={{ ["--d" as string]: `${d}ms` }}
    >
      <div className="relative flex min-h-[200px] flex-1 flex-col justify-center overflow-hidden border-b border-rim bg-[linear-gradient(180deg,var(--canvas),var(--background))] p-5">
        {children}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2.5 text-[14.5px] font-semibold tracking-[-0.015em]">
          <span className={`tone tone-${tone} size-7 shrink-0`}>
            <Icon className="size-3.5" />
          </span>
          {title}
        </div>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-pretty text-muted">{body}</p>
      </div>
    </div>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/* --- mini mocks ---------------------------------------------------------- */

function InboxMock() {
  const recent = [...CANDIDATES].sort((a, b) => a.appliedDaysAgo - b.appliedDaysAgo).slice(0, 5);
  return (
    <div className="mx-auto w-full max-w-[560px] space-y-1.5">
      {recent.map((c, i) => {
        const b = boardById(listingById(c.listingId).board);
        return (
          <div
            key={c.id}
            className="fade-in flex items-center gap-2.5 rounded-card bg-card px-3 py-2 shadow-card"
            style={{ ["--d" as string]: `${250 + i * 110}ms` }}
          >
            <Avatar initials={c.initials} hue={c.hue} size={24} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium">{c.name}</div>
              <div className="truncate text-[11px] text-faint">via {b.name}</div>
            </div>
            <BoardChip id={c.listingId} className="hidden sm:inline-flex" />
            <TierBadge tier={c.tier} />
            <span className="tnum w-6 text-right text-[11px] text-faint">{c.appliedDaysAgo ? `${c.appliedDaysAgo}d` : "now"}</span>
          </div>
        );
      })}
    </div>
  );
}

function RubricMock() {
  return (
    <div className="space-y-2">
      {(["A", "B", "C"] as const).map((t, i) => {
        const n = CANDIDATES.filter((c) => c.tier === t).length;
        return (
          <div key={t} className="fade-in flex items-center gap-2.5 rounded-card bg-card px-3 py-2.5 shadow-card" style={{ ["--d" as string]: `${250 + i * 120}ms` }}>
            <TierBadge tier={t} />
            <span className="min-w-0 flex-1 text-[11.5px] leading-snug text-muted">{cap(TIER_LABEL[t].split(" — ")[1])}</span>
            <span className="tnum text-[12px] font-medium" style={{ color: TIER_COLOR[t] }}>
              {n}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Mini({ id }: { id: string }) {
  const c = candidateById(id)!;
  return (
    <div className="flex h-8 items-center gap-1.5 rounded-[7px] bg-card px-1.5 shadow-card">
      <Avatar initials={c.initials} hue={c.hue} size={16} />
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{c.name.split(" ")[0]}</span>
      <span className="font-mono text-[10px] font-medium" style={{ color: TIER_COLOR[c.tier] }}>
        {c.tier}
      </span>
    </div>
  );
}

function KanbanMock() {
  // Jomar moves from Screen into the open slot at the top of Interview, once.
  const cols: { label: string; color: string; ids: string[] }[] = [
    { label: "Screen", color: "var(--stage-screen)", ids: ["c16", "c13"] },
    { label: "Interview", color: "var(--stage-interview)", ids: ["c17", "c9"] },
    { label: "Offer", color: "var(--stage-offer)", ids: ["c8", "c1"] },
  ];
  return (
    <div className="relative grid grid-cols-3 gap-2">
      {cols.map((col, i) => (
        <div key={col.label} className="flex flex-col gap-1.5 rounded-card bg-inset/80 p-1.5">
          <div className="flex items-center gap-1 px-0.5 text-[10.5px] font-medium text-muted">
            <span className="size-1.5 rounded-full" style={{ background: col.color }} />
            {col.label}
          </div>
          {i === 1 ? (
            <div className="h-8 rounded-[7px] shadow-[inset_0_0_0_1px_var(--rim-strong)] [background:repeating-linear-gradient(135deg,transparent_0_4px,var(--wash)_4px_5px)]" />
          ) : i === 0 ? (
            <div className="h-8" />
          ) : null}
          {col.ids.map((id) => (
            <Mini key={id} id={id} />
          ))}
        </div>
      ))}
      <div className="k-move absolute top-[28.5px] left-1.5 w-[calc((100%-16px)/3-12px)]">
        <div className="rounded-[7px] shadow-raised">
          <Mini id="c2" />
        </div>
      </div>
    </div>
  );
}

function RoiMock() {
  const rows = BOARDS.map((b) => {
    const ls = LISTINGS.filter((l) => l.board === b.id);
    const aTier = ls.reduce((s, l) => s + (l.applies * l.tierMix.A) / 100, 0);
    const spend = ls.reduce((s, l) => s + l.spend, 0);
    return { b, per100: (aTier / spend) * 100, spend, n: ls.length };
  }).sort((x, y) => y.per100 - x.per100);
  const max = rows[0].per100;
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="mb-2.5 flex justify-between text-[11px] text-faint">
        <span>Job site · what you paid</span>
        <span>Strong candidates per $100</span>
      </div>
      <div className="space-y-2.5">
        {rows.map(({ b, per100, spend, n }, i) => (
          <div key={b.id} className="grid grid-cols-[minmax(0,130px)_1fr_36px] items-center gap-3 sm:grid-cols-[170px_1fr_40px]">
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium">{b.name}</div>
              <div className="text-[10.5px] text-faint">
                ${spend} · {n} post{n > 1 ? "s" : ""}
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-inset">
              <div
                className="grow-x h-full rounded-full"
                style={{ width: `${(per100 / max) * 100}%`, background: b.color, ["--d" as string]: `${300 + i * 120}ms` }}
              />
            </div>
            <span className="tnum text-right text-[12.5px] font-medium">{per100.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScorecardMock() {
  const c = candidateById("c2")!;
  const rows: [string, number][] = [
    ["Release-day ops", 4],
    ["Tools fluency", 4],
    ["Written English", 3],
    ["Availability, PH hours", 4],
  ];
  return (
    <div className="rounded-card bg-card p-3 shadow-card">
      <div className="mb-2.5 flex items-center gap-2">
        <Avatar initials={c.initials} hue={c.hue} size={22} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium">{c.name}</div>
          <div className="truncate text-[10.5px] text-faint">{c.nextStep}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {rows.map(([k, v], i) => (
          <div key={k} className="flex items-center justify-between gap-2 text-[11.5px]">
            <span className="truncate text-muted">{k}</span>
            <span className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className="fade-in size-2 rounded-full"
                  style={{
                    background: n <= v ? "var(--primary)" : "var(--inset)",
                    boxShadow: n <= v ? undefined : "inset 0 0 0 1px var(--rim)",
                    ["--d" as string]: `${300 + i * 90 + n * 50}ms`,
                  }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiMock() {
  const c = candidateById("c17")!;
  const facts = [
    ["Curates three playlists, 180k followers", "From the application, line 2"],
    ["Uses SubmitHub, Groover, Spotify for Artists", "From the skills field"],
    ["Asks $25 / hr, inside the band", "From the pay question"],
  ];
  return (
    <div className="mx-auto w-full max-w-[560px] rounded-card bg-card p-3.5 shadow-card">
      <div className="flex items-center gap-2">
        <Avatar initials={c.initials} hue={c.hue} size={22} />
        <span className="text-[12.5px] font-medium">{c.name}</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-chip bg-primary-tint px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
          <Sparkles className="size-3" /> Drawn only from the application
        </span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {facts.map(([f, src], i) => (
          <li key={f} className="fade-in flex items-start gap-2 text-[12px]" style={{ ["--d" as string]: `${300 + i * 140}ms` }}>
            <Quote className="mt-0.5 size-3 shrink-0 text-faint" />
            <span className="min-w-0 flex-1">
              {f} <span className="text-faint">· {src}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-rim pt-3 text-[11.5px]">
        <span className="text-muted">Suggested</span>
        <TierBadge tier="A" />
        <span className="text-muted">· you decide</span>
        <span className="ml-auto flex gap-1.5">
          <span className="rounded-[6px] bg-inset px-2 py-1 text-muted">Change</span>
          <span className="rounded-[6px] bg-foreground px-2 py-1 font-medium text-background">Accept tier</span>
        </span>
      </div>
    </div>
  );
}

/* --- grid ---------------------------------------------------------------- */

export function Bento() {
  const grid = useRef<HTMLDivElement>(null);
  // One handler for the grid: every card's spotlight follows the same pointer,
  // so the rims light up across neighbours, not just the hovered card.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const cards = grid.current?.querySelectorAll<HTMLElement>(".spot");
    cards?.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - r.left}px`);
      el.style.setProperty("--y", `${e.clientY - r.top}px`);
    });
  };

  return (
    <section id="product" className="scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-[1120px]">
        <div className="reveal max-w-[640px]">
          <div className="text-[12.5px] font-medium text-primary">The product</div>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
            Everything a small team needs to hire, and nothing it doesn’t.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-pretty text-muted">
            No seat pricing, no sales call, no module you have to unlock. One place for every job and every job site.
          </p>
        </div>

        <div ref={grid} onPointerMove={onMove} className="spot-grid mt-12 grid gap-3 md:grid-cols-3">
          <Tile
            className="md:col-span-2"
            icon={Inbox}
            tone="sky"
            title="Every applicant in one place"
            body="Applicants from OnlineJobs.ph, Indeed, Music Business Worldwide and Roster land in one list, marked with the site and the version of the post that brought them."
          >
            <InboxMock />
          </Tile>
          <Tile
            d={80}
            icon={ClipboardCheck}
            tone="mint"
            title="Score everyone the same way"
            body="Say once what a strong candidate looks like. Every applicant lands in tier A, B or C, so the first pass takes minutes."
          >
            <RubricMock />
          </Tile>
          <Tile
            icon={SquareKanban}
            tone="lavender"
            title="See where everyone stands"
            body="New, Screen, Assessment, Interview, Offer. Drag a card to move it; the stage colour tells you how far along it is."
          >
            <KanbanMock />
          </Tile>
          <Tile
            d={80}
            className="md:col-span-2"
            icon={ChartNoAxesColumn}
            tone="butter"
            title="Which job site is worth paying for"
            body="What you paid each site, next to the strong candidates it brought, across every post you ran there."
          >
            <RoiMock />
          </Tile>
          <Tile
            icon={Star}
            tone="peach"
            title="Interview scorecards"
            body="Each interviewer rates the same criteria, so the debrief compares notes instead of impressions."
          >
            <ScorecardMock />
          </Tile>
          <Tile
            d={80}
            className="md:col-span-2"
            icon={Sparkles}
            tone="lavender"
            title="AI summaries that stick to the facts"
            body="The assistant summarises what the candidate sent and shows where each line came from. It suggests a tier; you decide."
          >
            <AiMock />
          </Tile>
        </div>
      </div>
    </section>
  );
}
