import { LayoutDashboard, Megaphone, Plus, Search, SquareKanban, Star, Users } from "lucide-react";
import { Avatar, Kbd, TierBadge } from "@/components/ui";
import { Mark } from "@/components/mark";
import { BOARDS, CANDIDATES, ROLES, STAGES, boardById, listingById, roleById, type Candidate } from "@/data/mock";

/**
 * The pipeline board, drawn in HTML at a fixed design size and scaled by its
 * parent. Every card is a real candidate from mock.ts.
 */
const BOARD_STAGES = STAGES.filter((s) => ["new", "screen", "assess", "interview", "offer"].includes(s.id));

const SHORT_ROLE: Record<string, string> = {
  "va-ops": "Ops VA",
  "campaign-mgr": "Campaign Mgr",
  playlist: "Playlist Coord.",
};

export function BoardChip({ id, className = "" }: { id: Candidate["listingId"] | string; className?: string }) {
  const l = listingById(id);
  const b = boardById(l.board);
  return (
    <span
      className={`inline-flex h-[18px] items-center gap-1 rounded-[5px] px-1 font-mono text-[10px] font-medium ${className}`}
      style={{ color: b.color, background: `color-mix(in oklch, ${b.color} 10%, transparent)` }}
      title={`${b.name}, variant ${l.variant}`}
    >
      {b.short}
      <span className="opacity-60">·{l.variant}</span>
    </span>
  );
}

export function CandidateCard({ c, className = "" }: { c: Candidate; className?: string }) {
  return (
    <div className={`rounded-card bg-card p-2.5 shadow-card ${className}`}>
      <div className="flex items-center gap-2">
        <Avatar initials={c.initials} hue={c.hue} size={22} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium tracking-[-0.01em]">{c.name}</span>
        {c.starred && <Star className="size-3 fill-warning text-warning" />}
        <TierBadge tier={c.tier} />
      </div>
      <div className="mt-1.5 truncate pl-[30px] text-[11px] text-faint">{c.headline}</div>
      <div className="mt-2 flex items-center gap-1.5 pl-[30px]">
        <BoardChip id={c.listingId} />
        <span className="min-w-0 truncate text-[10.5px] whitespace-nowrap text-muted">{SHORT_ROLE[c.roleId]}</span>
        <span className="tnum ml-auto font-mono text-[10.5px] text-muted">{c.score}</span>
      </div>
    </div>
  );
}

export function PipelineMock({ width }: { width: number }) {
  const narrow = width < 900;
  return (
    <div className="flex h-full flex-col bg-background text-foreground" style={{ width }}>
      {/* Window chrome */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-rim bg-canvas px-3.5">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-rim-strong/70" />
          ))}
        </span>
        <span className="mx-auto flex h-6 items-center gap-1.5 rounded-chip bg-card px-3 font-mono text-[11px] text-muted shadow-card">
          recruited.tools/demo/pipeline
        </span>
        <span className="w-10" />
      </div>

      <div className="flex min-h-0 flex-1">
        {!narrow && (
          <aside className="flex w-[196px] shrink-0 flex-col gap-0.5 border-r border-rim bg-canvas/60 p-3">
            <div className="mb-3 flex items-center gap-2 px-1.5 text-[13px] font-semibold tracking-[-0.01em]">
              <Mark size={18} />
              Music Market Agency
            </div>
            <div className="mb-3 flex h-7 items-center gap-2 rounded-control bg-card px-2 text-[12px] text-faint shadow-card">
              <Search className="size-3.5" />
              Search
              <span className="ml-auto">
                <Kbd>⌘K</Kbd>
              </span>
            </div>
            {[
              { icon: LayoutDashboard, label: "Overview" },
              { icon: SquareKanban, label: "Pipeline", active: true },
              { icon: Users, label: "Candidates", n: CANDIDATES.length },
              { icon: Megaphone, label: "Listings", n: 7 },
            ].map(({ icon: Icon, label, active, n }) => (
              <div
                key={label}
                className={`flex h-7 items-center gap-2 rounded-control px-2 text-[12.5px] ${active ? "bg-card font-medium text-foreground shadow-card" : "text-muted"}`}
              >
                <Icon className="size-3.5" />
                {label}
                {n && <span className="tnum ml-auto text-[11px] text-faint">{n}</span>}
              </div>
            ))}
            <div className="mt-5 mb-1 px-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-faint">Roles</div>
            {ROLES.map((r) => (
              <div key={r.id} className="flex h-7 items-center gap-2 rounded-control px-2 text-[12px] text-muted">
                <span className="size-1.5 rounded-full bg-primary/70" />
                <span className="truncate">{r.title}</span>
              </div>
            ))}
            <div className="mt-5 mb-1 px-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-faint">Boards</div>
            {BOARDS.map((b) => (
              <div key={b.id} className="flex h-6 items-center gap-2 px-2 text-[11.5px] text-muted">
                <span className="size-1.5 rounded-full" style={{ background: b.color }} />
                <span className="truncate">{b.name}</span>
              </div>
            ))}
          </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col p-4">
          <div className="mb-3.5 flex items-center gap-3">
            <div>
              <div className="text-[16px] font-semibold tracking-[-0.02em]">Pipeline</div>
              <div className="text-[11.5px] text-muted">
                {roleById("va-ops").title} and 2 more roles · {CANDIDATES.length} candidates
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {!narrow && (
                <div className="flex h-7 items-center rounded-control bg-inset p-0.5 text-[11.5px]">
                  {["All roles", "Ops VA", "Campaign", "Playlist"].map((t, i) => (
                    <span key={t} className={`rounded-[6px] px-2 py-1 ${i === 0 ? "bg-card font-medium shadow-card" : "text-muted"}`}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <span className="inline-flex h-7 items-center gap-1 rounded-control bg-primary px-2.5 text-[12px] font-medium text-on-primary">
                <Plus className="size-3.5" /> New role
              </span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 gap-2.5 overflow-hidden [mask-image:linear-gradient(180deg,#000_78%,transparent)]">
            {BOARD_STAGES.map((s) => {
              const list = CANDIDATES.filter((c) => c.stage === s.id).sort((a, b) => b.score - a.score);
              return (
                <div key={s.id} className="flex w-[164px] min-w-[164px] flex-1 flex-col rounded-panel bg-canvas p-1.5">
                  <div className="flex items-center gap-1.5 px-1.5 pt-1 pb-2 text-[12px] font-medium">
                    <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                    <span className="tnum ml-auto text-[11px] font-normal text-faint">{list.length}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {list.slice(0, 5).map((c) => (
                      <CandidateCard key={c.id} c={c} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
