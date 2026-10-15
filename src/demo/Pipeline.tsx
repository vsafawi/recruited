import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight, CalendarClock, ChevronDown, ChevronRight, Clock, Star, X,
} from "lucide-react";
import { Avatar, Button, ButtonLink, cx, Kbd, StageChip, TierBadge } from "@/components/ui";
import {
  BOARDS, boardById, listingById, roleById, ROLES, STAGES, TIER_COLOR,
  type BoardId, type Candidate, type StageId, type Tier,
} from "@/data/mock";
import { usePeople } from "@/data/store";
import { PageHeader } from "./Shell";

const FLOW: StageId[] = ["new", "screen", "assess", "interview", "offer", "hired"];
const TIERS: Tier[] = ["A", "B", "C"];

function nextStage(s: StageId): StageId | null {
  const i = FLOW.indexOf(s);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
}

function ago(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export default function Pipeline() {
  const [params, setParams] = useSearchParams();
  const roleParam = params.get("role");
  const role = ROLES.some((r) => r.id === roleParam) ? roleParam! : "all";

  const [people, setPeople] = usePeople();
  const [boards, setBoards] = useState<BoardId[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [showRejected, setShowRejected] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageId | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const visible = useMemo(
    () =>
      people.filter(
        (c) =>
          (role === "all" || c.roleId === role) &&
          (!boards.length || boards.includes(listingById(c.listingId).board)) &&
          (!tiers.length || tiers.includes(c.tier)),
      ),
    [people, role, boards, tiers],
  );

  const columns = useMemo(() => {
    const ids: StageId[] = showRejected ? [...FLOW, "rejected"] : FLOW;
    return ids.map((id) => ({
      stage: STAGES.find((s) => s.id === id)!,
      items: visible
        .filter((c) => c.stage === id)
        .sort((a, b) => Number(!!b.starred) - Number(!!a.starred) || b.score - a.score),
    }));
  }, [visible, showRejected]);

  const order = useMemo(() => columns.flatMap((col) => col.items.map((c) => c.id)), [columns]);
  const rejectedCount = visible.filter((c) => c.stage === "rejected").length;
  const activeCount = visible.filter((c) => c.stage !== "rejected" && c.stage !== "hired").length;
  const open = openId ? people.find((c) => c.id === openId) ?? null : null;

  const move = (id: string, stage: StageId) => {
    const who = people.find((c) => c.id === id);
    if (!who || who.stage === stage) return;
    setPeople((ps) => ps.map((c) => (c.id === id ? { ...c, stage } : c)));
    setFlash(id);
    window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 900);
    if (stage === "rejected" && !showRejected) notify(`${who.name} rejected. Show rejected to see them.`);
    else notify(`${who.name} moved to ${STAGES.find((s) => s.id === stage)!.label}.`);
  };

  const toggleStar = (id: string) => setPeople((ps) => ps.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)));

  // Keyboard: j / k step through the board while the panel is open, Esc closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Escape") setOpenId(null);
      if ((e.key === "j" || e.key === "k") && order.length) {
        e.preventDefault();
        setOpenId((cur) => {
          const i = cur ? order.indexOf(cur) : -1;
          if (i < 0) return order[0];
          const n = e.key === "j" ? Math.min(order.length - 1, i + 1) : Math.max(0, i - 1);
          return order[n];
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order]);

  const onDrop = (e: DragEvent, stage: StageId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) move(id, stage);
    setDragId(null);
    setOverStage(null);
  };

  const roleTitle = role === "all" ? "All roles" : roleById(role).title;

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col md:min-h-dvh">
      <PageHeader
        title="Pipeline"
        subtitle={`${activeCount} in progress · ${roleTitle}`}
        actions={
          <Button size="sm" variant={showRejected ? "secondary" : "ghost"} onClick={() => setShowRejected((v) => !v)}>
            <span className="size-1.5 rounded-full" style={{ background: "var(--stage-rejected)" }} />
            {showRejected ? "Hide rejected" : "Show rejected"}
            <span className="tnum text-faint">{rejectedCount}</span>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 px-4 md:px-8">
        <div className="scroll-quiet -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div role="tablist" aria-label="Role" className="inline-flex gap-0.5 rounded-control bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)]">
            {[{ id: "all", title: "All roles" }, ...ROLES].map((r) => {
              const n = people.filter((c) => (r.id === "all" || c.roleId === r.id) && c.stage !== "rejected" && c.stage !== "hired").length;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    const p = new URLSearchParams(params);
                    if (r.id === "all") p.delete("role");
                    else p.set("role", r.id);
                    setParams(p, { replace: true });
                  }}
                  className={cx(
                    "flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[6px] px-2.5 text-[12.5px] transition-colors duration-150",
                    active ? "bg-card font-medium text-foreground shadow-card" : "text-muted hover:text-foreground",
                  )}
                >
                  {r.title}
                  <span className="tnum text-[11px] text-faint">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[11.5px] text-faint">Board</span>
            {BOARDS.map((b) => {
              const on = boards.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => setBoards((xs) => (on ? xs.filter((x) => x !== b.id) : [...xs, b.id]))}
                  aria-pressed={on}
                  title={b.name}
                  className={cx(
                    "flex h-6.5 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition-[background,color,box-shadow] duration-150",
                    on ? "bg-card text-foreground shadow-[0_0_0_1px_var(--rim-strong)]" : "text-muted shadow-[inset_0_0_0_1px_var(--rim)] hover:text-foreground",
                  )}
                >
                  <span className="size-1.5 rounded-full" style={{ background: b.color }} />
                  {b.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="mr-0.5 text-[11.5px] text-faint">Tier</span>
            {TIERS.map((t) => {
              const on = tiers.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => setTiers((xs) => (on ? xs.filter((x) => x !== t) : [...xs, t]))}
                  aria-pressed={on}
                  className={cx(
                    "flex h-6.5 min-w-8 items-center justify-center rounded-full px-2 font-mono text-[11.5px] transition-[background,color,box-shadow] duration-150",
                    on ? "font-medium" : "text-muted shadow-[inset_0_0_0_1px_var(--rim)] hover:text-foreground",
                  )}
                  style={
                    on
                      ? { color: TIER_COLOR[t], background: `color-mix(in oklch, ${TIER_COLOR[t]} 13%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${TIER_COLOR[t]} 35%, transparent)` }
                      : undefined
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
          {(boards.length > 0 || tiers.length > 0) && (
            <button onClick={() => { setBoards([]); setTiers([]); }} className="text-[12px] text-muted hover:text-foreground">
              Clear filters
            </button>
          )}
          <div className="ml-auto hidden items-center gap-1.5 text-[11.5px] text-faint lg:flex">
            Drag cards between stages · <Kbd>J</Kbd><Kbd>K</Kbd> to step through
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="scroll-quiet mt-4 flex-1 overflow-x-auto pb-6">
        <div className="flex min-h-full w-max gap-3 px-4 md:px-8">
          {columns.map(({ stage, items }) => {
            const over = overStage === stage.id && dragId != null;
            return (
              <section
                key={stage.id}
                aria-label={`${stage.label}, ${items.length}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overStage !== stage.id) setOverStage(stage.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage((s) => (s === stage.id ? null : s));
                }}
                onDrop={(e) => onDrop(e, stage.id)}
                className={cx(
                  "flex w-[264px] shrink-0 flex-col rounded-panel p-1.5 transition-[background,box-shadow] duration-150",
                  over ? "bg-primary-tint shadow-[inset_0_0_0_1.5px_color-mix(in_oklch,var(--primary)_45%,transparent)]" : "bg-canvas shadow-[inset_0_0_0_1px_var(--rim)]",
                )}
              >
                <header className="flex h-8 items-center gap-2 px-2">
                  <span className="size-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-[12.5px] font-medium">{stage.label}</span>
                  <span className="tnum text-[12px] text-faint">{items.length}</span>
                </header>
                <div className="flex flex-col gap-1.5">
                  {items.map((c) => (
                    <PipelineCard
                      key={c.id}
                      c={c}
                      active={openId === c.id}
                      dragging={dragId === c.id}
                      flash={flash === c.id}
                      onOpen={() => setOpenId(c.id)}
                      onStar={() => toggleStar(c.id)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(c.id);
                      }}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className={cx("flex h-20 items-center justify-center rounded-card border border-dashed text-[12px] transition-colors", over ? "border-primary/50 text-primary" : "border-rim text-faint")}>
                      {over ? "Drop here" : "No one here"}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <SlideOver
        c={open}
        onClose={() => setOpenId(null)}
        onMove={move}
        onStar={toggleStar}
        onSchedule={(c) => notify(`Scheduling link sent to ${c.name.split(" ")[0]}. Nothing is sent in the demo.`)}
      />

      {/* Toast */}
      <div
        aria-live="polite"
        className={cx(
          "pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 transition-[opacity,transform] duration-200 ease-settle md:left-[calc(50%+120px)]",
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {toast && <div className="max-w-[calc(100vw-32px)] rounded-control bg-foreground px-3.5 py-2 text-[12.5px] text-background shadow-overlay">{toast}</div>}
      </div>
    </div>
  );
}

function PipelineCard({
  c, active, dragging, flash, onOpen, onStar, onDragStart, onDragEnd,
}: {
  c: Candidate;
  active: boolean;
  dragging: boolean;
  flash: boolean;
  onOpen: () => void;
  onStar: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
}) {
  const l = listingById(c.listingId);
  const b = boardById(l.board);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      role="button"
      tabIndex={0}
      aria-label={`${c.name}, tier ${c.tier}, score ${c.score}`}
      className={cx(
        "group relative cursor-grab select-none rounded-card bg-card p-2.5 text-left transition-[box-shadow,background,opacity] duration-300 ease-settle active:cursor-grabbing",
        active || flash ? "shadow-[0_0_0_1.5px_var(--primary),0_4px_10px_oklch(0_0_0/0.06)]" : "shadow-card hover:shadow-raised",
        flash && !active && "bg-primary-tint",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar initials={c.initials} hue={c.hue} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium leading-5">{c.name}</span>
            <TierBadge tier={c.tier} className="shrink-0" />
            <span className="tnum ml-auto text-[12px] font-medium text-muted">{c.score}</span>
          </div>
          <p className="truncate text-[12px] leading-[18px] text-muted">{c.headline}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11.5px] text-faint">
        <span className="inline-flex items-center gap-1 rounded-[5px] bg-inset px-1.5 py-px font-mono text-[10.5px] text-muted" title={`${b.name}, variant ${l.variant}`}>
          <span className="size-1.5 rounded-full" style={{ background: b.color }} />
          {b.short} · {l.variant}
        </span>
        <span className="tnum">{ago(c.appliedDaysAgo)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onStar(); }}
          aria-label={c.starred ? "Unstar" : "Star"}
          aria-pressed={!!c.starred}
          className={cx(
            "ml-auto -mr-1 rounded p-0.5 transition-[color,opacity] duration-150",
            c.starred ? "text-warning" : "text-faint opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100",
          )}
        >
          <Star className="size-3.5" fill={c.starred ? "currentColor" : "none"} />
        </button>
      </div>
      {c.nextStep && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-rim pt-2 text-[11.5px] text-muted">
          <CalendarClock className="size-3 shrink-0 text-faint" />
          <span className="truncate">{c.nextStep}</span>
        </div>
      )}
    </div>
  );
}

function SlideOver({
  c, onClose, onMove, onStar, onSchedule,
}: {
  c: Candidate | null;
  onClose: () => void;
  onMove: (id: string, s: StageId) => void;
  onStar: (id: string) => void;
  onSchedule: (c: Candidate) => void;
}) {
  // Keep the last candidate around so the panel can animate out with content.
  const [shown, setShown] = useState<Candidate | null>(c);
  const [moveOpen, setMoveOpen] = useState(false);
  useEffect(() => {
    if (c) setShown(c);
    setMoveOpen(false);
  }, [c]);
  const isOpen = !!c;
  const x = c ?? shown;

  return (
    <>
      <div
        onClick={onClose}
        className={cx("fixed inset-0 z-40 bg-black/10 transition-opacity duration-200 lg:bg-transparent", isOpen ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <aside
        aria-hidden={!isOpen}
        aria-label="Candidate summary"
        className={cx(
          "scroll-quiet fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col overflow-y-auto bg-card shadow-overlay transition-transform duration-300 ease-enter",
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-[calc(100%+24px)]",
        )}
      >
        {x && <PanelBody key={x.id} c={x} onClose={onClose} onMove={onMove} onStar={onStar} onSchedule={onSchedule} moveOpen={moveOpen} setMoveOpen={setMoveOpen} />}
      </aside>
    </>
  );
}

function PanelBody({
  c, onClose, onMove, onStar, onSchedule, moveOpen, setMoveOpen,
}: {
  c: Candidate;
  onClose: () => void;
  onMove: (id: string, s: StageId) => void;
  onStar: (id: string) => void;
  onSchedule: (c: Candidate) => void;
  moveOpen: boolean;
  setMoveOpen: (v: boolean) => void;
}) {
  const l = listingById(c.listingId);
  const b = boardById(l.board);
  const r = roleById(c.roleId);
  const next = nextStage(c.stage);
  const rejected = c.stage === "rejected";

  return (
    <>
      <div className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-rim bg-card/90 px-4 backdrop-blur">
        <StageChip stage={c.stage} />
        <span className="hidden items-center gap-1 text-[11.5px] text-faint sm:flex"><Kbd>J</Kbd><Kbd>K</Kbd></span>
        <button onClick={() => onStar(c.id)} aria-label={c.starred ? "Unstar" : "Star"} className={cx("ml-auto rounded-control p-1.5 hover:bg-[var(--wash)]", c.starred ? "text-warning" : "text-muted")}>
          <Star className="size-4" fill={c.starred ? "currentColor" : "none"} />
        </button>
        <button onClick={onClose} aria-label="Close" className="rounded-control p-1.5 text-muted hover:bg-[var(--wash)] hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-start gap-3">
          <Avatar initials={c.initials} hue={c.hue} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em]">{c.name}</h2>
              <TierBadge tier={c.tier} />
            </div>
            <p className="text-[13px] text-muted">{c.headline}</p>
          </div>
          <div className="text-right">
            <div className="tnum text-[22px] font-semibold leading-none tracking-[-0.02em]">{c.score}</div>
            <div className="mt-1 text-[11px] text-faint">score</div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-card bg-rim shadow-[0_0_0_1px_var(--rim)]">
          {[
            { k: "Role", v: r.title },
            { k: "Applied", v: ago(c.appliedDaysAgo) },
            { k: "Location", v: c.location },
            { k: "Asking", v: c.ask },
          ].map(({ k, v }) => (
            <div key={k} className="min-w-0 bg-card px-3 py-2">
              <dt className="text-[11px] text-faint">{k}</dt>
              <dd className="truncate text-[12.5px]">{v}</dd>
            </div>
          ))}
        </dl>

        {c.nextStep && (
          <div className="mt-3 flex items-center gap-2 rounded-card bg-primary-tint px-3 py-2 text-[12.5px] text-foreground">
            <Clock className="size-3.5 text-primary" />
            <span><span className="text-muted">Next:</span> {c.nextStep}</span>
          </div>
        )}

        <div className="mt-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-faint">Source</div>
          <div className="mt-2 rounded-card p-3 shadow-[0_0_0_1px_var(--rim)]">
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="size-2 rounded-full" style={{ background: b.color }} />
              <span className="font-medium">{b.name}</span>
              <span className="rounded-[5px] bg-inset px-1.5 font-mono text-[10.5px] text-muted">Variant {l.variant}</span>
              {l.status === "winner" && <span className="ml-auto text-[11px] font-medium text-success">Winner</span>}
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug">{l.headline}</p>
            <p className="mt-1 text-[12px] text-muted">Pay band {l.payBand} · testing {l.hypothesis.toLowerCase()}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-faint">Skills on the application</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.skills.map((s) => (
              <span key={s} className="rounded-chip bg-inset px-2 py-0.5 text-[12px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-rim px-5 py-4">
        {next && !rejected && (
          <Button variant="primary" className="mb-2 w-full" onClick={() => onMove(c.id, next)}>
            Advance to {STAGES.find((s) => s.id === next)!.label} <ArrowRight className="size-3.5" />
          </Button>
        )}
        {rejected && (
          <Button variant="primary" className="mb-2 w-full" onClick={() => onMove(c.id, "screen")}>Restore to Screen</Button>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={() => onSchedule(c)}><CalendarClock className="size-3.5" /> Schedule</Button>
          <div className="relative">
            <Button className="w-full" onClick={() => setMoveOpen(!moveOpen)} aria-expanded={moveOpen}>
              Move to <ChevronDown className="size-3.5" />
            </Button>
            {moveOpen && (
              <div className="absolute bottom-full left-0 z-20 mb-1.5 w-44 rounded-card bg-card p-1 shadow-overlay">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    disabled={s.id === c.stage}
                    onClick={() => { onMove(c.id, s.id); setMoveOpen(false); }}
                    className="flex h-7.5 w-full items-center gap-2 rounded-[6px] px-2 text-[12.5px] hover:bg-[var(--wash)] disabled:opacity-40"
                  >
                    <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                    {s.id === c.stage && <span className="ml-auto text-[11px] text-faint">Current</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button disabled={rejected} style={{ color: "var(--destructive)" }} onClick={() => onMove(c.id, "rejected")}>Reject</Button>
        </div>
        <ButtonLink to={`/demo/candidates/${c.id}`} variant="ink" className="mt-3 w-full">
          Open profile <ArrowRight className="size-3.5" />
        </ButtonLink>
        <Link to={`/demo/listings`} className="mt-2 flex items-center justify-center gap-1 text-[12px] text-muted hover:text-foreground">
          See how {b.short} · {l.variant} is performing <ChevronRight className="size-3" />
        </Link>
      </div>
    </>
  );
}
